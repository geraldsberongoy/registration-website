import { Guest } from "@/types/guest";
import CryptoJS from "crypto-js";
import qrcode from "qrcode";

export interface QRCodeData {
  name: string;
  registrant_id: string;
  event_id: string;
  event_slug: string;
}

export interface QRGenerationResult {
  success: boolean;
  buffer?: Buffer; // Swapped Blob for Buffer for Server-Side compatibility
  fileName?: string;
  error?: string;
}

/**
 * Generates an ENCRYPTED QR code. 
 * This version uses Buffers so it can run securely in Server Actions.
 */
export async function generateSecureQRCode(
  qrData: QRCodeData
): Promise<QRGenerationResult> {
  try {
    //  Encryption - SECRET_KEY is pulled from .env.local on the server
    const SECRET_KEY = process.env.QR_SECRET_KEY;
    if (!SECRET_KEY) {
      throw new Error("Missing QR_SECRET_KEY environment variable");
    }

    // Scramble the JSON data into a secure string
    const encryptedString = CryptoJS.AES.encrypt(
      JSON.stringify(qrData), 
      SECRET_KEY
    ).toString();

    //  Generate QR Image as a Buffer (No Canvas/Document needed!)
    const buffer = await qrcode.toBuffer(encryptedString, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H'
    });

    // Create a clean filename
    const fileName = `ticket-${qrData.registrant_id.slice(0, 8)}.png`;
    
    return { success: true, buffer, fileName };
  } catch (error) {
    console.error('Error generating secure QR code:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate QR code' 
    };
  }
}

/**
 * Formats the raw Guest data into the clean QRCodeData structure
 */
export function createQRDataFromGuest(guest: Guest, eventSlug: string): QRCodeData | null {
  if (!guest.users) {
    return null;
  }

  return {
    name: `${guest.users.first_name || ''} ${guest.users.last_name || ''}`.trim(),
    registrant_id: guest.registrant_id,
    event_id: guest.event_id,
    event_slug: eventSlug
  };
}