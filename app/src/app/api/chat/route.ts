import { fallbackAnswer } from "@/lib/ai/fallback";
import { PROJECT_CONTEXT, SYSTEM_INSTRUCTION } from "@/lib/ai/system-instruction";

type ChatMessage = { role: "user" | "assistant"; content: string };
type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string };
};

const DEFAULT_MODEL = "gemini-2.5-flash";

export const runtime = "nodejs";

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

function extractReply(payload: GeminiResponse): string | null {
  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
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

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return Response.json({ reply: fallbackAnswer(lastUser.content), mocked: true });

  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: `${SYSTEM_INSTRUCTION}\n\nPROJECT CONTEXT\n${PROJECT_CONTEXT}` }],
        },
        contents: messages.map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }],
        })),
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 800,
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      const payload = await response.json() as GeminiResponse;
      throw new Error(payload.error?.message || `Gemini returned HTTP ${response.status}`);
    }
    const payload = await response.json() as GeminiResponse;
    const reply = extractReply(payload);
    if (!reply) throw new Error("Gemini returned an empty response");
    return Response.json({ reply, mocked: false });
  } catch (error) {
    console.error("[chat] Gemini request failed", error instanceof Error ? error.message : "unknown error");
    return Response.json({ error: "The live assistant is temporarily unavailable. Check the Gemini configuration or remove the API key to use the grounded offline demo." }, { status: 502 });
  }
}
