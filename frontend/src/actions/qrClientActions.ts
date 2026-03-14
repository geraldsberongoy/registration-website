"use client";

import { Guest } from "@/types/guest";
// We call the service logic which now handles the secure pipeline
import { uploadSingleQR, uploadBulkQR } from "@/services/qrUploadService";

/**
 * Client-side actions for QR code operations.
 * These are called by your UI components (e.g., a "Generate Ticket" button).
 */

export interface QRActionResult {
  success: boolean;
  url?: string;
  count?: number;
  error?: string;
}

/**
 * Triggers the secure server-side generation for one guest.
 */
export async function generateSingleQRAction(
  guest: Guest,
  eventSlug: string
): Promise<QRActionResult> {
  // Simple client-side guard
  if (!guest || !eventSlug) {
    return { success: false, error: "Missing guest data or event slug" };
  }

  // Delegates to the server-side service we just finalized
  return await uploadSingleQR(guest, eventSlug);
}

/**
 * Triggers batch generation for an array of guests.
 */
export async function generateBulkQRAction(
  guests: Guest[],
  eventSlug: string
): Promise<QRActionResult> {
  if (!guests || guests.length === 0) {
    return { success: false, error: "No guests selected for bulk generation" };
  }

  return await uploadBulkQR(guests, eventSlug);
}