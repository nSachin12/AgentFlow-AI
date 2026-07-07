import { LandingExperience } from "@/components/home/LandingExperience";

// Server component — no "use client" needed. The actual UI + transition
// state lives in the client island below.
export default function HomePage() {
  return <LandingExperience />;
}
