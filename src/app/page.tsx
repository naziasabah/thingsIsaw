import Header from "@/components/Header";
import PhotoGallery from "@/components/PhotoGallery";

export default function Home() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#e9eaec] text-black">
      <Header />
      <main className="absolute inset-0">
        <PhotoGallery />
      </main>
    </div>
  );
}
