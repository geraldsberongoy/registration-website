"use server"; // Ensure this runs on the server to protect your secret keys
import { Guest } from "@/types/guest";
// Importing our updated secure service functions
import { generateSecureQRCode, createQRDataFromGuest } from "@/services/qrService"; 
import { uploadQRToStorage, checkUserSession, updateRegistrantQrUrl } from "@/repositories/qrRepository";

export interface QRUploadResult {
  success: boolean;
  url?: string;
  count?: number;
  error?: string;
}

/**
 * Business logic for a single QR code generation and upload
 */
export async function uploadSingleQR(
  guest: Guest,
  eventSlug: string
): Promise<QRUploadResult> {
  try {
    //  Security Check
    const isAuthenticated = await checkUserSession();
    if (!isAuthenticated) {
      return { success: false, error: 'You must be logged in to generate QR codes' };
    }

    //  Format Data
    const qrData = createQRDataFromGuest(guest, eventSlug);
    if (!qrData) {
      return { success: false, error: 'Guest user data is missing' };
    }

    //  Generate Secure QR (Now returns a Buffer, not a Blob)
    const qrResult = await generateSecureQRCode(qrData);
    if (!qrResult.success || !qrResult.buffer || !qrResult.fileName) {
      return { success: false, error: qrResult.error || 'Failed to generate secure QR' };
    }

    // Upload to Storage (Passing the Buffer directly)
    const uploadResult = await uploadQRToStorage(qrResult.fileName, qrResult.buffer);
    
    if (uploadResult.success && uploadResult.url) {
      //  Link the URL to the registrant in the DB
      await updateRegistrantQrUrl(guest.registrant_id, uploadResult.url);
      return { success: true, url: uploadResult.url };
    }
    
    return { success: false, error: uploadResult.error };
  } catch (error) {
    console.error('Error in uploadSingleQR:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Handles batch generation for multiple guests
 */
export async function uploadBulkQR(
  guests: Guest[],
  eventSlug: string
): Promise<QRUploadResult> {
  try {
    let uploadedCount = 0;

    for (const guest of guests) {
      // Use our single upload logic for each guest
      const result = await uploadSingleQR(guest, eventSlug);
      
      if (result.success) {
        uploadedCount++;
      } else {
        console.error(`Skipping guest ${guest.registrant_id}: ${result.error}`);
      }

      // Small delay to prevent hitting Supabase rate limits during bulk upload
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return { success: true, count: uploadedCount };
  } catch (error) {
    console.error('Error in uploadBulkQR:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}