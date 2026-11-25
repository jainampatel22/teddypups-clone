"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import TpImage from "@/components/ui/TpImage";
import type { Media } from "@/lib/types";
import { prefersReduced } from "./motion";

export type Friend = { id: string; slug: string; displayName: string; breed: string; cover: Media | null };

// Seat geometry from the original: [x %, width rem, peek, tilt deg]
const SEATS: [number, number, number, number][] = [
  [9, 8.6, 0.62, -5], [22.5, 10.4, 0.8, 3], [35, 9.2, 0.7, -2],
  [65, 9.4, 0.74, 3], [77.5, 10.6, 0.82, -3], [91, 8.4, 0.6, 4],
];
const BEATS = [1900, 2500, 1700, 2300, 2000, 2800, 1800];
const shuffle = <T,>(a: T[]) => { const t = [...a]; for (let i = t.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [t[i], t[j]] = [t[j], t[i]]; } return t; };

/**
 * Hero row of arch photos peeking over the quilt. Every couple of seconds one
 * seat ducks and pops back up (swapping in another available puppy when there
 * are more than six) and shows its name tag.
 */
export default function HeroLineup({ friends }: { friends: Friend[] }) {
  const n = Math.min(SEATS.length, friends.length);
  const [seats, setSeats] = useState(() => friends.slice(0, n).map((_, i) => i));
  const [states, setStates] = useState<Record<number, string | undefined>>({});
  const [popped, setPopped] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [wings, setWings] = useState<number | null>(friends.length > n ? n : null);
  const listRef = useRef<HTMLUListElement>(null);
  const wingsRef = useRef<HTMLSpanElement>(null);
  const seatsRef = useRef(seats);
  useEffect(() => { seatsRef.current = seats; }, [seats]);

  useEffect(() => {
    const list = listRef.current;
    if (!list || !n || prefersReduced()) return;
    const swaps = friends.length > n;
    const scene = list.closest<HTMLElement>("[data-pup-scene]");
    let visible = true, quietUntil = 0, alive = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.35 });
    io.observe(list);
    const hush = () => (quietUntil = performance.now() + 1200);
    addEventListener("scroll", hush, { passive: true });
    addEventListener("pointerdown", hush, { passive: true });
    list.addEventListener("pointerover", hush, { passive: true });

    const offstage = friends.map((_, i) => i).filter((i) => !seatsRef.current.includes(i));
    let queue = offstage.includes(n) ? [n, ...shuffle(offstage.filter((i) => i !== n))] : shuffle(offstage);
    let order: number[] = [];
    let last = -1, beat = 0, tries = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (f: () => void, ms: number) => timers.push(setTimeout(f, ms));

    const tick = (): void => {
      if (!(!document.hidden && visible && performance.now() > quietUntil && scene?.dataset.here !== "false")) return void later(tick, 900);
      if (!swaps) return pop();
      if (!queue.length) queue = shuffle(friends.map((_, i) => i).filter((i) => !seatsRef.current.includes(i)));
      const img = wingsRef.current?.dataset.for === String(queue[0]) ? wingsRef.current.querySelector("img") : null;
      if (!img || !img.complete || !img.naturalWidth) {
        if (++tries < 15) return void later(tick, 400);
        queue.push(queue.shift()!); setWings(queue[0] ?? null); tries = 0; return void later(tick, 800);
      }
      tries = 0;
      img.decode().then(pop, pop);
    };
    const pop = () => {
      if (!order.length) order = shuffle([...list.children].map((c, i) => (c.getClientRects().length ? i : -1)).filter((i) => i >= 0)).filter((v, i, a) => !(i === 0 && v === last && a.length > 1));
      const seat = order.shift();
      if (seat === undefined) return void later(tick, 2000);
      last = seat;
      const incoming = swaps ? queue.shift()! : seatsRef.current[seat];
      setStates((s) => ({ ...s, [seat]: "duck" }));
      later(() => {
        if (swaps) {
          const outgoing = seatsRef.current[seat];
          setSeats((s) => s.map((v, i) => (i === seat ? incoming : v)));
          queue.push(outgoing); setWings(queue[0] ?? null);
        }
        setStates((s) => ({ ...s, [seat]: "pop" }));
        setPopped(seat);
        later(() => setPopped((p) => (p === seat ? null : p)), 1800);
        later(() => setStates((s) => ({ ...s, [seat]: undefined })), 700);
      }, 360);
      later(tick, BEATS[beat++ % BEATS.length]);
    };
    if (swaps) setWings(queue[0] ?? null);
    const peeks = [...list.querySelectorAll(".tp-lineup__pup")].flatMap((e) => e.getAnimations()).filter((a: any) => a.animationName === "tp-peek");
    const start = () => alive && later(tick, 250);
    Promise.all(peeks.map((a) => a.finished)).then(start, start);
    return () => {
      alive = false; timers.forEach(clearTimeout); io.disconnect();
      removeEventListener("scroll", hush); removeEventListener("pointerdown", hush); list.removeEventListener("pointerover", hush);
    };
  }, [friends, n]);

  if (!n) return null;
  const seatStyle = (i: number) => { const [x, w, peek, tilt] = SEATS[i]; return { "--x": `${x}%`, "--w": `${w}rem`, "--peek": peek, "--tilt": `${tilt}deg`, "--i": i } as CSSProperties; };
  const leave = (i: number) => () => setHovered((h) => (h === i ? null : h));

  return (
    <>
      <ul ref={listRef} className="tp-lineup" aria-label="Some of the puppies in our showroom">
        {seats.map((fi, i) => {
          const f = friends[fi];
          return (
            <li key={i} className="tp-lineup__seat" style={seatStyle(i)}>
              <Link href={`/puppies/${f.slug}`} className="tp-lineup__pup" data-pup-friend="" data-state={states[i]} aria-label={`Meet ${f.displayName}, ${f.breed}`}
                onPointerEnter={() => setHovered(i)} onPointerLeave={leave(i)} onFocus={() => setHovered(i)} onBlur={leave(i)}>
                <span className="tp-lineup__photo">{f.cover && <TpImage key={f.id} media={f.cover} alt={f.cover.alt} sizes="11rem" priority={i < 2} loading={i < 2 ? undefined : "eager"} />}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <ul aria-hidden="true" className="tp-lineup tp-lineup--tags">
        {seats.map((fi, i) => (
          <li key={i} className="tp-lineup__seat" style={seatStyle(i)}>
            <span className="tp-lineup__ghost" data-state={states[i]} data-tag={popped === i || hovered === i ? "show" : undefined}>
              <span className="tp-lineup__name font-scrawl">{friends[fi].displayName}</span>
            </span>
          </li>
        ))}
      </ul>
      {wings !== null && friends[wings]?.cover && (
        <span ref={wingsRef} aria-hidden="true" className="tp-lineup__wings" data-for={wings}>
          <TpImage media={friends[wings].cover!} alt="" sizes="11rem" loading="eager" />
        </span>
      )}
    </>
  );
}
