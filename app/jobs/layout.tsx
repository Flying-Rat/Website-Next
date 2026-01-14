import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jobs | Flying Rat Studio",
  description:
    "Join Flying Rat Studio in Prague. We're hiring engineers, marketers, and IT specialists to help ship great games.",
  keywords: [
    "Flying Rat Studio",
    "jobs",
    "careers",
    "game development jobs",
    "Prague jobs",
    "Unreal Engineer",
    "Unity Engineer",
  ],
  openGraph: {
    title: "Jobs | Flying Rat Studio",
    description:
      "Join Flying Rat Studio in Prague. We're hiring engineers, marketers, and IT specialists.",
    url: "https://flying-rat.studio/jobs",
    siteName: "Flying Rat Studio",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jobs | Flying Rat Studio",
    description:
      "Join Flying Rat Studio in Prague. We're hiring engineers, marketers, and IT specialists.",
  },
  alternates: {
    canonical: "https://flying-rat.studio/jobs",
  },
};

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
