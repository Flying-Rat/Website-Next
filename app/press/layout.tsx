import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Press Kit | Flying Rat Studio",
  description:
    "Download official Flying Rat Studio logos and brand assets. Access our press kit with logo files in SVG and PNG formats, plus brand usage guidelines.",
  keywords: [
    "Flying Rat Studio",
    "press kit",
    "brand assets",
    "logo download",
    "media kit",
    "game studio press",
  ],
  openGraph: {
    title: "Press Kit | Flying Rat Studio",
    description:
      "Download official Flying Rat Studio logos and brand assets for press and media use.",
    url: "https://flying-rat.studio/press",
    siteName: "Flying Rat Studio",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Press Kit | Flying Rat Studio",
    description:
      "Download official Flying Rat Studio logos and brand assets for press and media use.",
  },
  alternates: {
    canonical: "https://flying-rat.studio/press",
  },
};

export default function PressLayout({ children }: { children: React.ReactNode }) {
  return children;
}
