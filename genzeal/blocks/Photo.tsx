export type PhotoProps = { image: string; alt: string; caption: string };

export function Photo({ image, alt, caption }: PhotoProps) {
  if (!image) return null;
  return (
    <figure className="mx-auto max-w-content px-gutter py-8">
      <img src={image} alt={alt} loading="lazy" className="h-auto w-full rounded-media" />
      {caption ? <figcaption className="mt-3 text-small text-ink-500">{caption}</figcaption> : null}
    </figure>
  );
}
