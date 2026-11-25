"use client";
// Port of the original EnquiryForm (puppy page). Submits to the shared `sendEnquiry` server action
// without resetting fields on error; on success flips in a honey "sent" card with an envelope.
import { useActionState, useId, useLayoutEffect, useRef, useTransition } from "react";
import { sendEnquiry, type EnquiryState } from "@/lib/actions";

const INPUT =
  "mt-1.5 h-12 w-full rounded-2xl border-2 border-cocoa/60 bg-milk px-4 text-base outline-none transition-[border-color,box-shadow] focus:border-cocoa focus:shadow-[0_0_0_4px_rgb(242_190_107/0.6)] aria-[invalid=true]:border-[#b3261e]";

function Field({ label, name, error, hint, ...rest }: { label: string; name: string; error?: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-[0.95rem] font-semibold">
        {label}
        {rest.required ? <span className="text-toffee-ink"> *</span> : <span className="font-normal text-cocoa-soft"> (optional)</span>}
      </label>
      <input id={id} name={name} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined} className={INPUT} {...rest} />
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-cocoa-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="mt-1 text-sm font-semibold text-[#b3261e]">
          {error}
        </p>
      )}
    </div>
  );
}

function Sent({ heading, body, whatsappHref }: { heading: string; body: string; whatsappHref: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    ref.current?.animate(
      [
        { transform: "perspective(800px) rotateX(-80deg) translateY(-10px)", opacity: 0 },
        { transform: "perspective(800px) rotateX(8deg) translateY(0)", opacity: 1, offset: 0.7 },
        { transform: "perspective(800px) rotateX(0deg) translateY(0)", opacity: 1 },
      ],
      { duration: 700, easing: "cubic-bezier(.34,1.56,.64,1)" },
    );
  }, []);
  return (
    <div ref={ref} role="status" className="tp-sent rounded-[2rem] border-[3px] border-cocoa bg-honey p-8 text-center">
      <svg viewBox="0 0 120 84" className="tp-envelope mx-auto w-32" aria-hidden>
        <path d="M6 10h108v68H6z" fill="#fffdf8" stroke="#2a170e" strokeWidth="3" strokeLinejoin="round" />
        <path d="M6 10l54 40 54-40" fill="none" stroke="#2a170e" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="94" cy="62" r="12" fill="#c2622b" stroke="#2a170e" strokeWidth="2.5" />
      </svg>
      <p className="font-plush mt-4 text-[2rem]">{heading}</p>
      <p className="mx-auto mt-2 max-w-[38ch] text-cocoa-soft">{body}</p>
      <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp mt-6">
        WhatsApp us
      </a>
    </div>
  );
}

export default function EnquiryForm({
  puppyId,
  message,
  success,
  whatsappHref,
  compact = false,
}: {
  puppyId: string;
  message: string;
  success: { heading: string; body: string };
  whatsappHref: string;
  compact?: boolean;
}) {
  const [state, dispatch, actionPending] = useActionState<EnquiryState, FormData>(sendEnquiry, null);
  const [pending, start] = useTransition();
  const msgId = useId();
  const errs = state?.fieldErrors || {};

  if (state?.ok) return <Sent heading={success.heading} body={success.body} whatsappHref={whatsappHref} />;

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(() => dispatch(fd));
      }}
    >
      {state?.error && !Object.keys(errs).length && (
        <p role="alert" className="rounded-2xl bg-blush px-4 py-3 font-semibold">
          {state.error}
        </p>
      )}
      <div className={compact ? "space-y-5" : "grid gap-5 sm:grid-cols-2"}>
        <Field label="Your name" name="name" autoComplete="name" required minLength={2} maxLength={80} error={errs.name} />
        <Field label="Phone or WhatsApp" name="phone" type="tel" inputMode="tel" autoComplete="tel" required error={errs.phone} hint="With country code, e.g. +971 50 123 4567" />
        <Field label="Email" name="email" type="email" autoComplete="email" error={errs.email} />
        <Field label="Your area" name="area" autoComplete="address-level2" maxLength={80} error={errs.area} hint="e.g. Dubai Marina" />
      </div>
      <input type="hidden" name="puppyId" value={puppyId} />
      <input type="hidden" name="source" value="puppy" />
      <div>
        <label htmlFor={msgId} className="block text-[0.95rem] font-semibold">
          Message <span className="font-normal text-cocoa-soft">(optional)</span>
        </label>
        <textarea
          id={msgId}
          name="message"
          rows={compact ? 3 : 4}
          maxLength={2000}
          className="mt-1.5 w-full rounded-2xl border-2 border-cocoa/60 bg-milk px-4 py-3 text-base outline-none focus:border-cocoa focus:shadow-[0_0_0_4px_rgb(242_190_107/0.6)]"
          defaultValue={message}
        />
        {errs.message && <p className="mt-1 text-sm font-semibold text-[#b3261e]">{errs.message}</p>}
      </div>
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <button type="submit" disabled={pending || actionPending} className="btn btn-primary w-full disabled:opacity-70 sm:w-auto">
        {pending || actionPending ? "Sending…" : "Send enquiry"}
      </button>
    </form>
  );
}
