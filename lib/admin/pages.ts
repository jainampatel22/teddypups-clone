export const PAGE_LABEL: Record<string, string> = {
  home: "Home", puppies: "Available puppies", puppy: "Puppy profile (all puppies)", "gone-home": "Gone home",
  "happy-families": "Happy families", "how-it-works": "How it works", faq: "FAQ", contact: "Visit & contact",
};
export const PAGE_PATH = (page: string) => (page === "home" ? "/" : page === "puppy" ? "/puppies" : `/${page}`);
export const pageLabel = (p: string) => PAGE_LABEL[p] ?? p.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
