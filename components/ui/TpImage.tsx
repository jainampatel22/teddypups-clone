import Image, { type ImageProps } from "next/image";
import type { Media } from "@/lib/types";

/**
 * next/image for a CMS Media record, matching the original markup:
 * blur placeholder, focal-point object-position, dominant-colour background.
 * Files are WebP (see lib/image-loader.ts).
 */
export default function TpImage({ media, alt, style, fill = true, ...rest }: { media: Media } & Partial<Omit<ImageProps, "src">>) {
  const src = media.kind === "video" && media.poster ? media.poster : media;
  return (
    <Image
      src={src.url}
      alt={alt ?? src.alt ?? ""}
      {...(fill ? { fill: true } : { width: src.width, height: src.height })}
      placeholder={src.blurDataUrl ? (src.blurDataUrl as `data:image/${string}`) : "empty"}
      quality={75}
      style={{ objectFit: "cover", objectPosition: `${(src.focalX * 100).toFixed(1)}% ${(src.focalY * 100).toFixed(1)}%`, backgroundColor: src.color, ...style }}
      {...rest}
    />
  );
}
