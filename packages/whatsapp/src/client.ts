import { WhatsAppClient } from "@kapso/whatsapp-cloud-api";

import { whatsappEnv } from "../env";

const env = whatsappEnv();

function createWhatsAppClient(): WhatsAppClient | null {
  if (!env.KAPSO_API_KEY) {
    console.warn(
      "[whatsapp] KAPSO_API_KEY not set — messages will be logged to console",
    );
    return null;
  }
  return new WhatsAppClient({
    baseUrl: "https://app.kapso.ai/api/meta",
    kapsoApiKey: env.KAPSO_API_KEY,
  });
}

export const whatsapp = createWhatsAppClient();
