"use client";
import { useEffect, useState } from "react";

type T = { id: number; msg: string; tone: "ok" | "error" };
export function toast(msg: string, tone: "ok" | "error" = "ok") {
  window.dispatchEvent(new CustomEvent("adm:toast", { detail: { msg, tone } }));
}
export default function Toaster() {
  const [items, setItems] = useState<T[]>([]);
  useEffect(() => {
    const on = (e: Event) => {
      const { msg, tone } = (e as CustomEvent).detail;
      const id = Date.now() + Math.random();
      setItems((x) => [...x, { id, msg, tone }]);
      setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), tone === "error" ? 6000 : 2600);
    };
    window.addEventListener("adm:toast", on);
    return () => window.removeEventListener("adm:toast", on);
  }, []);
  return (
    <div className="adm-toast-wrap" role="status" aria-live="polite">
      {items.map((t) => <div key={t.id} className="adm-toast" data-tone={t.tone}>{t.msg}</div>)}
    </div>
  );
}
