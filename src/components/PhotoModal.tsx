"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { ArchiveImage } from "@/data/images";

interface PhotoModalProps {
  images: ArchiveImage[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const SWIPE_THRESHOLD = 50;

export default function PhotoModal({ images, index, onClose, onNavigate }: PhotoModalProps) {
  const [mounted, setMounted] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const dragDelta = useRef(0);

  const image = images[index];
  const count = images.length;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNavigate((index - 1 + count) % count);
      if (e.key === "ArrowRight") onNavigate((index + 1) % count);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [index, count, onClose, onNavigate]);

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    dragStart.current = { x: e.clientX, y: e.clientY };
    dragDelta.current = 0;
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;
    dragDelta.current = e.clientX - dragStart.current.x;
  }

  function handlePointerUp() {
    if (!dragStart.current) return;
    const delta = dragDelta.current;
    dragStart.current = null;
    dragDelta.current = 0;

    if (delta > SWIPE_THRESHOLD) {
      onNavigate((index - 1 + count) % count);
    } else if (delta < -SWIPE_THRESHOLD) {
      onNavigate((index + 1) % count);
    }
  }

  if (!image) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-opacity duration-300 ${
        mounted ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={image.alt}
    >
      {/* Warm spotlight glow, cast down from above the photo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[65%] w-[110%] max-w-5xl -translate-x-1/2 blur-2xl [background:radial-gradient(ellipse_40%_55%_at_50%_-5%,rgba(255,196,120,0.4),transparent_72%)]"
      />

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close"
        className="absolute right-5 top-5 z-10 p-2 text-white/60 transition-colors hover:text-white sm:right-8 sm:top-8"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.25">
          <line x1="1" y1="1" x2="19" y2="19" />
          <line x1="19" y1="1" x2="1" y2="19" />
        </svg>
      </button>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate((index - 1 + count) % count);
            }}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 p-3 text-white/50 transition-colors hover:text-white sm:left-6 sm:block"
          >
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.25">
              <polyline points="12,2 5,10 12,18" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate((index + 1) % count);
            }}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 p-3 text-white/50 transition-colors hover:text-white sm:right-6 sm:block"
          >
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.25">
              <polyline points="8,2 15,10 8,18" />
            </svg>
          </button>
        </>
      )}

      <div
        className={`relative z-[5] flex max-h-[85vh] w-full max-w-4xl flex-col items-center gap-4 px-6 transition-all duration-300 ${
          mounted ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          dragStart.current = null;
          dragDelta.current = 0;
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={image.id}
          src={image.src}
          alt={image.alt}
          draggable={false}
          className="max-h-[70vh] w-auto max-w-full touch-pan-y select-none object-contain shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)]"
        />
        <p className="min-h-[1em] max-w-md text-center font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">
          {image.caption || "—"}
        </p>
      </div>
    </div>
  );
}
