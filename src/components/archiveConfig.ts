export interface CarouselConfig {
  spacing: number;
  angleStep: number;
  radius: number;
  // How much each card shrinks per step away from center (scale -= scaleStep
  // per index, floored at minScale). Higher = more pronounced depth effect.
  scaleStep: number;
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
    cardWidth: 360,
    cardHeight: 480,
    config: { spacing: 229, angleStep: 11, radius: 988, scaleStep: 0.07, minScale: 0.56, edgeFalloff: 6 },
  },
  {
    minWidth: 640,
    cardWidth: 218,
    cardHeight: 291,
    config: { spacing: 179, angleStep: 13, radius: 702, scaleStep: 0.07, minScale: 0.52, edgeFalloff: 5 },
  },
  {
    minWidth: 0,
    cardWidth: 150,
    cardHeight: 201,
    // Tuned so ~3 cards sit fully in view with a peek of a 4th at each edge
    // on a 375-430px phone, instead of the side cards touching the screen edge.
    // scaleStep/angleStep are pushed well past desktop's so the size and
    // rotation difference between center and side cards reads clearly on
    // a small screen instead of looking flat.
    config: { spacing: 121, angleStep: 26, radius: 258, scaleStep: 0.15, minScale: 0.4, edgeFalloff: 4 },
  },
];

export function getConfig(width: number): CarouselConfig {
  const bp = BREAKPOINTS.find((b) => width >= b.minWidth) ?? BREAKPOINTS[BREAKPOINTS.length - 1];
  return bp.config;
}
