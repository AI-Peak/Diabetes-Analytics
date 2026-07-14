"use client";

import { useRef, useState } from "react";

export function Tabs({ items }: { items: { id: string; label: string; content: React.ReactNode }[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const active = items.find((item) => item.id === activeId) ?? items[0];

  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + items.length) % items.length;
    const next = items[nextIndex];
    setActiveId(next.id);
    refs.current[nextIndex]?.focus();
  }

  return (
    <div>
      <div className="tabs-list" role="tablist">
        {items.map((item, index) => (
          <button
            className="tab-button"
            id={`tab-${item.id}`}
            key={item.id}
            role="tab"
            type="button"
            aria-controls={`panel-${item.id}`}
            aria-selected={active?.id === item.id}
            tabIndex={active?.id === item.id ? 0 : -1}
            ref={(node) => { refs.current[index] = node; }}
            onClick={() => setActiveId(item.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >{item.label}</button>
        ))}
      </div>
      {active ? <div className="tabs-panel" id={`panel-${active.id}`} role="tabpanel" aria-labelledby={`tab-${active.id}`}>{active.content}</div> : null}
    </div>
  );
}
