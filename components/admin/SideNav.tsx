"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconPaw, IconHeart, IconQuestion, IconTag, IconText, IconImage, IconMail, IconCog } from "./Icons";

const NAV = [
  { href: "/admin", label: "Dashboard", Icon: IconHome, exact: true },
  { href: "/admin/puppies", label: "Puppies", Icon: IconPaw },
  { href: "/admin/enquiries", label: "Enquiries", Icon: IconMail, countKey: "enquiries" },
  { href: "/admin/families", label: "Happy families", Icon: IconHeart },
  { href: "/admin/faqs", label: "FAQs", Icon: IconQuestion },
  { href: "/admin/sections", label: "Page content", Icon: IconText },
  { href: "/admin/media", label: "Media library", Icon: IconImage },
  { href: "/admin/taxonomy", label: "Breeds & filters", Icon: IconTag },
  { href: "/admin/settings", label: "Settings", Icon: IconCog },
];

export default function SideNav({ newEnquiries }: { newEnquiries: number }) {
  const path = usePathname();
  return (
    <nav className="adm-nav" aria-label="Admin">
      {NAV.map(({ href, label, Icon, exact, countKey }) => {
        const active = exact ? path === href : path === href || path.startsWith(href + "/");
        return (
          <Link key={href} href={href} data-active={active} aria-current={active ? "page" : undefined}>
            <Icon />{label}
            {countKey && newEnquiries > 0 && <span className="adm-count">{newEnquiries}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
