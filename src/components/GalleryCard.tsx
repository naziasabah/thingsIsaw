"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import type { ArchiveImage } from "@/data/images";

interface GalleryCardProps {
  image: ArchiveImage;
  index: number;
  onOpen: (index: number) => void;
}

const GalleryCard = forwardRef<HTMLDivElement, GalleryCardProps>(function GalleryCard(
  { image, index, onOpen },
  ref,
) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const imgRef = useRef<HTMLImageElement>(null);

  // A cached or instant (e.g. data URI) image can finish loading before this
  // effect attaches, so the onLoad event never fires — check .complete too.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete) {
      setStatus(img.naturalWidth > 0 ? "loaded" : "error");
    }
  }, [image.src]);

  return (
    <div
      ref={ref}
      data-card-index={index}
      role="button"
      tabIndex={0}
      aria-label={`Open ${image.alt}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(index);
        }
      }}
      className="absolute left-1/2 top-1/2 h-[201px] w-[150px] cursor-pointer will-change-transform sm:h-[291px] sm:w-[218px] lg:h-[480px] lg:w-[360px]"
    >
      <div className="relative h-full w-full overflow-hidden border border-black/10 bg-[#dcdddf] shadow-[0_35px_60px_-30px_rgba(0,0,0,0.4)]">
        {status !== "error" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imgRef}
            src={image.src}
            alt={image.alt}
            draggable={false}
            onLoad={() => setStatus("loaded")}
            onError={() => setStatus("error")}
            className={`h-full w-full select-none object-cover transition-opacity duration-700 ${
              status === "loaded" ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
        {status !== "loaded" && <div className="absolute inset-0 bg-[#dee0e2]" aria-hidden="true" />}
      </div>
    </div>
  );
});

export default GalleryCard;
