/**
 * Phase 2: plug Meta WhatsApp Cloud API, Twilio, or 360dialog here.
 * Secrets must stay in environment variables (Vercel), not in the database.
 */
export type WhatsAppPayload = {
  toE164: string;
  body: string;
};

export async function sendWhatsAppIfConfigured(
  payload: WhatsAppPayload,
): Promise<{ ok: boolean; skippedReason?: string }> {
  const provider = process.env.WHATSAPP_PROVIDER ?? "none";
  if (provider === "none" || !process.env.WHATSAPP_TOKEN) {
    return { ok: false, skippedReason: "whatsapp_not_configured" };
  }

  // Stub: implement HTTP call to your provider when credentials exist.
  void payload;
  return { ok: false, skippedReason: "whatsapp_stub" };
}
