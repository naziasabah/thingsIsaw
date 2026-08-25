"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import GalleryCard from "./GalleryCard";
import { getConfig } from "./archiveConfig";
import type { ArchiveImage } from "@/data/images";

const FRICTION = 0.95;
const WHEEL_GAIN = 0.5;
const DRAG_GAIN = 2.2;
const VELOCITY_CAP = 70;
const VELOCITY_STOP = 0.02;

interface ArchiveGalleryProps {
  images: ArchiveImage[];
}

export default function ArchiveGallery({ images }: ArchiveGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const offsetRef = useRef(0);
  const velocityRef = useRef(0);
  const configRef = useRef(getConfig(typeof window !== "undefined" ? window.innerWidth : 1280));
  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const lastMoveRef = useRef({ x: 0, t: 0 });

  const [isDragging, setIsDragging] = useState(false);

  const count = images.length;

  useEffect(() => {
    function syncConfig() {
      configRef.current = getConfig(window.innerWidth);
    }
    syncConfig();
    window.addEventListener("resize", syncConfig);
    return () => window.removeEventListener("resize", syncConfig);
  }, []);

  useEffect(() => {
    let frame: number;

    function render() {
      const { spacing, angleStep, radius, scaleStep, minScale, edgeFalloff } = configRef.current;
      const slot = offsetRef.current / spacing;

      cardRefs.current.forEach((el, i) => {
        if (!el) return;

        let raw = i - slot;
        raw -= count * Math.round(raw / count);

        const theta = raw * angleStep;
        const rad = (theta * Math.PI) / 180;
        const x = radius * Math.sin(rad);
        const z = radius * (Math.cos(rad) - 1);
        const scale = Math.max(minScale, 1 - Math.abs(raw) * scaleStep);
        const opacity = Math.max(0, Math.min(1, 1 - Math.abs(raw) / edgeFalloff));

        el.style.transform = `translate3d(calc(-50% + ${x.toFixed(2)}px), -50%, ${z.toFixed(2)}px) rotateY(${(-theta).toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        el.style.opacity = opacity.toFixed(3);
        el.style.zIndex = String(Math.round(1000 - Math.abs(raw) * 10));
        el.style.pointerEvents = opacity > 0.02 ? "auto" : "none";
      });
    }

    function tick() {
      if (!draggingRef.current) {
        if (Math.abs(velocityRef.current) > VELOCITY_STOP) {
          offsetRef.current += velocityRef.current;
          velocityRef.current *= FRICTION;
        } else {
          velocityRef.current = 0;
        }
      }
      render();
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [count]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      velocityRef.current += delta * WHEEL_GAIN * 0.1;
      velocityRef.current = Math.max(-VELOCITY_CAP, Math.min(VELOCITY_CAP, velocityRef.current));
    }

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    draggingRef.current = true;
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragStartOffsetRef.current = offsetRef.current;
    lastMoveRef.current = { x: e.clientX, t: performance.now() };
    velocityRef.current = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;

    const dx = e.clientX - dragStartXRef.current;
    const nextOffset = dragStartOffsetRef.current - dx * DRAG_GAIN;

    const now = performance.now();
    const dt = now - lastMoveRef.current.t;
    if (dt > 0) {
      velocityRef.current = ((nextOffset - offsetRef.current) / dt) * 16.67;
    }

    offsetRef.current = nextOffset;
    lastMoveRef.current = { x: e.clientX, t: now };
  }

  function endDrag() {
    draggingRef.current = false;
    setIsDragging(false);
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={(e) => {
        if (e.buttons === 0) endDrag();
      }}
      className={`relative h-full w-full touch-none select-none [perspective:1600px] ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
    >
      <div className="absolute inset-0 [transform-style:preserve-3d]">
        {images.map((image, i) => (
          <GalleryCard key={image.id} image={image} ref={(el) => { cardRefs.current[i] = el; }} />
        ))}
      </div>
    </div>
  );
}
