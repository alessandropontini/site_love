import { HeroSection } from "@/components/HeroSection";
import { KenBurnsWall } from "@/components/KenBurnsWall";
import { CardStackStage } from "@/components/CardStackStage";

export default function Home() {
  return (
    <>
      <main>
        <HeroSection />
        <KenBurnsWall />
        <CardStackStage />
      </main>
      <footer>crafted for our story • built with next.js + framer motion</footer>
    </>
  );
}
