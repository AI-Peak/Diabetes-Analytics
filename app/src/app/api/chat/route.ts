import { fallbackAnswer } from "@/lib/ai/fallback";
import { PROJECT_CONTEXT, SYSTEM_INSTRUCTION } from "@/lib/ai/system-instruction";

type ChatMessage = { role: "user" | "assistant"; content: string };
type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: unknown } }>;
};

const DEFAULT_BASE_URL = "https://9r-nhan.0err.com/v1";
const DEFAULT_MODEL = "gpt-5.4-mini";

export const runtime = "nodejs";
export const preferredRegion = "sin1";

function extractUpstreamError(body: string): string | null {
  try {
    const payload = JSON.parse(body) as unknown;
    if (!payload || typeof payload !== "object") return null;
    const record = payload as Record<string, unknown>;
    const error = record.error;

    if (typeof error === "string") return error.trim().slice(0, 300) || null;
    if (error && typeof error === "object") {
      const message = (error as Record<string, unknown>).message;
      if (typeof message === "string") return message.trim().slice(0, 300) || null;
    }

    for (const key of ["message", "detail"]) {
      const message = record[key];
      if (typeof message === "string") return message.trim().slice(0, 300) || null;
    }
  } catch {
    // Ignore non-JSON proxy pages so logs never include an arbitrary HTML response.
  }
  return null;
}

function parseMessages(value: unknown): ChatMessage[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 12) return null;
  const messages: ChatMessage[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const role = "role" in item ? item.role : undefined;
    const content = "content" in item ? item.content : undefined;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string" || !content.trim() || content.length > 2000) return null;
    messages.push({ role, content: content.trim() });
  }
  return messages;
}

function extractReply(content: unknown): string | null {
  if (typeof content === "string" && content.trim()) return content.trim();
  if (!Array.isArray(content)) return null;

  const text = content
    .map((part) => {
      if (!part || typeof part !== "object" || !("text" in part)) return "";
      return typeof part.text === "string" ? part.text : "";
    })
    .join("")
    .trim();
  return text || null;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const messages = parseMessages(body && typeof body === "object" && "messages" in body ? body.messages : undefined);
  if (!messages) return Response.json({ error: "Expected 1–12 valid chat messages." }, { status: 400 });
  const lastUser = [...messages].reverse().find((message) => message.role === "user");
  if (!lastUser) return Response.json({ error: "A user message is required." }, { status: 400 });

  const apiKey = process.env.NINEROUTER_API_KEY?.trim();
  if (!apiKey) return Response.json({ reply: fallbackAnswer(lastUser.content), mocked: true });

  const baseUrl = (process.env.NINEROUTER_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const model = process.env.NINEROUTER_MODEL?.trim() || DEFAULT_MODEL;

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Diabetes-Analytics/1.0",
      },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: "system", content: `${SYSTEM_INSTRUCTION}\n\nPROJECT CONTEXT\n${PROJECT_CONTEXT}` },
          ...messages,
        ],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      const details = extractUpstreamError(await response.text());
      const requestId = response.headers.get("cf-ray") || response.headers.get("x-request-id");
      throw new Error([
        `9Router returned HTTP ${response.status}`,
        details ? `(${details})` : "",
        requestId ? `[request ${requestId}]` : "",
      ].filter(Boolean).join(" "));
    }
    const payload = await response.json() as ChatCompletionResponse;
    const reply = extractReply(payload.choices?.[0]?.message?.content);
    if (!reply) throw new Error("9Router returned an empty response");
    return Response.json({ reply, mocked: false });
  } catch (error) {
    console.error("[chat] 9Router request failed", error instanceof Error ? error.message : "unknown error");
    return Response.json({ error: "The live assistant is temporarily unavailable. Check the 9Router configuration or remove the API key to use the grounded offline demo." }, { status: 502 });
  }
}
