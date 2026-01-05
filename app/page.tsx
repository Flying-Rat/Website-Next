import { headers } from "next/headers";
import { HomeClient } from "./HomeClient";
import { isPrivacyBrowser } from "./lib/motionDetect";

export default async function Home() {
  const userAgent = (await headers()).get("user-agent") ?? "";
  const initialShouldAnimate = !isPrivacyBrowser(userAgent);

  return <HomeClient initialShouldAnimate={initialShouldAnimate} />;
}
