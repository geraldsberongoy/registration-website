import { createClient } from "@/lib/supabase/server";

export interface QRStorageResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload QR code buffer to storage (server-side only)
 * This accepts the Buffer we created in our secure Service.
 */
export async function uploadQRBufferToStorage(
  fileName: string,
  buffer: Buffer
): Promise<QRStorageResult> {
  try {
    // We 'await' createClient because Next.js server clients often 
    // need to parse cookies or headers before they are ready.
    const supabase = await createClient();

    const { error } = await supabase.storage
      .from('ticket')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: true // Ensures we don't get 'File already exists' errors
      });

    if (error) {
      console.error('Supabase Storage Error:', error);
      return { success: false, error: error.message };
    }

    // Generate the URL so we can save it to the registrant's row next
    const { data: urlData } = supabase.storage
      .from('ticket')
      .getPublicUrl(fileName);

    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    console.error('Unexpected Upload Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload QR code'
    };
  }
}