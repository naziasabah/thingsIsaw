import { readdirSync } from "node:fs";
import path from "node:path";
import { FEATURED_IMAGE } from "./galleryConfig";

export interface ArchiveImage {
  id: string;
  src: string;
  alt: string;
}

const PHOTOS_DIR = path.join(process.cwd(), "public", "photos");
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"]);

function filenameToAlt(filename: string): string {
  return path
    .parse(filename)
    .name.replace(/[-_]+/g, " ")
    .trim();
}

export function getGalleryImages(): ArchiveImage[] {
  let filenames: string[];

  try {
    filenames = readdirSync(PHOTOS_DIR);
  } catch {
    return [];
  }

  const sorted = filenames
    .filter((filename) => IMAGE_EXTENSIONS.has(path.extname(filename).toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  // The gallery centers whichever image ends up first in this array on
  // page load, so move FEATURED_IMAGE (see galleryConfig.ts) to the front.
  if (FEATURED_IMAGE) {
    const featuredIndex = sorted.indexOf(FEATURED_IMAGE);
    if (featuredIndex > 0) {
      sorted.unshift(sorted.splice(featuredIndex, 1)[0]);
    }
  }

  return sorted.map((filename) => ({
    id: filename,
    src: `/photos/${encodeURIComponent(filename)}`,
    alt: filenameToAlt(filename),
  }));
}
