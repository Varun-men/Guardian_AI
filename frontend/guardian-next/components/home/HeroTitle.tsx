"use client";

import React from "react";

interface HeroTitleProps {
  title?: string;
}

export function HeroTitle({ title = "Every claim tied to its source" }: HeroTitleProps) {
  const words = title.trim().split(/\s+/);

  return (
    <h1 aria-label={title}>
      {words.map((word, i) => (
        <React.Fragment key={i}>
          <span
            className="w"
            aria-hidden="true"
            style={{ "--k": i } as React.CSSProperties}
          >
            {word}
          </span>
          {i < words.length - 1 ? " " : ""}
        </React.Fragment>
      ))}
    </h1>
  );
}
