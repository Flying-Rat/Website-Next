import type { Metadata } from "next";

import { PrivacyPolicyClient } from "./PrivacyPolicyClient";

export const metadata: Metadata = {
  title: "Privacy Policy | Flying Rat Studio",
  description: "Read Flying Rat Studio's privacy policy for games on PC and console platforms.",
  keywords: [
    "Flying Rat Studio",
    "privacy policy",
    "game privacy",
    "telemetry",
    "analytics",
    "GDPR",
  ],
  openGraph: {
    title: "Privacy Policy | Flying Rat Studio",
    description: "Read Flying Rat Studio's privacy policy for games on PC and console platforms.",
    url: "https://flying-rat.studio/games/privacy-policy",
    siteName: "Flying Rat Studio",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | Flying Rat Studio",
    description: "Read Flying Rat Studio's privacy policy for games on PC and console platforms.",
  },
  alternates: {
    canonical: "https://flying-rat.studio/games/privacy-policy",
  },
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyClient />;
}
