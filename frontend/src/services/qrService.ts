import CryptoJS from "crypto-js";

export type RegistrantQrPayload = {
  token: string;
  issued_at: string;
  registrant: {
    id: string;
    user_id: string;
    name: string | null;
    email: string | null;
  };
  event: {
    id: string;
    slug: string | null;
    name: string | null;
  };
};

export async function generateQRCodeDataUrl(qrData: string): Promise<string> {
  const qrcode = await import("qrcode");

  return qrcode.toDataURL(qrData, {
    errorCorrectionLevel: "L",
    width: 400,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}

export function createRegistrantQrToken(input: {
  registrantId: string;
  eventId: string;
  userId: string;
}): string {
  const seed = [
    input.registrantId,
    input.eventId,
    input.userId,
    Date.now().toString(),
    Math.random().toString(36),
  ].join(":");

  return CryptoJS.SHA256(seed).toString(CryptoJS.enc.Hex);
}

export function createRegistrantQrData(input: {
  token: string;
  registrantId: string;
  userId: string;
  attendeeName?: string | null;
  attendeeEmail?: string | null;
  eventId: string;
  eventSlug?: string | null;
  eventName?: string | null;
}): string {
  const payload: RegistrantQrPayload = {
    token: input.token,
    issued_at: new Date().toISOString(),
    registrant: {
      id: input.registrantId,
      user_id: input.userId,
      name: input.attendeeName ?? null,
      email: input.attendeeEmail ?? null,
    },
    event: {
      id: input.eventId,
      slug: input.eventSlug ?? null,
      name: input.eventName ?? null,
    },
  };

  return JSON.stringify(payload);
}

export function parseRegistrantQrData(
  value: string,
): RegistrantQrPayload | null {
  try {
    const parsed = JSON.parse(value) as Partial<RegistrantQrPayload>;
    if (!parsed || typeof parsed !== "object") return null;

    if (
      typeof parsed.token !== "string" ||
      !parsed.registrant ||
      typeof parsed.registrant.id !== "string" ||
      !parsed.event ||
      typeof parsed.event.id !== "string"
    ) {
      return null;
    }

    return {
      token: parsed.token,
      issued_at:
        typeof parsed.issued_at === "string"
          ? parsed.issued_at
          : new Date().toISOString(),
      registrant: {
        id: parsed.registrant.id,
        user_id:
          typeof parsed.registrant.user_id === "string"
            ? parsed.registrant.user_id
            : "",
        name:
          typeof parsed.registrant.name === "string"
            ? parsed.registrant.name
            : null,
        email:
          typeof parsed.registrant.email === "string"
            ? parsed.registrant.email
            : null,
      },
      event: {
        id: parsed.event.id,
        slug: typeof parsed.event.slug === "string" ? parsed.event.slug : null,
        name: typeof parsed.event.name === "string" ? parsed.event.name : null,
      },
    };
  } catch {
    return null;
  }
}
