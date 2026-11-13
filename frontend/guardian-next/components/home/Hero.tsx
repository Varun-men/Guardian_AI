import Link from "next/link";
import { HeroTitle } from "./HeroTitle";

export function Hero() {
  return (
    <header className="hero">
      <svg className="motif" viewBox="0 0 800 800" aria-hidden="true" fill="none">
        <g stroke="#b0121b" strokeOpacity=".6" strokeWidth="1.5">
          <circle className="motif-ring r1" cx="400" cy="400" r="380" />
          <circle className="motif-ring r2" cx="400" cy="400" r="300" />
          <circle className="motif-ring r3" cx="400" cy="400" r="220" />
          <circle className="motif-ring r4" cx="400" cy="400" r="140" />
        </g>
        <circle className="motif-core" cx="400" cy="400" r="72" fill="#b0121b" />
        <circle className="motif-dot d1" cx="660" cy="250" r="22" fill="#f7ece8" />
        <circle className="motif-dot d2" cx="196" cy="560" r="16" fill="#f2675f" />
        <circle className="motif-dot d3" cx="520" cy="660" r="10" fill="#f7ece8" fillOpacity=".7" />
      </svg>
      <div className="wrap hero-in" id="top" style={{ width: "100%" }}>
        <p className="kick">Living claim ledger</p>
        <HeroTitle title="Every claim tied to its source" />
        <p className="lead">
          Guardian AI reviews marketing drafts against approved brand and pricing sources,
          then continuously flags every post when facts drift.
        </p>
        <div className="acts">
          <Link className="pill red" href="/analyze">
            Explore interactive demo
          </Link>
          <Link className="pill ghost" href="/analyze">
            See sample demo
          </Link>
        </div>
        <div className="stats">
          <div>
            <b>&lt; 2s</b>
            Deterministic check
          </div>
          <div>
            <b>100%</b>
            Claims cited
          </div>
          <div>
            <b>0</b>
            Unverified drift
          </div>
        </div>
      </div>
    </header>
  );
}
