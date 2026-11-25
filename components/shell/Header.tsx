import Image from "next/image";
import { getSettings, whatsappHref } from "@/lib/db";
import { HeaderBehavior, MobileMenu, NavLink } from "@/components/pup/runtime";

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/puppies", label: "Puppies" },
  { href: "/happy-families", label: "Happy families" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Visit & contact" },
];

export default function Header() {
  const s = getSettings();
  const wa = whatsappHref(s);
  return (
    <HeaderBehavior>
      <div className="tp-header__bar gutter">
        <a className="tp-header__brand" aria-label={`${s.siteName} — home`} href="/">
          <Image alt="" width={56} height={56} className="tp-header__logo" src="/brand/logo.webp" priority />
          <span className="font-plush tp-header__name">{s.shortName}</span>
        </a>
        <nav aria-label="Main" className="tp-header__nav">
          <ul>
            {NAV.map((n) => (
              <li key={n.href}>
                <NavLink href={n.href} label={n.label} className="tp-nav-link" />
              </li>
            ))}
          </ul>
        </nav>
        <div className="tp-header__end">
          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp tp-header__wa">WhatsApp us</a>
          <MobileMenu whatsappHref={wa} phoneDisplay={s.phoneDisplay} />
        </div>
      </div>
      <svg aria-hidden="true" className="tp-header__hem" width="100%" height="14" preserveAspectRatio="none">
        <defs>
          <pattern id="tp-hem" width="44" height="14" patternUnits="userSpaceOnUse">
            <path d="M0 0H44V2A22 11 0 0 1 0 2Z" className="tp-header__hem-fill"></path>
            <path d="M0 2A22 11 0 0 0 44 2" className="tp-header__hem-line"></path>
          </pattern>
        </defs>
        <rect width="100%" height="14" fill="url(#tp-hem)"></rect>
      </svg>
    </HeaderBehavior>
  );
}
