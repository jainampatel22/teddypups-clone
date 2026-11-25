"use client";
import { useRef, useState } from "react";

/** HTML5 drag-and-drop + move up/down for a list. Calls onChange with the new array. */
export function useSortable<T>(items: T[], onChange: (next: T[]) => void) {
  const from = useRef<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const move = (a: number, b: number) => {
    if (b < 0 || b >= items.length || a === b) return;
    const next = [...items];
    const [x] = next.splice(a, 1);
    next.splice(b, 0, x);
    onChange(next);
  };
  const itemProps = (i: number) => ({
    draggable: true,
    "data-dragging": dragging === i ? "true" : undefined,
    "data-over": over === i && dragging !== i ? "true" : undefined,
    onDragStart: (e: React.DragEvent) => { from.current = i; setDragging(i); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(i)); },
    onDragOver: (e: React.DragEvent) => { if (from.current === null) return; e.preventDefault(); setOver(i); },
    onDragLeave: () => setOver((o) => (o === i ? null : o)),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); if (from.current !== null) move(from.current, i); from.current = null; setOver(null); setDragging(null); },
    onDragEnd: () => { from.current = null; setOver(null); setDragging(null); },
  });
  return { itemProps, move };
}
