import { Reveal } from "./Reveal";

export function HowCards() {
  return (
    <section className="how" id="cards">
      <div className="wrap">
        <Reveal as="h2" className="big">
          How Guardian reviews a post
        </Reveal>
        <div className="cards">
          <Reveal as="article" className="mc" delayMs={0}>
            <span className="n">01</span>
            <h3>Pre-publish review</h3>
            <p>
              Deterministic checks catch banned terms, competitor names and missing alt text in
              milliseconds.
            </p>
            <div className="vis">
              <div className="chip" style={{ "--i": 0 } as React.CSSProperties}>
                <span className="d"></span>Banned term
              </div>
              <div className="chip" style={{ "--i": 1 } as React.CSSProperties}>
                <span className="d o"></span>Competitor name
              </div>
              <div className="chip" style={{ "--i": 2 } as React.CSSProperties}>
                <span className="d y"></span>Missing alt text
              </div>
            </div>
          </Reveal>

          <Reveal as="article" className="mc" delayMs={120}>
            <span className="n">02</span>
            <h3>Citation gate</h3>
            <p>
              Every AI finding quotes a source passage. Code confirms the quote exists.
            </p>
            <div className="vis">
              <div className="q" style={{ "--i": 0 } as React.CSSProperties}>
                Our app is <mark>3x faster than any competitor.</mark>
              </div>
              <div className="chip" style={{ "--i": 3 } as React.CSSProperties}>
                <span className="d"></span>
                <span>
                  High risk
                  <br />
                  <span className="m">No approved benchmark found</span>
                </span>
              </div>
            </div>
          </Reveal>

          <Reveal as="article" className="mc" delayMs={240}>
            <span className="n">03</span>
            <h3>Living ledger</h3>
            <p>
              When a fact changes, every linked post is flagged for review automatically.
            </p>
            <div className="vis">
              <div className="m" style={{ "--i": 0 } as React.CSSProperties}>
                Starter price
              </div>
              <div className="price" style={{ "--i": 1 } as React.CSSProperties}>
                <span className="old">$29</span> → <span className="new">$39</span>
              </div>
              <div className="chip" style={{ "--i": 5 } as React.CSSProperties}>
                <span className="d y"></span>1 post stale
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
