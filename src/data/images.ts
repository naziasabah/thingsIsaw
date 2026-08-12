export interface ArchiveImage {
  id: string;
  src: string;
  alt: string;
}

// Placeholder photography from Lorem Picsum. Swap `src` for real assets later —
// the gallery only depends on this array's shape.
export const archiveImages: ArchiveImage[] = [
  { id: "01", src: "https://picsum.photos/id/1027/600/800", alt: "Archive plate 01" },
  { id: "02", src: "https://picsum.photos/id/1011/600/800", alt: "Archive plate 02" },
  { id: "03", src: "https://picsum.photos/id/1025/600/800", alt: "Archive plate 03" },
  { id: "04", src: "https://picsum.photos/id/1035/600/800", alt: "Archive plate 04" },
  { id: "05", src: "https://picsum.photos/id/1041/600/800", alt: "Archive plate 05" },
  { id: "06", src: "https://picsum.photos/id/1050/600/800", alt: "Archive plate 06" },
  { id: "07", src: "https://picsum.photos/id/1062/600/800", alt: "Archive plate 07" },
  { id: "08", src: "https://picsum.photos/id/1074/600/800", alt: "Archive plate 08" },
  { id: "09", src: "https://picsum.photos/id/109/600/800", alt: "Archive plate 09" },
  { id: "10", src: "https://picsum.photos/id/110/600/800", alt: "Archive plate 10" },
  { id: "11", src: "https://picsum.photos/id/119/600/800", alt: "Archive plate 11" },
  { id: "12", src: "https://picsum.photos/id/129/600/800", alt: "Archive plate 12" },
  { id: "13", src: "https://picsum.photos/id/145/600/800", alt: "Archive plate 13" },
  // Intentionally broken URL — demonstrates the graceful placeholder fallback.
  { id: "14", src: "https://picsum.photos/id/not-a-real-id/600/800", alt: "Archive plate 14" },
];
