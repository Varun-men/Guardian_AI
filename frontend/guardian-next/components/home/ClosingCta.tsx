import Link from "next/link";
import { Reveal } from "./Reveal";

export function ClosingCta() {
  return (
    <section className="cta">
      <svg viewBox="0 0 1100 700" aria-hidden="true" fill="none">
        <g className="cta-rings" stroke="#b0121b" strokeOpacity=".55" strokeWidth="1.5">
          <circle className="cta-ring c1" cx="550" cy="350" r="340" />
          <circle className="cta-ring c2" cx="550" cy="350" r="260" />
          <circle className="cta-ring c3" cx="550" cy="350" r="180" />
        </g>
        <circle className="cta-dot d1" cx="880" cy="160" r="18" fill="#f7ece8" />
        <circle className="cta-dot d2" cx="210" cy="520" r="12" fill="#f2675f" />
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
