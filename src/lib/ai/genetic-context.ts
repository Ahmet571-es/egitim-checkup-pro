/**
 * DMIT (Genetik) raporlarını AI prompt context'ine dönüştürür.
 *
 * KVKK m.6 KRİTİK: Bu fonksiyon SADECE öğretmen audience'lı raporlarda
 * çağrılmalı. Veli ve öğrenci versiyonlarına ham genetik veri AI'ya
 * gönderilmemelidir.
 *
 * Dönüş: PdfAttachment[] — Claude SDK document content block için hazır
 */
import { createAdminClient } from '@/lib/supabase/admin';
import type { PdfAttachment } from './claude-client';

const BUCKET_NAME = 'genetic-reports';

// Anthropic document content block için pratik üst sınır.
// Tek dokümanın çok büyük olması context'i şişirir + maliyeti artırır.
// 10MB'tan büyük PDF'leri atlıyoruz (uyarı log + skip).
const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;

// Tek raporda en fazla kaç DMIT eki yollansın? Birden fazla DMIT olduğunda
// context patlamasını önlemek için.
const MAX_ATTACHMENTS = 3;

export interface FetchGeneticContextOptions {
  /** Belirli rapor ID'leri filtresi (verilmezse tüm öğrenci raporları) */
  geneticReportIds?: string[];
}

export interface GeneticContextResult {
  attachments: PdfAttachment[];
  count: number;
  skippedReasons: string[];
}

/**
 * Bir öğrencinin DMIT raporlarını Storage'dan indirip Claude için
 * base64-encoded PdfAttachment[] döndürür.
 *
 * @param studentId Öğrenci profil ID'si
 * @param options Opsiyonel filtreleme
 */
export async function fetchGeneticContext(
  studentId: string,
  options: FetchGeneticContextOptions = {},
): Promise<GeneticContextResult> {
  const admin = createAdminClient();
  const skipped: string[] = [];

  // 1) Öğrencinin DMIT rapor metadata'sını çek
  let query = admin
    .from('genetic_reports')
    .select('id, file_path, original_filename, file_size')
    .eq('student_id', studentId)
    .order('uploaded_at', { ascending: true });

  if (options.geneticReportIds && options.geneticReportIds.length > 0) {
    query = query.in('id', options.geneticReportIds);
  }

  const { data: reports, error: fetchErr } = await query;

  if (fetchErr) {
    console.warn('[genetic-context] metadata fetch error:', fetchErr.message);
    return { attachments: [], count: 0, skippedReasons: [`fetch hatası: ${fetchErr.message}`] };
  }

  if (!reports || reports.length === 0) {
    return { attachments: [], count: 0, skippedReasons: [] };
  }

  // 2) Her PDF'i Storage'dan indir + base64'e çevir
  const attachments: PdfAttachment[] = [];
  const limited = reports.slice(0, MAX_ATTACHMENTS);
  if (reports.length > MAX_ATTACHMENTS) {
    skipped.push(`${reports.length - MAX_ATTACHMENTS} ek DMIT raporu context limit'i nedeniyle atlandı`);
  }

  for (const rep of limited) {
    if (!rep.file_path) {
      skipped.push(`${rep.original_filename}: file_path yok`);
      continue;
    }
    if (rep.file_size && rep.file_size > MAX_PDF_SIZE_BYTES) {
      skipped.push(`${rep.original_filename}: dosya 10MB'tan büyük (${(rep.file_size / 1024 / 1024).toFixed(1)}MB)`);
      continue;
    }

    try {
      const { data: blob, error: dlErr } = await admin.storage
        .from(BUCKET_NAME)
        .download(rep.file_path);

      if (dlErr || !blob) {
        skipped.push(`${rep.original_filename}: indirme hatası (${dlErr?.message ?? 'bilinmeyen'})`);
        continue;
      }

      // Blob → ArrayBuffer → base64
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Boyut kontrolü (file_size metadata yanlış olabilir)
      if (buffer.length > MAX_PDF_SIZE_BYTES) {
        skipped.push(`${rep.original_filename}: indirilen dosya 10MB'tan büyük`);
        continue;
      }

      const base64 = buffer.toString('base64');
      attachments.push({
        filename: rep.original_filename || `dmit_${rep.id.slice(0, 8)}.pdf`,
        base64,
      });
    } catch (e) {
      skipped.push(`${rep.original_filename}: işleme hatası (${(e as Error).message})`);
    }
  }

  return {
    attachments,
    count: attachments.length,
    skippedReasons: skipped,
  };
}
