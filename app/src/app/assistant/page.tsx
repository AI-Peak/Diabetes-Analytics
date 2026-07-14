import type { Metadata } from "next";
import { AssistantChat } from "@/components/AssistantChat";
import { PageHead, Reveal } from "@/components/primitives";

export const metadata: Metadata = { title: "AI Assistant" };

export default function AssistantPage() {
  return (
    <div className="page">
      <Reveal>
        <PageHead
          eyebrow="AI Assistant · Grounded study help"
          title="Ask the evidence, not a generic chatbot."
          subtitle="Answers are constrained to the study's generated results and safety rules, in Vietnamese or English. Without an API key, a deterministic offline responder keeps the demo functional."
          meta={["Grounded context", "vi / en", "No medical advice"]}
        />
      </Reveal>
      <AssistantChat />
    </div>
  );
}
