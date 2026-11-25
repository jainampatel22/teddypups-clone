"use client";
// Port of the original NoticeBoard (corkboard FAQ with live search).
import { Fragment, useId, useMemo, useState } from "react";
import RevealScope from "./RevealScope";
import type { Faq } from "@/lib/types";

const TILTS = [-1.6, 1.2, -0.8, 1.8, -1.2, 0.7, -1.9, 1.4];
const PINS = ["var(--color-toffee)", "var(--color-sky-deep)", "#d9a13c", "#c45a6a"];

function Hl({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return <>{parts.map((p, i) => (i % 2 ? <mark key={i}>{p}</mark> : <Fragment key={i}>{p}</Fragment>))}</>;
}

export type NoticeCopy = { label: string; placeholder: string; ask: string; emptyLead: string; emptyLink: string; emptyTail: string };

export default function NoticeBoard({ faqs, askHref, teddy, copy }: { faqs: Faq[]; askHref: string; teddy: React.ReactNode; copy: NoticeCopy }) {
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const id = useId();
  const needle = q.trim().toLowerCase();
  const list = useMemo(() => (needle ? faqs.filter((f) => `${f.question} ${f.answer}`.toLowerCase().includes(needle)) : faqs), [faqs, needle]);
  return (
    <div className="tp-notes" data-open={open || needle ? "" : undefined}>
      <aside className="tp-notes__side" aria-label="Find a question">
        <label htmlFor={id} className="font-scrawl tp-notes__label">{copy.label}</label>
        <div className="tp-notes__search">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="tp-notes__lens"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg>
          <input id={id} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={copy.placeholder} autoComplete="off" />
        </div>
        <p className="tp-notes__count" aria-live="polite">
          {q.trim() ? `${list.length} ${list.length === 1 ? "note" : "notes"} found` : `${faqs.length} notes on the board`}
        </p>
        <div className="tp-notes__teddy">
          <span aria-hidden="true" className="tp-notes__bubble font-plush"><span className="tp-notes__q">?</span><span className="tp-notes__a">!</span></span>
          {teddy}
        </div>
        <a href={askHref} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp tp-notes__ask">{copy.ask}</a>
      </aside>
      <RevealScope className="tp-notes__board">
        <ul className="tp-notes__list">
          {list.map((f, i) => {
            const unfolded = open === f.id || (!!needle && f.answer.toLowerCase().includes(needle));
            return (
              <li key={f.id} className="tp-note" data-reveal="true" data-unfolded={unfolded || undefined}
                style={{ "--tilt": `${TILTS[i % TILTS.length]}deg`, "--pin": PINS[i % PINS.length], "--i": i } as React.CSSProperties}>
                <span aria-hidden="true" className="tp-note__pin" />
                <h2 className="tp-note__q">
                  <button type="button" id={`q-${f.id}`} aria-expanded={unfolded} aria-controls={`a-${f.id}`} onClick={() => setOpen(open === f.id ? null : f.id)}>
                    <span className="font-plush-text"><Hl text={f.question} query={q} /></span>
                    <span aria-hidden="true" className="tp-note__chevron" />
                  </button>
                </h2>
                <div id={`a-${f.id}`} role="region" aria-labelledby={`q-${f.id}`} className="tp-note__answer" inert={!unfolded || undefined}>
                  <div className="tp-note__flap"><p><Hl text={f.answer} query={q} /></p></div>
                </div>
              </li>
            );
          })}
        </ul>
        {!list.length && (
          <div className="tp-note tp-note--empty">
            <span aria-hidden="true" className="tp-note__pin" />
            <p className="font-plush-text text-[1.2rem] font-bold">{copy.emptyLead} “{q.trim()}” yet.</p>
            <p className="mt-2"><a href={askHref} target="_blank" rel="noopener noreferrer" className="link-ink">{copy.emptyLink}</a> {copy.emptyTail}</p>
          </div>
        )}
      </RevealScope>
    </div>
  );
}
