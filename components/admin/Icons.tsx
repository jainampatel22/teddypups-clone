const P = (d: string) => function Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d={d} />
    </svg>
  );
};
export const IconHome = P("M3 11l9-7 9 7M5 10v10h14V10");
export const IconPaw = P("M12 13c-3 0-6 3.3-6 6 0 2 1.6 3 3.5 3 1 0 1.7-.4 2.5-.4s1.5.4 2.5.4c1.9 0 3.5-1 3.5-3 0-2.7-3-6-6-6zM6.5 12a2 2.5 0 1 1 0-.1M10 7.5a2 2.6 0 1 1 0-.1M14 7.5a2 2.6 0 1 1 0-.1M17.5 12a2 2.5 0 1 1 0-.1");
export const IconHeart = P("M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z");
export const IconQuestion = P("M9.1 9a3 3 0 1 1 4.2 2.7c-.8.4-1.3 1.1-1.3 2V15M12 18.5v.1M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z");
export const IconTag = P("M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5v.1");
export const IconText = P("M4 6h16M4 12h10M4 18h16");
export const IconImage = P("M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9v.1");
export const IconMail = P("M3 6h18v12H3zM3 7l9 6 9-6");
export const IconCog = P("M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z");
export const IconUp = P("M18 15l-6-6-6 6");
export const IconDown = P("M6 9l6 6 6-6");
export const IconGrip = P("M9 5v.1M9 12v.1M9 19v.1M15 5v.1M15 12v.1M15 19v.1");
export const IconTrash = P("M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14");
export const IconEdit = P("M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z");
export const IconStar = P("M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z");
export const IconX = P("M18 6L6 18M6 6l12 12");
export const IconExternal = P("M14 4h6v6M20 4l-9 9M18 14v6H4V6h6");
export const IconPlus = P("M12 5v14M5 12h14");
