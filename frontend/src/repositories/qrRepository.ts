import { createClient } from "@/lib/supabase/client";

/**
 * Check if user is authenticated (client-side helper)
 */
export async function checkUserSession(): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    return !!sessionData.session;
  } catch {
    return false;
  }
}

/**
 * Updates the registrant's row with the generated QR URL.
 * This can be called from the client or the server.
 */
export async function updateRegistrantQrUrl(
  registrantId: string,
  qrUrl: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('registrants')
    .update({ qr_url: qrUrl })
    .eq('registrant_id', registrantId);

  if (error) {
    console.error('Failed to save qr_url to database:', error.message);
    throw new Error(error.message);
  }
}

/**
 * NOTE: uploadQRToStorage (Blob version) is deprecated.
 * We are now using uploadQRBufferToStorage in qrServerRepository.ts
 * to support secure encryption and server-side Buffers.
 */