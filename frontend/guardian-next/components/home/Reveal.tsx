"use client";

import React, { useEffect, useRef } from "react";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  as?: React.ElementType;
  id?: string;
  style?: React.CSSProperties;
}

export function Reveal({
  children,
  className = "",
  delayMs,
  as: Component = "div",
  id,
  style,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("in");
      return;
    }

    if (!("IntersectionObserver" in window)) {
      el.classList.add("in");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const combinedStyle: React.CSSProperties = {
    ...style,
    ...(delayMs !== undefined ? ({ "--d": `${delayMs}ms` } as React.CSSProperties) : {}),
  };

  return (
    <Component
      ref={ref}
      id={id}
      className={`rv ${className}`.trim()}
      style={combinedStyle}
    >
      {children}
    </Component>
  );
}
