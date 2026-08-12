import Header from "@/components/Header";
import ArchiveGallery from "@/components/ArchiveGallery";

export default function Home() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#e9eaec] text-black">
      <Header />
      <main className="absolute inset-0">
        <ArchiveGallery />
      </main>
    </div>
  );
}
