import { listAllMedia, mediaUsage, isStaticArtwork } from "@/lib/admin/repo";
import MediaLibrary from "@/components/admin/MediaLibrary";

export const metadata = { title: "Media library" };

export default function MediaPage() {
  const usage = mediaUsage();
  const media = listAllMedia().map((m) => {
    const u = usage.get(m.id) ?? [];
    return { ...m, usage: u.length ? u : isStaticArtwork(m.id) ? [{ type: "settings" as const, label: "Page artwork (site markup)", href: "" }] : [] };
  });
  return (
    <>
      <div className="adm-head"><div><h1>Media library</h1><p>Every photo is stored as WebP (full size up to 1920px plus a 640px copy). Videos are MP4 with a WebP poster.</p></div></div>
      <MediaLibrary media={media} />
    </>
  );
}
