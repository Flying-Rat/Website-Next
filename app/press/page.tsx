import type { Metadata } from "next";

import { PressKitClient } from "./PressKitClient";

export const metadata: Metadata = {
  title: "Press Kit | Flying Rat Studio",
  description:
    "Download official Flying Rat Studio logos and brand assets. Access our press kit with logo files in SVG and PNG formats, plus brand usage guidelines.",
};

export default function PressPage() {
  return <PressKitClient />;
}
