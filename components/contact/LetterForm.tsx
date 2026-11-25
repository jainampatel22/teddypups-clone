"use client";
// Port of the original LetterForm: letter-style enquiry with inline blanks and the seal -> post -> sent sequence.
import { useActionState, useEffect, useId, useRef, useState, useTransition } from "react";
import { sendEnquiry, type EnquiryState } from "@/lib/actions";
import Paw from "./Paw";

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
type Phase = "writing" | "sealing" | "posting" | "sent";

function Blank({ name, label, error, size = 14, ...rest }: { name: string; label: string; error?: string; size?: number } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <span className="tp-blank" style={{ "--size": `${size}ch` } as React.CSSProperties}>
      <input name={name} aria-label={label} aria-invalid={!!error || undefined} aria-describedby={error ? `${name}-err` : undefined} {...rest} />
    </span>
  );
}

export type LetterCopy = {
  greeting: string; sign: string; submit: string; pending: string; anyPuppy: string; messagePlaceholder: string;
  successHeading: string; successBody: string; successCta: string;
};

export default function LetterForm({ puppies, whatsappHref, copy }: { puppies: { id: string; label: string }[]; whatsappHref: string; copy: LetterCopy }) {
  const [state, action, actionPending] = useActionState<EnquiryState, FormData>(sendEnquiry, { ok: false });
  const [transPending, startTransition] = useTransition();
  const pending = actionPending || transPending;
  const formRef = useRef<HTMLFormElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const sentRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("writing");
  const [minH, setMinH] = useState<number | undefined>();
  const selId = useId();
  const msgId = useId();

  useEffect(() => {
    if (!state?.ok) return;
    const t = reduced()
      ? [setTimeout(() => setPhase("sent"), 0)]
      : [setTimeout(() => { setMinH(boxRef.current?.offsetHeight); setPhase("sealing"); }, 0), setTimeout(() => setPhase("posting"), 750), setTimeout(() => { setMinH(undefined); setPhase("sent"); }, 1750)];
    return () => t.forEach(clearTimeout);
  }, [state]);

  useEffect(() => {
    const el = sentRef.current;
    if (phase !== "sent" || !el) return;
    el.focus({ preventScroll: true });
    const top = el.getBoundingClientRect().top;
    const head = 16 * parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 76;
    if (top < head + 8) scrollBy({ top: top - head - 24, behavior: reduced() ? "auto" : "smooth" });
  }, [phase]);

  const errors = (state && !state.ok && state.fieldErrors) || {};
  useEffect(() => {
    if (state && !state.ok && state.fieldErrors) formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
  }, [state]);
  const list = Object.entries(errors).filter(([k]) => k !== "website");
  const message = state && !state.ok && state.error ? (list.length ? "Please check the highlighted details." : state.error) : null;

  return (
    <div ref={boxRef} className="tp-post" data-phase={phase} style={{ minHeight: minH }}>
      {phase !== "sent" && (
        <form ref={formRef} noValidate className="tp-letterform" aria-hidden={phase !== "writing" || undefined} inert={phase !== "writing" || undefined}
          onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); startTransition(() => action(fd)); }}>
          <span aria-hidden="true" className="tp-letter__stamp"><Paw className="size-9" /></span>
          <p className="font-scrawl tp-letterform__greeting">{copy.greeting}</p>
          {message && (
            <div role="alert" className="tp-letterform__alert">
              <p className="font-semibold">{message}</p>
              {list.length > 0 && <ul>{list.map(([k, v]) => <li key={k} id={`${k}-err`}>{v}</li>)}</ul>}
            </div>
          )}
          <p className="tp-letterform__line">
            my name is <Blank name="name" label="Your name (required)" autoComplete="name" required minLength={2} maxLength={80} size={16} error={errors.name} />, and you can reach me on{" "}
            <Blank name="phone" label="Phone or WhatsApp number with country code (required)" type="tel" inputMode="tel" autoComplete="tel" required size={15} placeholder="+971 50 123 4567" error={errors.phone} /> or by email at{" "}
            <Blank name="email" label="Email (optional)" type="email" autoComplete="email" size={20} placeholder="optional" error={errors.email} />.
          </p>
          <p className="tp-letterform__line">
            I live in <Blank name="area" label="Your area (optional)" autoComplete="address-level2" maxLength={80} size={13} placeholder="e.g. Dubai Marina" error={errors.area} />, and I&apos;m curious about{" "}
            <span className="tp-blank tp-blank--select">
              <label htmlFor={selId} className="sr-only">Puppy you&apos;re interested in (optional)</label>
              <select id={selId} name="puppyId" defaultValue="">
                <option value="">{copy.anyPuppy}</option>
                {puppies.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </span>.
          </p>
          <label htmlFor={msgId} className="sr-only">Your message (optional)</label>
          <textarea id={msgId} name="message" rows={4} maxLength={2000} placeholder={copy.messagePlaceholder} className="tp-letterform__note" aria-invalid={!!errors.message || undefined} />
          <input type="hidden" name="source" value="contact" />
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>Website<input name="website" tabIndex={-1} autoComplete="off" defaultValue="" /></label>
          </div>
          <div className="tp-letterform__sign">
            <p className="font-scrawl">{copy.sign}</p>
            <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-70">{pending ? copy.pending : copy.submit}</button>
          </div>
        </form>
      )}
      {(phase === "sealing" || phase === "posting") && (
        <div aria-hidden="true" className="tp-post__scene">
          <svg viewBox="0 0 160 112" className="tp-post__envelope">
            <rect x="4" y="18" width="152" height="90" rx="6" fill="#fffdf8" stroke="#2a170e" strokeWidth="4" />
            <path d="M6 104 64 62M154 104 96 62" fill="none" stroke="#2a170e" strokeWidth="3" strokeLinecap="round" />
            <path className="tp-post__flap" d="M6 22 80 74 154 22" fill="#fbe3b4" stroke="#2a170e" strokeWidth="4" strokeLinejoin="round" />
            <circle cx="80" cy="72" r="11" fill="#a24a1a" stroke="#2a170e" strokeWidth="3" />
          </svg>
          <svg viewBox="0 0 200 260" className="tp-post__box">
            <rect x="86" y="170" width="28" height="86" fill="#5a3a28" stroke="#2a170e" strokeWidth="4" />
            <path d="M30 70a70 54 0 0 1 140 0v104H30z" fill="#c2622b" stroke="#2a170e" strokeWidth="5" strokeLinejoin="round" />
            <rect x="58" y="86" width="84" height="14" rx="7" fill="#2a170e" />
            <path d="M44 128h112" stroke="#2a170e" strokeWidth="3" strokeLinecap="round" opacity=".35" />
            <g className="tp-post__flag">
              <path d="M170 120V64" stroke="#2a170e" strokeWidth="5" strokeLinecap="round" />
              <path d="M170 64h22v16h-22" fill="#f2be6b" stroke="#2a170e" strokeWidth="4" strokeLinejoin="round" />
            </g>
          </svg>
        </div>
      )}
      {phase === "sent" && (
        <div ref={sentRef} tabIndex={-1} role="status" className="tp-post__sent">
          <svg viewBox="0 0 200 150" aria-hidden="true" className="tp-post__box tp-post__box--sent">
            <rect x="86" y="96" width="28" height="52" fill="#5a3a28" stroke="#2a170e" strokeWidth="4" />
            <path d="M30 50a70 44 0 0 1 140 0v52H30z" fill="#c2622b" stroke="#2a170e" strokeWidth="5" strokeLinejoin="round" />
            <rect x="58" y="58" width="84" height="12" rx="6" fill="#2a170e" />
            <path d="M170 92V22" stroke="#2a170e" strokeWidth="5" strokeLinecap="round" />
            <path d="M170 22h22v16h-22" fill="#f2be6b" stroke="#2a170e" strokeWidth="4" strokeLinejoin="round" />
          </svg>
          <p className="font-plush mt-4 text-[2rem]">{copy.successHeading}</p>
          <p className="mx-auto mt-2 max-w-[40ch] text-cocoa-soft">{copy.successBody}</p>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp mt-6">{copy.successCta}</a>
        </div>
      )}
    </div>
  );
}
