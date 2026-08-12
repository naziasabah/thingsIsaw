"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import ArchiveGallery from "./ArchiveGallery";
import type { ArchiveImage } from "@/data/images";

function filesToImages(files: FileList | File[]): ArchiveImage[] {
  return Array.from(files)
    .filter((file) => file.type.startsWith("image/"))
    .map((file, i) => ({
      id: `${Date.now()}-${i}-${file.name}`,
      src: URL.createObjectURL(file),
      alt: file.name,
    }));
}

export default function PhotoGallery() {
  const [images, setImages] = useState<ArchiveImage[]>([]);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | File[]) {
    const next = filesToImages(files);
    if (next.length > 0) setImages((prev) => [...prev, ...next]);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = "";
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  }

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      multiple
      onChange={handleInputChange}
      className="hidden"
    />
  );

  if (images.length === 0) {
    return (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingFile(true);
        }}
        onDragLeave={() => setIsDraggingFile(false)}
        onDrop={handleDrop}
        className={`flex h-full w-full flex-col items-center justify-center gap-4 border-2 border-dashed transition-colors ${
          isDraggingFile ? "border-black/60 bg-black/5" : "border-black/15"
        }`}
      >
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-black/50">
          Drag photos here, or
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="border border-black/30 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-black transition-colors hover:border-black hover:bg-black hover:text-white"
        >
          Choose Photos
        </button>
        {fileInput}
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingFile(true);
      }}
      onDragLeave={() => setIsDraggingFile(false)}
      onDrop={handleDrop}
      className="relative h-full w-full"
    >
      <ArchiveGallery images={images} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center px-6 py-8 sm:py-10">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="pointer-events-auto border border-black/30 bg-white/70 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-black backdrop-blur transition-colors hover:border-black hover:bg-black hover:text-white sm:text-xs"
        >
          Add Photos
        </button>
      </div>
      {isDraggingFile && (
        <div className="pointer-events-none absolute inset-0 z-50 border-2 border-dashed border-black/60 bg-black/5" />
      )}
      {fileInput}
    </div>
  );
}
