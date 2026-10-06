import { Block } from "@/components/Nest";
import { safeHref } from "@/lib/href";

export type Platform = "facebook" | "instagram" | "youtube" | "tiktok" | "messenger" | "website";
export type SocialLinksProps = { items: { platform: Platform; url: string }[] };

export const PLATFORM_NAMES: Record<Platform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  messenger: "Messenger",
  website: "Website",
};

export function SocialLinks({ items }: SocialLinksProps) {
  const links = (items ?? [])
    .map((item) => ({ name: PLATFORM_NAMES[item.platform] ?? "Link", href: safeHref(item.url) }))
    .filter((item) => item.href);
  if (links.length === 0) return null;
  return (
    <Block>
      <ul className="flex flex-wrap justify-center gap-3">
        {links.map((link, index) => (
          <li key={index}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-11 items-center rounded-btn border border-line px-5 text-small font-semibold text-fg transition-colors duration-200 hover:border-brand"
            >
              {link.name}
            </a>
          </li>
        ))}
      </ul>
    </Block>
  );
}
