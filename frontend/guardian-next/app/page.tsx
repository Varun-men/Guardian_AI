import { Navbar } from "@/components/home/Navbar";
import { Hero } from "@/components/home/Hero";
import { HowCards } from "@/components/home/HowCards";
import { WhatTabs } from "@/components/home/WhatTabs";
import { ClosingCta } from "@/components/home/ClosingCta";
import { Faq } from "@/components/home/Faq";
import { Footer } from "@/components/home/Footer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <Hero />
      <main>
        <HowCards />
        <WhatTabs />
        <ClosingCta />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
