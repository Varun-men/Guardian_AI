import Link from "next/link";
import { Reveal } from "./Reveal";

export function ClosingCta() {
  return (
    <section className="cta">
      <svg viewBox="0 0 1100 700" aria-hidden="true" fill="none">
        <g stroke="#b0121b" strokeOpacity=".55" strokeWidth="1.5">
          <circle cx="550" cy="350" r="340" />
          <circle cx="550" cy="350" r="260" />
          <circle cx="550" cy="350" r="180" />
        </g>
        <circle cx="880" cy="160" r="18" fill="#f7ece8" />
        <circle cx="210" cy="520" r="12" fill="#f2675f" />
      </svg>
      <Reveal className="wrap">
        <h2>A human always decides</h2>
        <p>
          Guardian flags and suggests. A reviewer approves every modification, and each decision is
          recorded into an append-only audit log.
        </p>
        <Link className="pill light" href="/demo">
          Explore the demo
        </Link>
      </Reveal>
    </section>
  );
}
