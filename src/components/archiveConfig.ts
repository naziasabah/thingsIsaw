export interface CarouselConfig {
  spacing: number;
  angleStep: number;
  radius: number;
  minScale: number;
  edgeFalloff: number;
}

// cardWidth/cardHeight must stay in sync with the width/height classes on
// GalleryCard's root element — the depth math is tuned against these sizes.
interface Breakpoint {
  minWidth: number;
  cardWidth: number;
  cardHeight: number;
  config: CarouselConfig;
}

export const BREAKPOINTS: Breakpoint[] = [
  {
    minWidth: 1024,
    cardWidth: 214,
    cardHeight: 286,
    config: { spacing: 176, angleStep: 11, radius: 760, minScale: 0.56, edgeFalloff: 6 },
  },
  {
    minWidth: 640,
    cardWidth: 168,
    cardHeight: 224,
    config: { spacing: 138, angleStep: 13, radius: 540, minScale: 0.52, edgeFalloff: 5 },
  },
  {
    minWidth: 0,
    cardWidth: 124,
    cardHeight: 166,
    config: { spacing: 100, angleStep: 17, radius: 320, minScale: 0.46, edgeFalloff: 3.6 },
  },
];

export function getConfig(width: number): CarouselConfig {
  const bp = BREAKPOINTS.find((b) => width >= b.minWidth) ?? BREAKPOINTS[BREAKPOINTS.length - 1];
  return bp.config;
}
