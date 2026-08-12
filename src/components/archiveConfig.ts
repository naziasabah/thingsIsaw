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
    cardWidth: 278,
    cardHeight: 372,
    config: { spacing: 229, angleStep: 11, radius: 988, minScale: 0.56, edgeFalloff: 6 },
  },
  {
    minWidth: 640,
    cardWidth: 218,
    cardHeight: 291,
    config: { spacing: 179, angleStep: 13, radius: 702, minScale: 0.52, edgeFalloff: 5 },
  },
  {
    minWidth: 0,
    cardWidth: 161,
    cardHeight: 216,
    config: { spacing: 130, angleStep: 17, radius: 416, minScale: 0.46, edgeFalloff: 3.6 },
  },
];

export function getConfig(width: number): CarouselConfig {
  const bp = BREAKPOINTS.find((b) => width >= b.minWidth) ?? BREAKPOINTS[BREAKPOINTS.length - 1];
  return bp.config;
}
