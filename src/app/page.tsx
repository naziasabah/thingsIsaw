import Footer from "@/components/Footer";
import Header from "@/components/Header";
import PhotoGallery from "@/components/PhotoGallery";
import { getGalleryImages } from "@/data/images";

export default function Home() {
  const images = getGalleryImages();

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#e9eaec] text-black">
      <Header />
      <main className="absolute inset-0">
        <PhotoGallery images={images} />
      </main>
      <Footer />
    </div>
  );
}
