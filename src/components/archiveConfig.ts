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

// scaleStep/radius are tuned together so neighboring cards are both clearly
// smaller than center (a steep scale drop-off) AND never overlap it — each
// card's bounding box sits with a clean gap past the previous one's edge,
// so an adjacent card can never cover part of the center image.
export const BREAKPOINTS: Breakpoint[] = [
  {
    minWidth: 1024,
    cardWidth: 360,
    cardHeight: 480,
    config: { spacing: 229, angleStep: 11, radius: 1761, scaleStep: 0.3, minScale: 0.4, edgeFalloff: 6 },
  },
  {
    minWidth: 640,
    cardWidth: 218,
    cardHeight: 291,
    config: { spacing: 179, angleStep: 13, radius: 935, scaleStep: 0.3, minScale: 0.4, edgeFalloff: 5 },
  },
  {
    minWidth: 0,
    cardWidth: 230,
    cardHeight: 308,
    // A noticeably larger center card than the side cards, which now read
    // as thin slivers mostly cropped off by the viewport edge rather than
    // being mostly visible themselves or overlapping the center card.
    config: { spacing: 121, angleStep: 26, radius: 470, scaleStep: 0.34, minScale: 0.3, edgeFalloff: 4 },
  },
];

export function getConfig(width: number): CarouselConfig {
  const bp = BREAKPOINTS.find((b) => width >= b.minWidth) ?? BREAKPOINTS[BREAKPOINTS.length - 1];
  return bp.config;
}
