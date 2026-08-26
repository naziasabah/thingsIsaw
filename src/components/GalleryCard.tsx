"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import type { ArchiveImage } from "@/data/images";

interface GalleryCardProps {
  image: ArchiveImage;
  index: number;
  isFlipped: boolean;
  onActivate: (index: number) => void;
}

const GalleryCard = forwardRef<HTMLDivElement, GalleryCardProps>(function GalleryCard(
  { image, index, isFlipped, onActivate },
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
      aria-label={isFlipped ? `Show front of ${image.alt}` : `Focus ${image.alt}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate(index);
        }
      }}
      className="absolute left-1/2 top-1/2 h-[308px] w-[230px] cursor-pointer will-change-transform sm:h-[291px] sm:w-[218px] lg:h-[480px] lg:w-[360px]"
    >
      {/* Local perspective, independent of the carousel's own — the flip is
          a self-contained 3D effect nested inside a card that's already
          being positioned by the carousel's own transform. */}
      <div className="relative h-full w-full [-webkit-perspective:1400px] [perspective:1400px]">
        <div
          className="relative h-full w-full [-webkit-transform-style:preserve-3d] [transform-style:preserve-3d] transition-transform duration-700 ease-in-out"
          style={{
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            WebkitTransform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front face. The translateZ nudge forces its own compositing
              layer — Safari has long-standing bugs where backface-visibility
              on a flip card can still let the "hidden" face show through
              without this. */}
          <div className="absolute inset-0 overflow-hidden border border-black/10 bg-[#dcdddf] shadow-[0_35px_60px_-30px_rgba(0,0,0,0.4)] [-webkit-backface-visibility:hidden] [backface-visibility:hidden] [transform:translateZ(0.01px)]">
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

          {/* Back face */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden border border-black/10 bg-white shadow-[0_35px_60px_-30px_rgba(0,0,0,0.4)] [-webkit-backface-visibility:hidden] [backface-visibility:hidden] [transform:rotateY(180deg)_translateZ(0.01px)]">
            {image.description && (
              <p className="px-6 text-center font-mono text-[10px] leading-relaxed tracking-[0.08em] text-black/60 sm:text-[11px]">
                {image.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default GalleryCard;
