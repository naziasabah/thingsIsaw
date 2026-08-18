import { readdirSync } from "node:fs";
import path from "node:path";

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

  return filenames
    .filter((filename) => IMAGE_EXTENSIONS.has(path.extname(filename).toLowerCase()))
    .sort((a, b) => a.localeCompare(b))
    .map((filename) => ({
      id: filename,
      src: `/photos/${encodeURIComponent(filename)}`,
      alt: filenameToAlt(filename),
    }));
}
