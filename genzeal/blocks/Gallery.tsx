import { Block } from "@/components/Nest";

export type GalleryProps = { images: { image: string; alt: string }[]; columns: "2" | "3" };

export function Gallery({ images, columns }: GalleryProps) {
  const photos = (images ?? []).filter((item) => item.image);
  if (photos.length === 0) return null;
  return (
    <Block>
      <div className={`grid grid-cols-2 gap-3 ${columns === "3" ? "md:grid-cols-3" : ""}`}>
        {photos.map((item, index) => (
          <img
            key={index}
            src={item.image}
            alt={item.alt}
            loading="lazy"
            className="aspect-[4/3] w-full rounded-tile object-cover"
          />
        ))}
      </div>
    </Block>
  );
}
