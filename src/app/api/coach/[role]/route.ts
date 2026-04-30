/**
 * POST /api/coach/[role]
 *
 * Faz 8: 3 farklı AI Koç (öğrenci/veli/öğretmen) için ortak endpoint.
 *
 * Body: { message, conversation_id?, student_id? }
 *   • conversation_id yoksa yeni sohbet açılır
 *   • student_id parent/teacher modunda gerekli (kim hakkında konuşuluyor)
 *
 * Yetki kuralları:
 *   • [role] === 'student' → caller role 'student' olmalı, student_id = caller.id
 *   • [role] === 'parent' → caller role 'parent' olmalı, student_id caller'ın çocuğu
 *   • [role] === 'teacher' → caller role 'teacher' olmalı, student_id caller'a atanmış
 *
 * KVKK matrisi:
 *   • student koçu skor görmez (sadece güçlü/gelişim alan özetleri)
 *   • parent koçu skorları görür ama ham cevapları görmez
 *   • teacher koçu tam veri
 *
 * Güvenlik filtresi: kriz sinyalinde flagged_safety + özel kriz prompt'u.
 *
 * GET /api/coach/[role]?conversation_id=X
 *   Bir conversation'ın history'sini döner (yetki check).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateAIReport } from '@/lib/ai/claude-client';
import {
  buildStudentCoachPrompt,
  buildParentCoachPrompt,
  buildTeacherCoachPrompt,
  type ChatMessage,
} from '@/lib/ai/prompts/coach-prompts';
import { checkMessageSafety, CRISIS_RESPONSE_INSTRUCTION } from '@/lib/ai/safety-filter';

export const runtime = 'nodejs';
export const maxDuration = 120;

const TEST_LABELS: Record<string, string> = {
  enneagram: 'Enneagram Kişilik',
  vark: 'VARK Öğrenme Stilleri',
  holland: 'Meslek Testi',
  coklu_zeka: 'Çoklu Zekâ',
  'coklu-zeka': 'Çoklu Zekâ',
  sinav_kaygisi: 'Sınav Kaygısı',
  'sinav-kaygisi': 'Sınav Kaygısı',
  calisma_davranisi: 'Çalışma Davranışı',
  'calisma-davranisi': 'Çalışma Davranışı',
  akademik_analiz: 'Akademik Analiz',
  'akademik-analiz': 'Akademik Analiz',
  hizli_okuma: 'Hızlı Okuma',
  'hizli-okuma': 'Hızlı Okuma',
  d2_dikkat: 'D2 Dikkat Testi',
  'd2-dikkat': 'D2 Dikkat Testi',
  sag_sol_beyin: 'Sağ-Sol Beyin Dominansı',
  'sag-sol-beyin': 'Sağ-Sol Beyin Dominansı',
};
const labelFor = (k: string) => TEST_LABELS[k] || k.replace(/[_-]/g, ' ');

const VALID_ROLES = ['student', 'parent', 'teacher'] as const;
type CoachRole = typeof VALID_ROLES[number];

const DAILY_LIMIT_PER_ROLE: Record<CoachRole, number> = {
  student: 10,   // çocuklar daha fazla mesaj atabilir
  parent: 5,
  teacher: 20,   // profesyonel kullanım
};

// ── Yardımcı: prompt injection sanitize ──
function sanitizeInput(text: string): string {
  return text
    .replace(/```/g, '')
    .replace(/ignore previous instructions/gi, '')
    .replace(/system prompt/gi, '')
    .replace(/you are now/gi, '')
    .slice(0, 800);
}

// ── Yardımcı: öğrenci verilerini KVKK matrisine göre hazırla ──
async function buildTestSummariesForRole(
  studentId: string,
  role: CoachRole,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
) {
  // Test sonuçlarını çek
  const { data: results } = await admin
    .from('test_results')
    .select('test_type, scores, ai_report, created_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (!results || results.length === 0) return [];

  // Test bazlı en son sonucu al
  const latestByType = new Map<string, typeof results[0]>();
  const countByType = new Map<string, number>();
  for (const r of results) {
    if (!latestByType.has(r.test_type)) latestByType.set(r.test_type, r);
    countByType.set(r.test_type, (countByType.get(r.test_type) || 0) + 1);
  }

  return Array.from(latestByType.entries()).map(([testType, r]) => {
    const item: {
      test_label: string;
      test_type: string;
      score?: number;
      attempt_count?: number;
      latest_date?: string;
      strength_summary?: string;
      growth_area_summary?: string;
    } = {
      test_label: labelFor(testType),
      test_type: testType,
    };

    // KVKK: student koçu skor GÖRMEZ
    if (role !== 'student') {
      // Skor: scores objesinden ana skor çıkar (test bazında değişebilir, basit toplam yaklaşımı)
      const scoresObj = (r.scores as Record<string, unknown>) || {};
      const numericScores = Object.values(scoresObj).filter(
        (v) => typeof v === 'number',
      ) as number[];
      if (numericScores.length > 0) {
        const avg = numericScores.reduce((a, b) => a + b, 0) / numericScores.length;
        item.score = Math.round(avg * 10) / 10;
      }
      item.attempt_count = countByType.get(testType);
      item.latest_date = new Date(r.created_at).toLocaleDateString('tr-TR', {
        year: 'numeric', month: 'short', day: 'numeric',
      });
    }

    // Tüm rollere: AI raporundan kısa güçlü/gelişim özeti çıkar
    // (basit heuristic — gerçek implementasyonda daha sofistike olabilir)
    if (r.ai_report && typeof r.ai_report === 'string') {
      const report = r.ai_report.toLowerCase();
      // Çok kısa özetler — AI'a bilgi vermek için yeterli
      if (report.includes('güçlü') || report.includes('iyi') || report.includes('yüksek')) {
        item.strength_summary = `${item.test_label} için olumlu bulgular var.`;
      }
      if (report.includes('gelişim') || report.includes('zorluk') || report.includes('düşük')) {
        item.growth_area_summary = `${item.test_label} için gelişim alanları görünüyor.`;
      }
    }

    return item;
  });
}

// ════════ POST: Yeni mesaj ════════
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ role: string }> },
) {
  try {
    const { role: roleParam } = await context.params;

    if (!VALID_ROLES.includes(roleParam as CoachRole)) {
      return NextResponse.json(
        { error: `Geçersiz koç rolü: ${roleParam}. Beklenen: student, parent, teacher.` },
        { status: 400 },
      );
    }
    const coachRole = roleParam as CoachRole;

    const body = await request.json().catch(() => ({}));
    const rawMessage = body.message;
    const conversationId: string | undefined = body.conversation_id;
    const studentIdFromBody: string | undefined = body.student_id;

    if (!rawMessage || typeof rawMessage !== 'string' || rawMessage.trim().length === 0) {
      return NextResponse.json({ error: 'Mesaj boş olamaz.' }, { status: 400 });
    }

    const message = sanitizeInput(rawMessage);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: callerProfile } = await admin
      .from('profiles')
      .select('id, role, school_id, full_name')
      .eq('id', user.id)
      .maybeSingle();

    if (!callerProfile) {
      return NextResponse.json({ error: 'Profil bulunamadı.' }, { status: 403 });
    }

    // ── Yetki: caller role'ü ile coach role'ü eşleşmeli ──
    if (callerProfile.role !== coachRole) {
      return NextResponse.json(
        { error: `${coachRole} koçu yalnızca ${coachRole} rolünden erişilebilir.` },
        { status: 403 },
      );
    }

    // ── student_id belirleme ──
    let targetStudentId: string;
    if (coachRole === 'student') {
      // Öğrenci kendi koçunu kullanır → student_id = kendi id
      targetStudentId = user.id;
    } else {
      // Veli/öğretmen → student_id body'den gelmeli
      if (!studentIdFromBody) {
        return NextResponse.json(
          { error: 'Veli/öğretmen koçu için student_id gerekli.' },
          { status: 400 },
        );
      }
      targetStudentId = studentIdFromBody;

      // Yetki: parent için kendi çocuğu, teacher için atanmış öğrenci
      if (coachRole === 'parent') {
        const { data: link } = await admin
          .from('parent_students')
          .select('student_id')
          .eq('parent_id', user.id)
          .eq('student_id', targetStudentId)
          .maybeSingle();
        if (!link) {
          return NextResponse.json(
            { error: 'Bu çocuk sizin velisi olduğunuz biri değil.' },
            { status: 403 },
          );
        }
      } else if (coachRole === 'teacher') {
        const { data: studentAuth } = await admin.auth.admin.getUserById(targetStudentId);
        const assignedTeacherId = studentAuth?.user?.user_metadata?.assigned_teacher_id;
        if (assignedTeacherId !== user.id) {
          return NextResponse.json(
            { error: 'Bu öğrenci size atanmış değil.' },
            { status: 403 },
          );
        }
      }
    }

    // ── Günlük limit kontrolü ──
    const today = new Date().toISOString().split('T')[0];
    const { count: todayCount } = await admin
      .from('coach_messages')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'user')
      .gte('created_at', `${today}T00:00:00`)
      .in('conversation_id',
        // alt-query: caller'ın bugün açtığı/kullandığı conversation'lar
        (await admin
          .from('coach_conversations')
          .select('id')
          .eq('user_id', user.id)
        ).data?.map((c: { id: string }) => c.id) || ['00000000-0000-0000-0000-000000000000'],
      );

    const limit = DAILY_LIMIT_PER_ROLE[coachRole];
    if ((todayCount || 0) >= limit) {
      return NextResponse.json(
        { error: `Günlük ${limit} mesaj limitine ulaştınız. Yarın tekrar deneyin.` },
        { status: 429 },
      );
    }

    // ── Conversation oluştur veya getir ──
    let conv: { id: string; user_id: string; user_role: string; student_id: string | null };

    if (conversationId) {
      const { data } = await admin
        .from('coach_conversations')
        .select('id, user_id, user_role, student_id')
        .eq('id', conversationId)
        .maybeSingle();

      if (!data || data.user_id !== user.id) {
        return NextResponse.json({ error: 'Sohbet bulunamadı.' }, { status: 404 });
      }
      conv = data;
    } else {
      const { data, error } = await admin
        .from('coach_conversations')
        .insert({
          user_id: user.id,
          user_role: coachRole,
          student_id: coachRole === 'student' ? user.id : targetStudentId,
          title: `${coachRole === 'student' ? 'Öğrenci' : coachRole === 'parent' ? 'Veli' : 'Öğretmen'} Koçu — ${new Date().toLocaleDateString('tr-TR')}`,
        })
        .select('id, user_id, user_role, student_id')
        .single();

      if (error || !data) {
        console.error('[coach POST] conversation create', error);
        return NextResponse.json({ error: 'Sohbet oluşturulamadı.' }, { status: 500 });
      }
      conv = data;
    }

    // ── Güvenlik filtresi: kullanıcı mesajını tara (sadece student için kritik) ──
    const safetyCheck = checkMessageSafety(message);

    // ── Mesaj geçmişini çek (son 20 mesaj — context için) ──
    const { data: historyRows } = await admin
      .from('coach_messages')
      .select('role, content')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: false })
      .limit(20);

    const history: ChatMessage[] = (historyRows || [])
      .reverse()
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // ── Öğrenci verisi & system prompt oluştur ──
    const { data: student } = await admin
      .from('profiles')
      .select('id, full_name, grade')
      .eq('id', targetStudentId)
      .maybeSingle();

    if (!student) {
      return NextResponse.json({ error: 'Öğrenci bulunamadı.' }, { status: 404 });
    }

    const testSummaries = await buildTestSummariesForRole(targetStudentId, coachRole, admin);

    const ctx = {
      studentName: student.full_name || 'Öğrenci',
      studentGrade: student.grade,
      testSummaries,
    };

    let systemPrompt: string;
    if (coachRole === 'student') {
      systemPrompt = buildStudentCoachPrompt(ctx);
    } else if (coachRole === 'parent') {
      systemPrompt = buildParentCoachPrompt(ctx, callerProfile.full_name || undefined);
    } else {
      systemPrompt = buildTeacherCoachPrompt(ctx, callerProfile.full_name || undefined);
    }

    // Güvenlik tetiklendiyse system prompt'a kriz modu ekle
    if (safetyCheck.flagged) {
      systemPrompt += CRISIS_RESPONSE_INSTRUCTION;
    }

    // ── Kullanıcı mesajını DB'ye kaydet ──
    await admin.from('coach_messages').insert({
      conversation_id: conv.id,
      role: 'user',
      content: message,
      flagged_safety: safetyCheck.flagged,
      flag_reason: safetyCheck.reason,
    });

    // ── Claude'dan yanıt al ──
    // generateAIReport tek prompt alıyor — system + history + new message hepsi tek metne dönüşür
    const fullPrompt = `${systemPrompt}\n\n═══ Sohbet Geçmişi ═══\n${
      history.map((h) => `${h.role === 'user' ? 'KULLANICI' : 'KOÇ'}: ${h.content}`).join('\n')
    }\n\nKULLANICI: ${message}\n\nKOÇ:`;

    const aiResponse = await generateAIReport(fullPrompt, {
      maxTokens: 800,         // sohbet — kısa cevaplar
      temperature: 0.6,       // doğal sohbet için biraz çeşitlilik
      enableContinuation: false,
    });

    // ── Asistan mesajını DB'ye kaydet ──
    await admin.from('coach_messages').insert({
      conversation_id: conv.id,
      role: 'assistant',
      content: aiResponse,
      flagged_safety: false,
    });

    // ── Conversation last_message_at ve count güncelle ──
    await admin
      .from('coach_conversations')
      .update({
        last_message_at: new Date().toISOString(),
        message_count: (history.length + 2),
      })
      .eq('id', conv.id);

    return NextResponse.json({
      conversation_id: conv.id,
      reply: aiResponse,
      flagged_safety: safetyCheck.flagged,
      remaining_today: limit - (todayCount || 0) - 1,
    });
  } catch (err) {
    console.error('[coach POST]', err);
    const msg = err instanceof Error ? err.message : 'Sunucu hatası.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ════════ GET: Conversation history ════════
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ role: string }> },
) {
  try {
    const { role: roleParam } = await context.params;
    if (!VALID_ROLES.includes(roleParam as CoachRole)) {
      return NextResponse.json({ error: 'Geçersiz rol.' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversation_id');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 });
    }

    const admin = createAdminClient();

    // conversation_id verilmişse o sohbeti getir, yoksa kullanıcının tüm sohbet listesi
    if (conversationId) {
      const { data: conv } = await admin
        .from('coach_conversations')
        .select('id, user_id, user_role, student_id, title, message_count')
        .eq('id', conversationId)
        .maybeSingle();

      if (!conv || conv.user_id !== user.id) {
        return NextResponse.json({ error: 'Sohbet bulunamadı.' }, { status: 404 });
      }

      const { data: messages } = await admin
        .from('coach_messages')
        .select('id, role, content, flagged_safety, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      return NextResponse.json({
        conversation: conv,
        messages: messages || [],
      });
    }

    // Liste mod: kullanıcının tüm sohbetleri (bu role için)
    const { data: list } = await admin
      .from('coach_conversations')
      .select('id, title, last_message_at, message_count, student_id')
      .eq('user_id', user.id)
      .eq('user_role', roleParam)
      .eq('is_archived', false)
      .order('last_message_at', { ascending: false })
      .limit(20);

    return NextResponse.json({
      conversations: list || [],
    });
  } catch (err) {
    console.error('[coach GET]', err);
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 });
  }
}
