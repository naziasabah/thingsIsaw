# Things I Saw

A minimal, editorial single-page gallery site built with Next.js, TypeScript, and Tailwind CSS. The centerpiece is a 3D image carousel that arranges portrait cards in a curved, perspective "photo archive" — driven by mouse wheel, trackpad, and click-drag, with inertia and easing.

## Getting started

```bash
npm install
npm run dev
```

Then visit `http://localhost:3000`.

## Structure

- `src/app/page.tsx` — page composition (Header, ArchiveGallery)
- `src/components/Header.tsx` — top-left title
- `src/components/ArchiveGallery.tsx` — the 3D carousel: wheel/drag input, inertia, and per-frame imperative transforms
- `src/components/GalleryCard.tsx` — a single portrait card, with a graceful loading/error placeholder
- `src/components/archiveConfig.ts` — responsive breakpoint tuning for card size, spacing, curvature, and depth
- `src/data/images.ts` — data-driven array of archive images; swap in real assets here

## Notes

- The carousel avoids re-rendering React on every frame: drag/scroll input updates refs, and a single `requestAnimationFrame` loop writes `transform`/`opacity` directly to each card's DOM node.
- Card positions wrap around a virtual cylinder, so scrolling/dragging loops seamlessly in either direction.
