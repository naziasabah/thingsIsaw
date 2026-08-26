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

// To give a photo a description on the back of its focused/flip card, add a
// "filename": "description text" entry below (src/data/galleryConfig.ts:26),
// e.g. { "IMG_1874.jpg": "Almost missed this shot." }. Keep it to a single
// short line — it's written in a handwritten-style font on the card back.
// Any photo whose filename isn't listed here just can't be flipped for now.
export const DESCRIPTIONS: Record<string, string> = {
  "0988DE51-481E-4098-93DB-79282C0ABAFE.jpg" : "First time visiting Niagara Falls.",
  "40A28B98-5C6C-42EF-91F3-8EC688445356.jpg" : "Downtown Toronto view from the ferry.",
  "7CC71A33-A506-471F-98B1-1FF9384217BE.jpg" : "Walking above the Rockies - The Glacier Skywalk",
  "9693BCAD-95FE-4390-9E4A-FB8870BD1082.jpg" : "Fries with a view of Canadian Rockies.",
   "9E79DC9C-1628-43C7-BF68-23EF0F0827E0-0B89758F-4791-499A-B541-EC6C2FCE1430.jpg" : "Vineyard at Niagara on the Lake",
   "BD4114F3-6A95-43A9-A7FC-64CD4A85CE5F.jpg" : "Gooderham Building - Downtown Toronto",
   "D4A661AE-2E5F-463F-9FBC-544A2C3287DC.jpg" : "Road tripping from Jasper to Banff.",
   "D52EC403-C677-4B19-94D1-088E3EE8699C.jpg": "CN Tower view from Centre Island, Toronto.",
  "F2485FBA-485C-4BE3-B328-EF6F8EE701AF.jpg": "Experimenting long exposure photography.",
  "IMG_1874.jpg": "Flamingo at the African Lion Safari, Hamilton, ON",
  "IMG_2312.jpg": "Distillery District during Christmas.",
  "IMG_3338.jpg": "Ripley's Aquarium of Canada.",
  "IMG_3550.jpg": "Sunrise at the Ajax Waterfront Park.",
  "IMG_3643.jpg": "Raft ride at Elora, ON ",
  "IMG_4454.jpeg": "Centre Island view.",
  "IMG_4725_jpg.jpg": "Macaw spotting at Centennial Park, Barrie",
  "IMG_5073.jpg": "Bergeron Centre for Engineering Excellence, Toronto.",
  "IMG_5574.jpeg": "View from Gantry Plaza State Park",
  "IMG_5759.jpg": "Summer at Old Port of Montréal",
  "IMG_5791.jpg": "Chasing sunset somewhere in Montréal",
  "IMG_6027.jpg": "Église Notre-Dame-des-Sept-Douleurs located in the Verdun borough of Montreal, Quebec.",
  "IMG_8865.jpg": "View from our Airbnb at the Blue Mountains.",
  "IMG_8902.jpg": "Guild Park & Gardens",
  "IMG_9315.jpg": "Street photography - Downtown Toronto",
  
  
};
