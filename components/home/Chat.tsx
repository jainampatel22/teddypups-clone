"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import TpImage from "@/components/ui/TpImage";
import type { Media, Ref, Section } from "@/lib/types";
import { cuePup, useMedia, useReducedMotion } from "./motion";
import { ChatTeddy } from "./stops";

const PAW = "M32 30.5c-7.6 0-15.6 8.3-15.6 15.5 0 5.4 4.2 8.3 9.2 8.3 2.6 0 4.5-1.1 6.4-1.1s3.8 1.1 6.4 1.1c5 0 9.2-2.9 9.2-8.3 0-7.2-8-15.5-15.6-15.5zM19.28 26.71C21.07 30.08 20.42 33.92 17.84 35.29C15.25 36.67 11.71 35.05 9.92 31.69C8.13 28.32 8.78 24.48 11.36 23.11C13.95 21.73 17.49 23.35 19.28 26.71ZM29.62 15.64C30.32 19.62 28.46 23.26 25.47 23.79C22.48 24.32 19.48 21.53 18.78 17.56C18.08 13.58 19.94 9.94 22.93 9.41C25.92 8.88 28.92 11.67 29.62 15.64ZM45.22 17.56C44.52 21.53 41.52 24.32 38.53 23.79C35.54 23.26 33.68 19.62 34.38 15.64C35.08 11.67 38.08 8.88 41.07 9.41C44.06 9.94 45.92 13.58 45.22 17.56ZM54.08 31.69C52.29 35.05 48.75 36.67 46.16 35.29C43.58 33.92 42.93 30.08 44.72 26.71C46.51 23.35 50.05 21.73 52.64 23.11C55.22 24.48 55.87 28.32 54.08 31.69Z";

function Clip({ media }: { media: Media }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  return (
    <div className="tp-msg tp-msg--them tp-msg--media">
      <div className="tp-clip">
        <video ref={ref} src={media.url} poster={media.poster?.url} muted loop playsInline preload="none" aria-label={media.alt || "A puppy video"} onEnded={() => setPlaying(false)} />
        <button type="button" className="tp-clip__play" aria-pressed={playing} aria-label={playing ? "Pause video" : "Play video"}
          onClick={() => { const v = ref.current; if (!v) return; if (v.paused) v.play().then(() => setPlaying(true)).catch(() => {}); else { v.pause(); setPlaying(false); } }}>
          <svg viewBox="0 0 24 24" aria-hidden="true">{playing ? <path d="M7 5h3v14H7zM14 5h3v14h-3z" /> : <path d="M8 5v14l11-7z" />}</svg>
        </button>
      </div>
    </div>
  );
}

/**
 * "Your puppy journey": numbered steps beside a sticky phone. On desktop each
 * step that crosses the reading line makes the chat type for 750ms and then
 * reveals that step's messages (breed chips, photos + video, route home).
 */
export default function Chat({ section, business, greeting, whatsappHref, breeds }: {
  section: Pick<Section, "heading" | "body" | "data" | "media">; business: string; greeting: string; whatsappHref: string; breeds: Ref[];
}) {
  const items: { title: string; text: string }[] = section.data.items ?? [];
  const snaps = section.media.filter((m) => m.kind === "image").slice(0, 4);
  const video = section.media.find((m) => m.kind === "video") ?? null;
  const wide = useMedia("(min-width: 1024px)");
  const still = useReducedMotion() || !wide;
  const [step, setStep] = useState(-1);
  const [typing, setTyping] = useState(false);
  const stepsRef = useRef<HTMLOListElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const active = still ? items.length - 1 : step;

  useEffect(() => {
    if (still || !stepsRef.current) return;
    const lis = [...stepsRef.current.children];
    const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) setStep(lis.indexOf(e.target)); }, { rootMargin: "-28% 0px -62% 0px" });
    lis.forEach((l) => io.observe(l));
    return () => io.disconnect();
  }, [still, items.length]);

  const prev = useRef(-1);
  useEffect(() => {
    if (still) return;
    const forward = step > prev.current;
    prev.current = step;
    if (!forward || step < 0) return;
    setTyping(true);
    const t = setTimeout(() => {
      setTyping(false);
      const el = screenRef.current?.querySelector(`[data-step="${step}"]`);
      if (el) cuePup({ look: el, secs: 1.4, say: step === 1 ? "ooh, photos!" : step === 2 ? "home soon!" : undefined });
    }, 750);
    return () => clearTimeout(t);
  }, [step, still]);

  return (
    <section data-pup-scene="" data-tone="light" className="tp-scene tp-chat" style={{ "--sky-top": "#f7d18d", "--sky-bottom": "#f0b866" } as CSSProperties} aria-labelledby="journey-title">
      <div className="tp-chat__grid gutter" data-pin-range="">
        <div className="tp-chat__story">
          <h2 id="journey-title" className="font-plush text-huge">{section.heading}</h2>
          {section.body && <p className="text-lede mt-5 max-w-[42ch] text-[var(--ink-soft)]">{section.body}</p>}
          <ol ref={stepsRef} className="tp-chat__steps">
            {items.map((it, i) => (
              <li key={it.title} className="tp-chat__step" data-active={i === active || undefined} data-done={i < active || undefined}>
                <span className="tp-chat__num font-plush" aria-hidden="true">{i + 1}</span>
                <h3 className="font-plush tp-chat__title">{it.title}</h3>
                <p className="tp-chat__text">{it.text}</p>
              </li>
            ))}
          </ol>
          {section.data.ctaLabel && <Link href={section.data.ctaHref ?? "/how-it-works"} className="btn btn-ghost tp-chat__cta">{section.data.ctaLabel}</Link>}
        </div>
        <div className="tp-chat__side">
          <div className="tp-phone" aria-label={`A WhatsApp conversation with ${business}`} role="group">
            <div className="tp-phone__bar">
              <Image src="/brand/logo.webp" alt="" width={40} height={40} className="tp-phone__avatar" />
              <span><span className="tp-phone__name">{business}</span><span className="tp-phone__status">{typing ? "typing…" : "online"}</span></span>
            </div>
            <div ref={screenRef} className="tp-phone__screen">
              <p className="tp-msg tp-msg--me">{greeting}</p>
              {items.map((it, i) => (
                <div key={it.title} className="tp-msg-group" data-step={i} data-show={i < active || (i === active && !typing) ? "true" : "false"}>
                  {i === 0 && breeds.length > 0 && (
                    <div className="tp-msg tp-msg--them">
                      <p>{it.text}</p>
                      <ul className="tp-chips" aria-label="Breeds we have now">
                        {breeds.slice(0, 6).map((b) => <li key={b.slug}><Link href={`/puppies?breed=${b.slug}`}>{b.name}</Link></li>)}
                      </ul>
                    </div>
                  )}
                  {i === 0 && breeds.length === 0 && <p className="tp-msg tp-msg--them">{it.text}</p>}
                  {i === 1 && (
                    <>
                      {snaps.length > 0 && (
                        <div className="tp-msg tp-msg--them tp-msg--media">
                          <div className="tp-snaps">{snaps.map((m) => <span key={m.id} className="tp-snaps__one"><TpImage media={m} sizes="9rem" /></span>)}</div>
                        </div>
                      )}
                      {video && <Clip media={video} />}
                      <p className="tp-msg tp-msg--them">{it.text}</p>
                    </>
                  )}
                  {i === 2 && (
                    <div className="tp-msg tp-msg--them">
                      <p>{it.text}</p>
                      <svg viewBox="0 0 220 70" className="tp-route" aria-hidden="true">
                        <path d="M14 52 C 60 6, 120 70, 170 28" className="tp-route__line" />
                        <circle cx="14" cy="52" r="5" className="tp-route__dot" />
                        <path d="M164 32 l12 -12 l12 12 v14 h-24 z" className="tp-route__home" />
                        <path d="M176 42 c-2-3-7-2-6 2c1 3 6 5 6 5s5-2 6-5c1-4-4-5-6-2z" className="tp-route__heart" />
                        <path d={PAW} transform="translate(70 22) scale(.3) rotate(70 32 32)" className="tp-route__paw" />
                        <path d={PAW} transform="translate(104 38) scale(.3) rotate(100 32 32)" className="tp-route__paw" />
                      </svg>
                    </div>
                  )}
                  {i > 2 && <p className="tp-msg tp-msg--them">{it.text}</p>}
                </div>
              ))}
              <p className="tp-typing" data-show={typing ? "true" : "false"} aria-hidden="true"><span /><span /><span /></p>
            </div>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="tp-phone__compose">
              <span>{section.data.composeLabel ?? "Say hello on WhatsApp"}</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 20l18-8L3 4v6l12 2-12 2z" /></svg>
            </a>
          </div>
          <ChatTeddy />
        </div>
      </div>
    </section>
  );
}
