import { Reveal } from "./Reveal";

export function Faq() {
  return (
    <section className="faq" id="faq">
      <div className="wrap">
        <Reveal className="in">
          <h2 className="big" style={{ fontSize: "clamp(36px, 5vw, 64px)", marginBottom: "40px" }}>
            FAQ
          </h2>
          <details>
            <summary>What does Guardian check?</summary>
            <p>
              Drafts are checked against your brand guidelines, claims policy and pricing sheet, with
              deterministic rules for banned terms, competitor names and image alt text.
            </p>
          </details>
          <details>
            <summary>What happens when a fact changes?</summary>
            <p>
              Posts linked to that fact are marked stale in the ledger, and a reviewer can apply the
              update in one click. The change is written to the audit log.
            </p>
          </details>
          <details>
            <summary>Does the AI decide what gets published?</summary>
            <p>
              No. Guardian flags and suggests. A reviewer approves every change, and each decision
              is recorded with who made it and when.
            </p>
          </details>
        </Reveal>
      </div>
    </section>
  );
}
