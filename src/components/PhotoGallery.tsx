import ArchiveGallery from "./ArchiveGallery";
import type { ArchiveImage } from "@/data/images";

interface PhotoGalleryProps {
  images: ArchiveImage[];
}

export default function PhotoGallery({ images }: PhotoGalleryProps) {
  if (images.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-black/15 px-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-black/50">
          No photos yet
        </p>
        <p className="max-w-xs font-mono text-[11px] text-black/40">
          Add image files to /public/photos and push to see them here.
        </p>
      </div>
    );
  }

  return <ArchiveGallery images={images} />;
}
