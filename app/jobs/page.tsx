import type { Metadata } from "next";

import { JobsClient } from "./JobsClient";

export const metadata: Metadata = {
  title: "Jobs | Flying Rat Studio",
  description:
    "Join Flying Rat Studio in Prague. We're hiring engineers, marketers, and IT specialists to help ship great games.",
};

export default function JobsPage() {
  return <JobsClient />;
}
