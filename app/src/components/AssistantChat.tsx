"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Send } from "@/lib/icons";
import { ASSISTANT_PROMPTS } from "@/lib/ai/suggested-prompts";

type AssistantMode = "online" | "offline" | "rate_limited" | "unavailable";
type Message = { id: number; role: "user" | "assistant"; content: string; mocked?: boolean; mode?: AssistantMode };

const modeLabels: Record<Exclude<AssistantMode, "online">, string> = {
  offline: "Offline knowledge · chưa cấu hình Gemini API",
  rate_limited: "Offline knowledge · Gemini đang giới hạn lượt gọi",
  unavailable: "Offline knowledge · Gemini tạm thời không phản hồi",
};

const welcome: Message = {
  id: 1,
  role: "assistant",
  content: "Xin chào! Mình có thể giải thích kết quả RQ1–RQ3, metrics mô hình, ngưỡng sàng lọc tối ưu và mức nhất quán giữa SHAP với thống kê. Mình chỉ dùng dữ liệu đã được kiểm chứng của nghiên cứu.",
};

export function AssistantChat() {
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function send(content: string) {
    const question = content.trim();
    if (!question || sending) return;
    const userMessage: Message = { id: Date.now(), role: "user", content: question };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.slice(-10).map(({ role, content: text }) => ({ role, content: text })) }),
      });
      const payload = await response.json() as { reply?: string; mocked?: boolean; mode?: AssistantMode; error?: string };
      const reply = response.ok && payload.reply ? payload.reply : payload.error ?? "Không thể nhận phản hồi lúc này.";
      setMessages((current) => [...current, { id: Date.now() + 1, role: "assistant", content: reply, mocked: payload.mocked, mode: payload.mode }]);
    } catch {
      setMessages((current) => [...current, { id: Date.now() + 1, role: "assistant", content: "Không thể kết nối tới trợ lý lúc này. Vui lòng thử lại.", mocked: true }]);
    } finally {
      setSending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(input);
  }

  return (
    <div className="assistant-layout">
      <section className="chat-shell" aria-label="Research assistant chat">
        <div className="message-thread" aria-live="polite">
          {messages.map((message) => (
            <article className={`message ${message.role}`} key={message.id}>
              <div className="message-meta">{message.role === "assistant" ? "Study assistant" : "You"}</div>
              {message.content}
              {message.mocked ? <div className="offline-note">{message.mode && message.mode !== "online" ? modeLabels[message.mode] : "Offline knowledge · grounded deterministic response"}</div> : null}
            </article>
          ))}
          {sending ? <article className="message"><div className="message-meta">Study assistant</div>Đang đối chiếu context nghiên cứu…</article> : null}
          <div ref={endRef} />
        </div>
        <form className="chat-composer" onSubmit={submit}>
          <label className="sr-only" htmlFor="assistant-input">Ask about the study</label>
          <input id="assistant-input" className="chat-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Hỏi về RQ1, metrics, SHAP, consistency…" autoComplete="off" />
          <button className="send-button" type="submit" aria-label="Send message" disabled={sending || !input.trim()}><Send size={16} aria-hidden="true" /></button>
        </form>
      </section>

      <aside className="surface-card suggestions-panel" aria-label="Suggested questions">
        <div className="chart-card-header"><div><h2 className="card-title">Suggested questions</h2><p className="card-subtitle">Use these prompts to inspect the study&apos;s evidence chain.</p></div></div>
        <div className="suggestion-list">
          {ASSISTANT_PROMPTS.map((prompt) => <button className="suggestion-button" type="button" key={prompt} disabled={sending} onClick={() => void send(prompt)}>{prompt}</button>)}
        </div>
        <div className="section-block"><div className="callout"><span className="callout-mark">!</span><div><strong>Research assistant</strong><br />Not medical advice. No personalized diagnosis.</div></div></div>
      </aside>
    </div>
  );
}
