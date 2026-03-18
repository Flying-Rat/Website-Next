import type { Metadata } from "next";

import { HomeClient } from "./HomeClient";

export const metadata: Metadata = {
  title: "Flying Rat Studio | Game Development Studio",
  description:
    "Prague-based game development studio crafting gameplay that feels amazing. We collaborate with top studios on titles like Beat Saber, Darkest Dungeon 2, and more.",
};

export default function Home() {
  return <HomeClient initialShouldAnimate={true} />;
}
