import { Block } from "@/components/Nest";

export type PhotoProps = {
  image: string;
  alt: string;
  caption: string;
  width?: "full" | "narrow";
  rounded?: "yes" | "no";
};

export function Photo({ image, alt, caption, width = "full", rounded = "yes" }: PhotoProps) {
  if (!image) return null;
  return (
    <Block width={width === "narrow" ? "copy" : "content"} center>
      <figure>
        <img src={image} alt={alt} loading="lazy" className={`h-auto w-full ${rounded === "no" ? "" : "rounded-media"}`} />
        {caption ? <figcaption className="mt-3 text-small text-fg-soft">{caption}</figcaption> : null}
      </figure>
    </Block>
  );
}
