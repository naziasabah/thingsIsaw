"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import GalleryCard from "./GalleryCard";
import { getConfig } from "./archiveConfig";
import type { ArchiveImage } from "@/data/images";

const FRICTION = 0.95;
const WHEEL_GAIN = 0.5;
const DRAG_GAIN = 1.9;
const VELOCITY_CAP = 70;
const VELOCITY_STOP = 0.02;
const CLICK_DRAG_THRESHOLD = 6;
// Release momentum is measured over this trailing window instead of the
// single last pointermove frame, so a flick's throw speed reflects the whole
// gesture rather than whatever tiny/coalesced delta touch happened to report
// right before lift-off.
const VELOCITY_WINDOW_MS = 100;
// How quickly the offset eases toward a programmatic target (focusing a card,
// or stepping to its neighbor) and how quickly focus itself fades in/out.
// Both are simple exponential eases: fraction of the remaining distance
// closed per frame.
const OFFSET_EASE = 0.22;
const FOCUS_EASE = 0.32;
const FOCUS_SETTLE = 0.01;
// How much bigger than a normal centered card (scale 1) the focused card
// grows — clearly past anything reachable by scrolling alone.
const FOCUS_SCALE_BONUS = 0.5;
// How far the non-focused cards fade down while one card is focused. They
// stay visible, just clearly secondary.
const DIM_OPACITY = 0.28;

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
  const hasDraggedRef = useRef(false);
  const pointerDownIndexRef = useRef<number | null>(null);
  const velocitySamplesRef = useRef<{ offset: number; t: number }[]>([]);

  // Programmatic "snap to this slot" target for entering/stepping through
  // focus mode. Null means the offset is under normal momentum physics.
  const targetOffsetRef = useRef<number | null>(null);
  // The card currently exempted from dimming/scaled up. Stays set through the
  // fade-out tail after exiting so that card doesn't flash-dim with the rest.
  const focusedIndexRef = useRef<number | null>(null);
  // 0 = normal carousel, 1 = fully focused. Eases toward focusTargetRef.
  const focusProgressRef = useRef(0);
  const focusTargetRef = useRef(0);

  const [isDragging, setIsDragging] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

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
      const focusedIdx = focusedIndexRef.current;
      const progress = focusProgressRef.current;

      cardRefs.current.forEach((el, i) => {
        if (!el) return;

        let raw = i - slot;
        raw -= count * Math.round(raw / count);

        const theta = raw * angleStep;
        const rad = (theta * Math.PI) / 180;
        const x = radius * Math.sin(rad);
        const z = radius * (Math.cos(rad) - 1);
        const baseScale = Math.max(minScale, 1 - Math.abs(raw) * scaleStep);
        const baseOpacity = Math.max(0, Math.min(1, 1 - Math.abs(raw) / edgeFalloff));

        const isFocused = focusedIdx !== null && i === focusedIdx;
        // An exit has been requested (close button, re-click, Escape): stop
        // treating this card as focused for anything that could block its
        // neighbors, while still letting its scale/opacity ease out smoothly
        // via `progress` below.
        const exiting = focusTargetRef.current === 0;
        const scale = isFocused ? baseScale + progress * FOCUS_SCALE_BONUS : baseScale;
        const opacity =
          focusedIdx !== null && !isFocused ? baseOpacity * (1 - progress * (1 - DIM_OPACITY)) : baseOpacity;
        const normalZ = Math.round(1000 - Math.abs(raw) * 10);

        el.style.transform = `translate3d(calc(-50% + ${x.toFixed(2)}px), -50%, ${z.toFixed(2)}px) rotateY(${(-theta).toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        el.style.opacity = opacity.toFixed(3);
        // Only holds the top z-index while actively focused: during the
        // exit tail its still-enlarged footprint would otherwise keep
        // outranking (and stealing clicks from) a neighbor it visually
        // overlaps, even after that neighbor is interactive again.
        el.style.zIndex = isFocused && !exiting ? "2000" : String(normalZ);
        // Other cards regain interactivity as soon as an exit is requested,
        // not only once the fade-out animation has fully settled — otherwise
        // a click made shortly after closing focus can land on a card that's
        // still (invisibly) mid-fade and non-interactive.
        const interactive = isFocused || ((focusedIdx === null || exiting) && baseOpacity > 0.02);
        el.style.pointerEvents = interactive ? "auto" : "none";
      });
    }

    function tick() {
      if (targetOffsetRef.current !== null) {
        const diff = targetOffsetRef.current - offsetRef.current;
        if (Math.abs(diff) < 0.4) {
          offsetRef.current = targetOffsetRef.current;
          targetOffsetRef.current = null;
        } else {
          offsetRef.current += diff * OFFSET_EASE;
        }
        velocityRef.current = 0;
      } else if (!draggingRef.current) {
        if (Math.abs(velocityRef.current) > VELOCITY_STOP) {
          offsetRef.current += velocityRef.current;
          velocityRef.current *= FRICTION;
        } else {
          velocityRef.current = 0;
        }
      }

      focusProgressRef.current += (focusTargetRef.current - focusProgressRef.current) * FOCUS_EASE;
      if (focusTargetRef.current === 0 && focusProgressRef.current < FOCUS_SETTLE) {
        focusProgressRef.current = 0;
        focusedIndexRef.current = null;
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
      if (focusedIndexRef.current !== null) return;
      e.preventDefault();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      velocityRef.current += delta * WHEEL_GAIN * 0.1;
      velocityRef.current = Math.max(-VELOCITY_CAP, Math.min(VELOCITY_CAP, velocityRef.current));
    }

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (focusedIndexRef.current === null) return;
      if (e.key === "Escape") exitFocus();
      if (e.key === "ArrowLeft") stepFocus(-1);
      if (e.key === "ArrowRight") stepFocus(1);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  // Rotated cards' actual rendered shape is a foreshortened trapezoid inside
  // their axis-aligned bounding box (perspective + rotateY), so a click near
  // a card's edge can miss native hit-testing while still landing inside the
  // card's rectangle — this made only the (unrotated) center card reliably
  // clickable. Fall back to bounding-rect containment, preferring whichever
  // matching card is on top.
  function findCardAtPoint(x: number, y: number): number | null {
    let best: { idx: number; z: number } | null = null;
    for (const el of cardRefs.current) {
      if (!el || el.style.pointerEvents === "none") continue;
      const r = el.getBoundingClientRect();
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
      const z = Number(el.style.zIndex) || 0;
      if (!best || z > best.z) best = { idx: Number(el.dataset.cardIndex), z };
    }
    return best ? best.idx : null;
  }

  function shortestSlotDelta(fromSlot: number, toIndex: number) {
    let delta = toIndex - fromSlot;
    delta -= count * Math.round(delta / count);
    return delta;
  }

  function focusOn(index: number) {
    const { spacing } = configRef.current;
    const currentSlot = offsetRef.current / spacing;
    targetOffsetRef.current = offsetRef.current + shortestSlotDelta(currentSlot, index) * spacing;
    focusedIndexRef.current = index;
    focusTargetRef.current = 1;
    velocityRef.current = 0;
    setFocusedIndex(index);
  }

  function stepFocus(direction: 1 | -1) {
    if (focusedIndexRef.current === null) return;
    const next = (focusedIndexRef.current + direction + count) % count;
    focusOn(next);
  }

  function exitFocus() {
    focusTargetRef.current = 0;
    setFocusedIndex(null);
  }

  // Handles a genuine click/tap anywhere in the carousel, including empty
  // background (index null). While a card is actively focused, ANY such
  // click — the focused photo itself, a dimmed neighbor, or the empty
  // background around them — exits focus, same as the close button.
  // Otherwise a click that resolved to a card focuses it. Checked against
  // focusTargetRef (the requested end-state) rather than focusedIndexRef
  // (which lags behind until its fade animation settles) so a click made
  // while a previous focus/exit is still animating out responds immediately
  // instead of being silently swallowed.
  function handleContainerActivation(index: number | null) {
    if (focusedIndexRef.current !== null && focusTargetRef.current === 1) {
      exitFocus();
    } else if (index !== null) {
      focusOn(index);
    }
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    hasDraggedRef.current = false;
    const directCard = (e.target as HTMLElement).closest<HTMLElement>("[data-card-index]");
    pointerDownIndexRef.current =
      directCard && directCard.style.pointerEvents !== "none"
        ? Number(directCard.dataset.cardIndex)
        : findCardAtPoint(e.clientX, e.clientY);

    if (focusTargetRef.current === 0) {
      draggingRef.current = true;
      setIsDragging(true);
      targetOffsetRef.current = null;
    }
    dragStartXRef.current = e.clientX;
    dragStartOffsetRef.current = offsetRef.current;
    lastMoveRef.current = { x: e.clientX, t: performance.now() };
    velocityRef.current = 0;
    velocitySamplesRef.current = [{ offset: offsetRef.current, t: performance.now() }];
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const dx = e.clientX - dragStartXRef.current;
    if (Math.abs(dx) > CLICK_DRAG_THRESHOLD) hasDraggedRef.current = true;

    if (!draggingRef.current) return;

    const nextOffset = dragStartOffsetRef.current - dx * DRAG_GAIN;

    const now = performance.now();
    const dt = now - lastMoveRef.current.t;
    if (dt > 0) {
      velocityRef.current = ((nextOffset - offsetRef.current) / dt) * 16.67;
    }

    offsetRef.current = nextOffset;
    lastMoveRef.current = { x: e.clientX, t: now };

    const samples = velocitySamplesRef.current;
    samples.push({ offset: nextOffset, t: now });
    const cutoff = now - VELOCITY_WINDOW_MS;
    while (samples.length > 1 && samples[0].t < cutoff) samples.shift();
  }

  // Resolve tap-vs-drag here, from the pointer's own down/up positions, rather
  // than relying on the browser's separate "click" event: once a pointer is
  // captured (below), browsers differ on whether/where a click still fires,
  // so click can't be trusted to distinguish a tap from a drag release.
  function handlePointerUp() {
    const wasGenuineClick = !hasDraggedRef.current;
    const index = pointerDownIndexRef.current;

    // Re-derive release velocity from the whole trailing window rather than
    // trusting the last live per-frame sample (see VELOCITY_WINDOW_MS above).
    const samples = velocitySamplesRef.current;
    if (draggingRef.current && samples.length > 0) {
      const first = samples[0];
      const now = performance.now();
      const dt = now - first.t;
      if (dt > 8) {
        const flickVelocity = ((offsetRef.current - first.offset) / dt) * 16.67;
        velocityRef.current = Math.max(-VELOCITY_CAP, Math.min(VELOCITY_CAP, flickVelocity));
      }
    }

    draggingRef.current = false;
    setIsDragging(false);
    pointerDownIndexRef.current = null;

    if (!wasGenuineClick) return;
    handleContainerActivation(index !== null && !Number.isNaN(index) ? index : null);
  }

  function cancelDrag() {
    draggingRef.current = false;
    setIsDragging(false);
    pointerDownIndexRef.current = null;
  }

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={cancelDrag}
        onPointerLeave={(e) => {
          if (e.buttons === 0) cancelDrag();
        }}
        className={`relative h-full w-full touch-none select-none [perspective:1600px] ${
          focusedIndex !== null ? "cursor-default" : isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        <div className="absolute inset-0 [transform-style:preserve-3d]">
          {images.map((image, i) => (
            <GalleryCard
              key={image.id}
              image={image}
              index={i}
              onActivate={handleContainerActivation}
              ref={(el) => { cardRefs.current[i] = el; }}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={exitFocus}
        aria-label="Close"
        tabIndex={focusedIndex !== null ? 0 : -1}
        className={`absolute right-5 top-5 z-[2001] p-2 text-black/50 transition-opacity duration-300 hover:text-black sm:right-8 sm:top-8 ${
          focusedIndex !== null ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.25">
          <line x1="1" y1="1" x2="19" y2="19" />
          <line x1="19" y1="1" x2="1" y2="19" />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => stepFocus(-1)}
        aria-label="Previous photo"
        tabIndex={focusedIndex !== null ? 0 : -1}
        className={`absolute left-2 top-1/2 z-[2001] -translate-y-1/2 p-3 text-black/50 transition-opacity duration-300 hover:text-black sm:left-6 ${
          focusedIndex !== null ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.25">
          <polyline points="12,2 5,10 12,18" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => stepFocus(1)}
        aria-label="Next photo"
        tabIndex={focusedIndex !== null ? 0 : -1}
        className={`absolute right-2 top-1/2 z-[2001] -translate-y-1/2 p-3 text-black/50 transition-opacity duration-300 hover:text-black sm:right-6 ${
          focusedIndex !== null ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.25">
          <polyline points="8,2 15,10 8,18" />
        </svg>
      </button>
    </div>
  );
}
