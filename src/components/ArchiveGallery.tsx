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
// Touch gets its own, snappier feel than mouse/trackpad drag: real
// touchscreens report movement in coarser, more delayed batches than a
// mouse, which reads as sluggish unless swipes are given extra sensitivity
// and a longer momentum glide to compensate.
const TOUCH_DRAG_GAIN = 2.6;
const TOUCH_FRICTION = 0.965;
const TOUCH_VELOCITY_CAP = 105;
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
// Color grade: cards desaturate and dim the further they sit from center,
// full color/brightness only right at center (or focused, which centers
// itself). Reaches its floor within a few slots so it's still legible on
// the nearest side cards, not just the ones already faded near-invisible.
// Kept subtle — a soft depth cue, not a dramatic color pop.
const COLOR_FALLOFF = 3;
const SATURATION_MIN = 0.55;
const BRIGHTNESS_MIN = 0.85;

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
  // Whether the in-progress (or most recent) drag came from a touchscreen —
  // drives which gain/friction/cap constants apply, without touching
  // mouse/trackpad feel.
  const isTouchRef = useRef(false);

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
  const [isFlipped, setIsFlipped] = useState(false);
  // Mirrors isFlipped for the imperative render loop below (refs, not state,
  // since that loop runs outside React's render cycle).
  const isFlippedRef = useRef(false);
  useEffect(() => {
    isFlippedRef.current = isFlipped;
  }, [isFlipped]);

  const count = images.length;

  // Mirrors the "mobile" breakpoint (archiveConfig's width<640 bucket) for
  // the render loop below — kept as a plain ref, synced alongside configRef,
  // rather than re-deriving it from configRef's tuned physics values.
  const isMobileRef = useRef(false);

  useEffect(() => {
    function syncConfig() {
      configRef.current = getConfig(window.innerWidth);
      isMobileRef.current = window.innerWidth < 640;
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
        // Always distance-driven (not focus-driven): full color right at
        // center, receding toward the floor by COLOR_FALLOFF slots out. A
        // focused card centers itself, so it reaches full color the same way.
        const colorDistance = Math.min(1, Math.abs(raw) / COLOR_FALLOFF);
        const saturation = 1 - colorDistance * (1 - SATURATION_MIN);
        const brightness = 1 - colorDistance * (1 - BRIGHTNESS_MIN);

        // `filter` (even an identity value) on an ancestor of the card's own
        // 3D-transformed flip structure forces that subtree into its own
        // compositing layer in Chromium/WebKit, which can break
        // backface-visibility on the flip's front/back faces — bleed-through
        // either between a card's own front/back, or (mobile only, where the
        // tight carousel radius packs neighbors close enough on screen to be
        // physically behind the focused card) from a neighboring card. On
        // desktop the radius is wide enough that nothing sits behind the
        // focused card, so this only needs to happen while actually flipped
        // there; on mobile it's dropped for the whole time the card is
        // focused. Either way the focused card has settled to raw≈0 (full
        // color, opacity 1) by then anyway, so this has no visible effect on
        // the color-grade/edge-fade look — mobile-only, desktop unaffected.
        const hardenAgainstBleed = isFocused && (isFlippedRef.current || isMobileRef.current);
        el.style.transform = `translate3d(calc(-50% + ${x.toFixed(2)}px), -50%, ${z.toFixed(2)}px) rotateY(${(-theta).toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        el.style.opacity = hardenAgainstBleed ? "1" : opacity.toFixed(3);
        el.style.filter = hardenAgainstBleed
          ? "none"
          : `saturate(${saturation.toFixed(3)}) brightness(${brightness.toFixed(3)})`;
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
          velocityRef.current *= isTouchRef.current ? TOUCH_FRICTION : FRICTION;
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
    setIsFlipped(false);
  }

  function stepFocus(direction: 1 | -1) {
    if (focusedIndexRef.current === null) return;
    const next = (focusedIndexRef.current + direction + count) % count;
    focusOn(next);
  }

  function exitFocus() {
    focusTargetRef.current = 0;
    setFocusedIndex(null);
    setIsFlipped(false);
  }

  // Handles a genuine click/tap anywhere in the carousel, including empty
  // background (index null). While a card is actively focused, clicking the
  // focused photo itself flips it to reveal its description (if it has one)
  // rather than exiting; clicking anything else — a dimmed neighbor, or the
  // empty background around them — still exits focus, same as the close
  // button. Otherwise a click that resolved to a card focuses it. Checked
  // against focusTargetRef (the requested end-state) rather than
  // focusedIndexRef (which lags behind until its fade animation settles) so
  // a click made while a previous focus/exit is still animating out
  // responds immediately instead of being silently swallowed.
  function handleContainerActivation(index: number | null) {
    if (focusedIndexRef.current !== null && focusTargetRef.current === 1) {
      if (index === focusedIndexRef.current) {
        if (images[index]?.description) setIsFlipped((flipped) => !flipped);
      } else {
        exitFocus();
      }
    } else if (index !== null) {
      focusOn(index);
    }
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    hasDraggedRef.current = false;
    isTouchRef.current = e.pointerType === "touch";
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

    const dragGain = isTouchRef.current ? TOUCH_DRAG_GAIN : DRAG_GAIN;
    const nextOffset = dragStartOffsetRef.current - dx * dragGain;

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
        const cap = isTouchRef.current ? TOUCH_VELOCITY_CAP : VELOCITY_CAP;
        const flickVelocity = ((offsetRef.current - first.offset) / dt) * 16.67;
        velocityRef.current = Math.max(-cap, Math.min(cap, flickVelocity));
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
              isFlipped={focusedIndex === i && isFlipped}
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
