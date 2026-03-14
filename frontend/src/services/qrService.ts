import { Guest } from "@/types/guest";
import { createCipheriv, randomBytes } from "crypto";
import qrcode from "qrcode";

export interface QRCodeData {
  name: string;
  registrant_id: string;
  event_id: string;
  event_slug: string;
}

export interface QRGenerationResult {
  success: boolean;
  buffer?: Buffer;
  fileName?: string;
  error?: string;
}

/**
 * Modern Native Encryption Helper
 * Uses AES-256-GCM for security and integrity.
 */
function encryptData(data: string, secretKey: string): string {
  // AES-256 requires a 32-byte key. We hash your secret to ensure it's the right length.
  const key = Buffer.from(secretKey).slice(0, 32); 
  const iv = randomBytes(16); // Initialization Vector
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([cipher.update(data, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // We combine IV, AuthTag, and Encrypted data into one string for the QR code
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export async function generateSecureQRCode(
  qrData: QRCodeData
): Promise<QRGenerationResult> {
  try {
    const SECRET_KEY = process.env.QR_SECRET_KEY;
    if (!SECRET_KEY) throw new Error("Missing QR_SECRET_KEY");

    // 1. Encrypt using Native Node Crypto
    const securePayload = encryptData(JSON.stringify(qrData), SECRET_KEY);

    // 2. Generate QR Image as a Buffer
    const buffer = await qrcode.toBuffer(securePayload, {
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
      errorCorrectionLevel: 'H'
    });

    const fileName = `ticket-${qrData.registrant_id.slice(0, 8)}.png`;
    
    return { success: true, buffer, fileName };
  } catch (error) {
    console.error('Modern QR Generation Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate QR code' 
    };
  }
}

export function createQRDataFromGuest(guest: Guest, eventSlug: string): QRCodeData | null {
  if (!guest.users) return null;
  return {
    name: `${guest.users.first_name || ''} ${guest.users.last_name || ''}`.trim(),
    registrant_id: guest.registrant_id,
    event_id: guest.event_id,
    event_slug: eventSlug
  };
}