import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = (() => {
  const legacyKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacyKey) return legacyKey;
  try {
    return JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}").default ?? "";
  } catch {
    return "";
  }
})();
const expectedWebhookSecret = Deno.env.get("FAKEWHATSAPP_WEBHOOK_SECRET")!;

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function pemToBytes(pem: string): Uint8Array {
  const base64 = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

async function getFcmAccessToken(): Promise<string> {
  const clientEmail = Deno.env.get("FCM_CLIENT_EMAIL");
  const privateKey = Deno.env.get("FCM_PRIVATE_KEY")?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) throw new Error("Missing FCM service-account secrets");

  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${base64Url(new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT" })))}.${base64Url(new TextEncoder().encode(JSON.stringify({
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })))}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToBytes(privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned)));
  const assertion = `${unsigned}.${base64Url(signature)}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const result = await response.json();
  if (!response.ok || typeof result.access_token !== "string") {
    throw new Error(`FCM OAuth failed (${response.status}): ${JSON.stringify(result)}`);
  }
  return result.access_token;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!expectedWebhookSecret || !constantTimeEqual(request.headers.get("x-webhook-secret") ?? "", expectedWebhookSecret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const projectId = Deno.env.get("FCM_PROJECT_ID");
  if (!projectId || !supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: "Missing server configuration" }, { status: 500 });
  }

  try {
    const message = await request.json();
    if (typeof message.id !== "string" || typeof message.conversation_id !== "string" || typeof message.sender_id !== "string") {
      return Response.json({ error: "Invalid message event" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const [{ data: members, error: membersError }, { data: sender }, { data: conversation }] = await Promise.all([
      supabase.from("conversation_members").select("user_id")
        .eq("conversation_id", message.conversation_id).neq("user_id", message.sender_id),
      supabase.from("profiles").select("display_name").eq("id", message.sender_id).maybeSingle(),
      supabase.from("conversations").select("title,is_group").eq("id", message.conversation_id).maybeSingle(),
    ]);
    if (membersError) throw membersError;
    const recipientIds = (members ?? []).map((member) => member.user_id);
    if (recipientIds.length === 0) return Response.json({ sent: 0 });

    const { data: devices, error: devicesError } = await supabase.from("push_devices")
      .select("token").eq("provider", "fcm").in("user_id", recipientIds);
    if (devicesError) throw devicesError;
    if (!devices?.length) return Response.json({ sent: 0 });

    const accessToken = await getFcmAccessToken();
    const senderName = sender?.display_name || "Nuevo mensaje";
    const title = conversation?.is_group ? (conversation.title || "Grupo") : senderName;
    const messageBody = message.deleted_at ? "Mensaje eliminado" : (message.body || "📷 Imagen");
    const body = conversation?.is_group ? `${senderName}: ${messageBody}` : messageBody;
    const preview = body.length > 180 ? `${body.slice(0, 177)}…` : body;
    const results = await Promise.all(devices.map(async ({ token }) => {
      const response = await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/messages:send`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: {
          token,
          notification: { title, body: preview },
          data: {
            conversation_id: message.conversation_id,
            conversation_title: title,
            message_id: message.id,
            body: preview,
          },
          android: { priority: "HIGH", notification: { channel_id: "messages" } },
        } }),
      });
      return { ok: response.ok, status: response.status, token };
    }));

    const staleTokens = results.filter((result) => result.status === 404 || result.status === 410).map((result) => result.token);
    if (staleTokens.length) {
      await supabase.from("push_devices").delete().in("token", staleTokens);
    }
    const failed = results.filter((result) => !result.ok && result.status !== 404 && result.status !== 410);
    return Response.json({ sent: results.filter((result) => result.ok).length, failed: failed.length });
  } catch (error) {
    console.error("send-message-notification failed", error);
    return Response.json({ error: "Could not send message notification" }, { status: 500 });
  }
});
