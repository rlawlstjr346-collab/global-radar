"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { preload } from "react-dom";
import { mergeLiveEvents } from "@/lib/atlasMerge";
import type { AtlasBootstrap, LiveEventsPayload } from "@/lib/atlasTypes";
import type { HomeClientProps } from "./HomeClient";
import styles from "./page.module.css";

/**
 * Browser-only atlas. The interactive HomeClient is never server-rendered: the Worker only
 * streams the SEO shell, and the 750 KB atlas data comes from the static assets CDN
 * (/data/*.json, zero Worker CPU) instead of being serialized into every HTML response.
 */
const HomeClient = dynamic(() => import("./HomeClient"), {
  ssr: false,
  loading: () => <div className={styles.mapSkeleton} />,
});

let bootstrapPromise: Promise<AtlasBootstrap> | null = null;

function loadBootstrap(): Promise<AtlasBootstrap> {
  bootstrapPromise ??= Promise.all([
    fetch("/data/atlas-bootstrap.json").then((res) => {
      if (!res.ok) throw new Error(`atlas-bootstrap.json ${res.status}`);
      return res.json() as Promise<AtlasBootstrap>;
    }),
    fetch("/data/live-events.json")
      .then((res) => (res.ok ? (res.json() as Promise<LiveEventsPayload>) : null))
      .catch(() => null),
  ]).then(([bootstrap, live]) => mergeLiveEvents(bootstrap, live));
  // A failed load is retried on the next mount instead of being cached forever.
  bootstrapPromise.catch(() => {
    bootstrapPromise = null;
  });
  return bootstrapPromise;
}

export default function AtlasClient(props: Omit<HomeClientProps, "bootstrap">) {
  // Emitted into the SSR <head>: the browser starts downloading the atlas data with the HTML.
  preload("/data/atlas-bootstrap.json", { as: "fetch", crossOrigin: "anonymous" });
  preload("/data/live-events.json", { as: "fetch", crossOrigin: "anonymous" });
  const [bootstrap, setBootstrap] = useState<AtlasBootstrap | null>(null);

  useEffect(() => {
    let alive = true;
    const load = (attempt: number) =>
      loadBootstrap()
        .then((data) => alive && setBootstrap(data))
        .catch(() => alive && attempt < 3 && setTimeout(() => load(attempt + 1), 1500 * attempt));
    load(1);
    return () => {
      alive = false;
    };
  }, []);

  if (!bootstrap) return <div className={styles.mapSkeleton} />;
  return <HomeClient bootstrap={bootstrap} {...props} />;
}
