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
    cardWidth: 230,
    cardHeight: 308,
    // A noticeably larger center card with the same 5-cards-visible count
    // (edgeFalloff unchanged) as before, but the two cards on each side now
    // read as thin slivers peeking from behind it rather than being mostly
    // visible themselves — a much steeper scaleStep/minScale shrinks them
    // fast, and a tighter radius keeps them pulled in close enough to sit
    // mostly behind the bigger center card. angleStep (rotation per step)
    // is unchanged so the same fan/perspective character carries over.
    config: { spacing: 121, angleStep: 26, radius: 190, scaleStep: 0.34, minScale: 0.3, edgeFalloff: 4 },
  },
];

export function getConfig(width: number): CarouselConfig {
  const bp = BREAKPOINTS.find((b) => width >= b.minWidth) ?? BREAKPOINTS[BREAKPOINTS.length - 1];
  return bp.config;
}
