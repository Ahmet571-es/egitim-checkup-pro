/**
 * Faz 6: PDF birleştirme — Harmanlanmış raporun sonuna genetik PDF ekleri gömer.
 *
 * Akış:
 *   1. Holistic raporun ana PDF'i (pdfmake çıktısı) → buffer
 *   2. holistic_report_attachments tablosundan eklenenleri çek (sıralı)
 *   3. Her attachment için Supabase Storage'dan genetik PDF'i indir
 *   4. pdf-lib ile main PDF'i yükle, her ek için sayfalarını copy ederek append
 *   5. Birleştirilmiş PDF'i Uint8Array olarak döndür
 *
 * Hata toleransı: Bir genetik PDF indirilemezse veya bozuksa, o ek atlanır;
 * diğer ekler ve ana rapor sağlam kalır. Hata log'lanır.
 */
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'genetic-reports';

interface AttachmentRow {
  id: string;
  position: number;
  genetic_report_id: string;
  genetic_reports: {
    id: string;
    file_path: string;
    original_filename: string;
  } | {
    id: string;
    file_path: string;
    original_filename: string;
  }[];
}

/**
 * Ana PDF buffer'ını alır, holistic raporun eklenen genetik PDF'lerini ekler.
 * Eklenecek PDF yoksa veya tablo henüz yoksa, orijinal buffer aynen döner.
 *
 * @param mainPdfBuffer - pdfmake'in ürettiği ana rapor PDF'i (Buffer)
 * @param holisticReportId - rapor UUID
 * @param admin - service role Supabase client (createAdminClient)
 * @returns Birleştirilmiş PDF (Uint8Array) veya hata durumunda orijinal
 */
export async function mergeGeneticAttachments(
  mainPdfBuffer: Buffer,
  holisticReportId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: SupabaseClient<any, any, any>,
): Promise<Uint8Array> {
  // 1. Eklenenleri çek (file_path için JOIN)
  let attachments: AttachmentRow[] = [];
  try {
    const { data, error } = await admin
      .from('holistic_report_attachments')
      .select(`
        id,
        position,
        genetic_report_id,
        genetic_reports!inner (
          id, file_path, original_filename
        )
      `)
      .eq('holistic_report_id', holisticReportId)
      .order('position', { ascending: true });

    if (error) {
      // Tablo henüz yok (Faz 6 migration uygulanmadı) ya da başka hata.
      // Sessiz failback: orijinal PDF'i döndür.
      console.warn('[pdf-merger] attachments fetch error:', error.message);
      return new Uint8Array(mainPdfBuffer);
    }
    attachments = (data || []) as AttachmentRow[];
  } catch (e) {
    console.warn('[pdf-merger] unexpected fetch error:', e);
    return new Uint8Array(mainPdfBuffer);
  }

  if (attachments.length === 0) {
    // Ekli PDF yok — orijinal buffer'ı döndür
    return new Uint8Array(mainPdfBuffer);
  }

  // 2. Ana PDF'i pdf-lib ile yükle
  let mergedPdf: PDFDocument;
  try {
    mergedPdf = await PDFDocument.load(mainPdfBuffer);
  } catch (e) {
    console.error('[pdf-merger] main PDF load error:', e);
    return new Uint8Array(mainPdfBuffer);
  }

  const helveticaBold = await mergedPdf.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await mergedPdf.embedFont(StandardFonts.Helvetica);

  // 3. Her ek için: storage'dan indir, sayfaları kopyala, append
  for (const attach of attachments) {
    const gr = Array.isArray(attach.genetic_reports)
      ? attach.genetic_reports[0]
      : attach.genetic_reports;

    if (!gr?.file_path) {
      console.warn(`[pdf-merger] attachment ${attach.id} missing file_path`);
      continue;
    }

    try {
      const { data: blob, error: downloadErr } = await admin.storage
        .from(BUCKET_NAME)
        .download(gr.file_path);

      if (downloadErr || !blob) {
        console.warn(`[pdf-merger] download failed for ${gr.file_path}:`, downloadErr);
        continue;
      }

      const attachBuffer = Buffer.from(await blob.arrayBuffer());

      let attachPdf: PDFDocument;
      try {
        // ignoreEncryption: bazı PDF'ler şifreli ama owner password yoksa açılır
        attachPdf = await PDFDocument.load(attachBuffer, { ignoreEncryption: true });
      } catch (loadErr) {
        console.warn(`[pdf-merger] PDF load failed for ${gr.original_filename}:`, loadErr);
        continue;
      }

      // Önce ek için ayırıcı sayfa (genetik raporun adı)
      const separator = mergedPdf.addPage();
      const { width, height } = separator.getSize();

      separator.drawText('GENETIK RAPOR EK', {
        x: 50,
        y: height - 100,
        size: 24,
        font: helveticaBold,
        color: rgb(0.4, 0.2, 0.7),
      });

      // pdf-lib WinAnsi encoding'le çalışır; Türkçe karakterleri ASCII'ye düşür
      const safeName = gr.original_filename
        .replace(/ç/g, 'c').replace(/Ç/g, 'C')
        .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
        .replace(/ı/g, 'i').replace(/İ/g, 'I')
        .replace(/ö/g, 'o').replace(/Ö/g, 'O')
        .replace(/ş/g, 's').replace(/Ş/g, 'S')
        .replace(/ü/g, 'u').replace(/Ü/g, 'U')
        .replace(/[^\x20-\x7E]/g, '?');

      separator.drawText(safeName, {
        x: 50,
        y: height - 140,
        size: 14,
        font: helvetica,
        color: rgb(0.2, 0.2, 0.2),
        maxWidth: width - 100,
      });

      separator.drawText(
        'Bu sayfa, asagidaki genetik raporun ek olarak eklendigini belirtir.',
        {
          x: 50,
          y: height - 180,
          size: 11,
          font: helvetica,
          color: rgb(0.4, 0.4, 0.4),
          maxWidth: width - 100,
        },
      );

      separator.drawText('KVKK m.6 - Ozel nitelikli kisisel veri', {
        x: 50,
        y: 50,
        size: 9,
        font: helvetica,
        color: rgb(0.6, 0.4, 0.1),
      });

      // Sonra ek PDF'in sayfalarını kopyala
      const pageIndices = attachPdf.getPageIndices();
      const copiedPages = await mergedPdf.copyPages(attachPdf, pageIndices);
      for (const page of copiedPages) {
        mergedPdf.addPage(page);
      }
    } catch (e) {
      console.error(`[pdf-merger] attachment ${attach.id} error:`, e);
      // Bu ek atlanır, diğer ekler ve ana rapor etkilenmez
      continue;
    }
  }

  return await mergedPdf.save();
}
