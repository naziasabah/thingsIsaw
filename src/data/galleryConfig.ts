// To change which photo is centered when the page first loads, edit the
// FEATURED_IMAGE value below (src/data/galleryConfig.ts:5) to the filename
// of any image in public/photos, e.g. "IMG_1874.jpg". Set it to null to fall
// back to alphabetical order.
export const FEATURED_IMAGE: string | null = "IMG_8902.jpg";

// To pin specific photos to specific positions at the front of the gallery,
// list their filenames in order below (src/data/galleryConfig.ts:15), e.g.
// ["IMG_1874.jpg", "IMG_5073.jpg"] puts IMG_1874 first, IMG_5073 second.
// You only need to list the ones you want to position — every other photo
// in public/photos is appended after them automatically, in alphabetical
// order. Leave the array empty ([]) to use plain alphabetical order for
// everything. Note that FEATURED_IMAGE above always wins the very first
// (centered) spot, even if PHOTO_ORDER lists something else there.
export const PHOTO_ORDER: string[] = [];

// To caption a photo, add a "filename": "caption text" entry below
// (src/data/galleryConfig.ts:21), e.g. { "IMG_1874.jpg": "Sunset at Navy
// Pier" }. Any photo whose filename isn't listed here just has no caption
// for now.
export const PHOTO_CAPTIONS: Record<string, string> = {};
