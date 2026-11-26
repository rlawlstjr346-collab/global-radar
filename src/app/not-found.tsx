import type { Metadata } from "next";
import AtlasNotFound from "@/components/AtlasNotFound";

export const metadata: Metadata = {
  title: "404 · World Vintage Atlas",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <AtlasNotFound />;
}
