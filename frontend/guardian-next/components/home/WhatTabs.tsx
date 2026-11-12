"use client";

import Link from "next/link";
import { useState, useRef, KeyboardEvent } from "react";
import { Reveal } from "./Reveal";

interface TabItem {
  id: string;
  tabId: string;
  tabLabel: string;
  count: string;
  heading: string;
  includes: string[];
  goodFit: string;
}

const TABS: TabItem[] = [
  {
    id: "p1",
    tabId: "t1",
    tabLabel: "01 Pre-publish review",
    count: "01 / 03",
    heading: "Rule checks in milliseconds, before any model is involved",
    includes: ["Banned terms", "Competitor names", "Missing alt text"],
    goodFit:
      "You publish marketing drafts and need them checked against your brand guidelines before they go out.",
  },
  {
    id: "p2",
    tabId: "t2",
    tabLabel: "02 Citation gate",
    count: "02 / 03",
    heading: "Every AI finding quotes a source passage",
    includes: [
      "Quoted policy and pricing passages",
      "Code confirms the quote exists",
      "Unverified findings marked for human judgement",
    ],
    goodFit:
      "You want every claim backed by an approved source, with a reviewer deciding each finding.",
  },
  {
    id: "p3",
    tabId: "t3",
    tabLabel: "03 Living ledger",
    count: "03 / 03",
    heading: "When a fact changes, every linked post is flagged",
    includes: [
      "Approved claims linked to their facts",
      "Stale posts flagged automatically",
      "Append-only audit log of every decision",
    ],
    goodFit: "Your prices or policies change and published posts need to stay accurate.",
  },
];

export function WhatTabs() {
  const [activeTab, setActiveTab] = useState(0);
  const tabButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;
    if (e.key === "ArrowRight") {
      nextIndex = (index + 1) % TABS.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (index - 1 + TABS.length) % TABS.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = TABS.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    setActiveTab(nextIndex);
    tabButtonRefs.current[nextIndex]?.focus();
  };

  return (
    <section className="what" id="what">
      <div className="wrap">
        <Reveal className="sh">
          <h2 className="big">What it does</h2>
          <div className="tabs" role="tablist" aria-label="Capabilities">
            {TABS.map((item, i) => (
              <button
                key={item.id}
                ref={(el) => {
                  tabButtonRefs.current[i] = el;
                }}
                className="tab"
                role="tab"
                aria-selected={activeTab === i}
                aria-controls={item.id}
                id={item.tabId}
                tabIndex={activeTab === i ? 0 : -1}
                onClick={() => setActiveTab(i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
              >
                {item.tabLabel}
              </button>
            ))}
          </div>
        </Reveal>

        {TABS.map((item, i) => (
          <div
            key={item.id}
            className={`feature-panel ${activeTab === i ? "on" : ""}`}
            role="tabpanel"
            id={item.id}
            aria-labelledby={item.tabId}
            hidden={activeTab !== i}
          >
            <div>
              <p className="c">{item.count}</p>
              <h3>{item.heading}</h3>
              <Link className="pill light" href="/demo">
                Try it in the demo
              </Link>
            </div>
            <div>
              <p className="lab">Includes</p>
              <ul>
                {item.includes.map((inc) => (
                  <li key={inc}>{inc}</li>
                ))}
              </ul>
              <p className="lab">Good fit if</p>
              <p className="fit">{item.goodFit}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
