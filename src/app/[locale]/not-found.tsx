import AtlasNotFound from "@/components/AtlasNotFound";

/** Safety net for unknown params inside a language (the proxy already 404s / redirects most). */
export default function LocaleNotFound() {
  return <AtlasNotFound />;
}
