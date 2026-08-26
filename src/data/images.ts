import { readdirSync } from "node:fs";
import path from "node:path";
import { DESCRIPTIONS, FEATURED_IMAGE, PHOTO_CAPTIONS, PHOTO_ORDER } from "./galleryConfig";

export interface ArchiveImage {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  description?: string;
}

const PHOTOS_DIR = path.join(process.cwd(), "public", "photos");
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"]);

function filenameToAlt(filename: string): string {
  return path
    .parse(filename)
    .name.replace(/[-_]+/g, " ")
    .trim();
}

// Moves the filenames listed in PHOTO_ORDER (see galleryConfig.ts) to the
// front, in the order given, and appends everything else afterward in its
// existing (alphabetical) order.
function applyPhotoOrder(filenames: string[]): string[] {
  const remaining = new Set(filenames);
  const ordered: string[] = [];

  for (const filename of PHOTO_ORDER) {
    if (remaining.has(filename)) {
      ordered.push(filename);
      remaining.delete(filename);
    }
  }

  return [...ordered, ...filenames.filter((filename) => remaining.has(filename))];
}

export function getGalleryImages(): ArchiveImage[] {
  let filenames: string[];

  try {
    filenames = readdirSync(PHOTOS_DIR);
  } catch {
    return [];
  }

  const alphabetical = filenames
    .filter((filename) => IMAGE_EXTENSIONS.has(path.extname(filename).toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  const ordered = applyPhotoOrder(alphabetical);

  // The gallery centers whichever image ends up first in this array on
  // page load, so move FEATURED_IMAGE (see galleryConfig.ts) to the front.
  if (FEATURED_IMAGE) {
    const featuredIndex = ordered.indexOf(FEATURED_IMAGE);
    if (featuredIndex > 0) {
      ordered.unshift(ordered.splice(featuredIndex, 1)[0]);
    }
  }

  return ordered.map((filename) => ({
    id: filename,
    src: `/photos/${encodeURIComponent(filename)}`,
    alt: filenameToAlt(filename),
    caption: PHOTO_CAPTIONS[filename],
    description: DESCRIPTIONS[filename],
  }));
}
