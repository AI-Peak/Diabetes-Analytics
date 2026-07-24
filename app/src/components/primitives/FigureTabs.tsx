"use client";

import Image from "next/image";
import { Tabs } from "./Tabs";

export type FigureTabItem = {
  id: string;
  label: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  caption: string;
};

/**
 * Shows one exported matplotlib figure at a time. These figures are raster artifacts whose
 * text is baked in, so they need a generous width to stay legible; stacking them all at once
 * made a single archival section taller than the analysis it supports.
 */
export function FigureTabs({ items }: { items: FigureTabItem[] }) {
  return (
    <Tabs
      items={items.map((item) => ({
        id: item.id,
        label: item.label,
        content: (
          <figure>
            <div className="figure-frame figure-frame-wide">
              <Image
                src={item.src}
                alt={item.alt}
                width={item.width}
                height={item.height}
                sizes="(max-width: 920px) 100vw, 760px"
              />
            </div>
            <figcaption className="figure-caption">{item.caption}</figcaption>
          </figure>
        ),
      }))}
    />
  );
}
