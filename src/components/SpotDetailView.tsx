"use client";

import { useState } from "react";
import type { AtlasShopDetail } from "@/lib/atlasTypes";
import type { AtlasCopy } from "@/lib/atlasCopy";
import type { LanguageCode } from "@/lib/i18n/locales";
import { formatOpeningHours, isMeaningfulNote } from "@/lib/formatHours";
import { safeExternalUrl } from "@/lib/safeUrl";
import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  BookmarkIcon,
  CheckIcon,
  CopyIcon,
} from "./AtlasIcons";
import styles from "./SpotDetailView.module.css";

export interface NearbyWalkSpot {
  id: string;
  name: string;
  cc: string;
  distanceM: number;
  walkMin: number;
}

interface SpotDetailViewProps {
  shop: AtlasShopDetail;
  copy: AtlasCopy;
  lang: LanguageCode;
  isSaved: boolean;
  nearbySpots?: NearbyWalkSpot[];
  onToggleSave: (id: string) => void;
  onBack: () => void;
  onSelectAlley?: (alleyId: string) => void;
  onSelectNearbySpot?: (id: string, cc: string) => void;
}

export default function SpotDetailView({
  shop,
  copy,
  lang,
  isSaved,
  nearbySpots = [],
  onToggleSave,
  onBack,
  onSelectAlley,
  onSelectNearbySpot,
}: SpotDetailViewProps) {
  const [copied, setCopied] = useState(false);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    shop.address ? `${shop.name} ${shop.address}` : `${shop.lat},${shop.lng}`,
  )}`;

  const isKorea = shop.country === "KR";
  // Korea: Naver/Kakao are the maps people actually use; prefer the exact place link when we have one.
  const instagramUrl = safeExternalUrl(shop.channels?.instagram);
  const websiteUrl = safeExternalUrl(shop.channels?.website);
  const sources = (shop.sources ?? []).filter((src) => safeExternalUrl(src.url));
  const naverMapUrl =
    safeExternalUrl(shop.channels?.naver) ||
    `https://map.naver.com/p/search/${encodeURIComponent(`${shop.cityKo} ${shop.name}`)}`;
  const kakaoMapUrl =
    safeExternalUrl(shop.channels?.kakao) || `https://map.kakao.com/link/search/${encodeURIComponent(shop.name)}`;
  const reviewSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(
    `${shop.name} ${shop.cityEn || shop.cityKo} vintage`,
  )}`;
  const hoursText = formatOpeningHours(shop.hours, lang);
  const noteText = isMeaningfulNote(shop.note) ? shop.note : undefined;

  const handleCopyAddress = async () => {
    const text = shop.address || `${shop.lat}, ${shop.lng}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable
    }
  };

  return (
    <div className={styles.detail} data-testid="spot-detail-view">
      <div className={styles.topBar}>
        <button type="button" className={styles.backBtn} onClick={onBack}>
          <ArrowLeftIcon size={15} />
          <span>{copy.backToList}</span>
        </button>

        <button
          type="button"
          className={`${styles.saveBtn} ${isSaved ? styles.saveBtnActive : ""}`}
          onClick={() => onToggleSave(shop.id)}
          aria-pressed={isSaved}
          aria-label={copy.savedLabel}
        >
          <BookmarkIcon size={15} filled={isSaved} />
          <span>{copy.savedLabel}</span>
        </button>
      </div>

      <div className={styles.body}>
        <div className={styles.metaStrip}>
          <span className={styles.ccBadge}>{shop.country}</span>
          <span className={styles.cityText}>{shop.cityKo}</span>
          {shop.alley && shop.alleyName && (
            <button
              type="button"
              className={styles.alleyPill}
              onClick={() => onSelectAlley?.(shop.alley!)}
            >
              {shop.alleyName}
            </button>
          )}
        </div>

        <h2 className={styles.title}>{shop.name}</h2>
        {shop.nameEn && <p className={styles.subtitle}>{shop.nameEn}</p>}

        <div className={styles.specTable}>
          {shop.address && (
            <div className={styles.specRow}>
              <span className={styles.specKey}>{copy.specAddress}</span>
              <div className={styles.specValWrap}>
                <span className={styles.specVal}>
                  {shop.address}
                  {shop.floor ? ` · ${shop.floor}` : ""}
                </span>
              </div>
            </div>
          )}

          {shop.near && (
            <div className={styles.specRow}>
              <span className={styles.specKey}>{copy.specStation}</span>
              <span className={`${styles.specVal} tabular-nums`}>
                {shop.near.nameKo || shop.near.name}
                {shop.near.walkMin ? ` · ${copy.walkMin(shop.near.walkMin)}` : ""}
                {shop.near.m ? ` (${shop.near.m}m)` : ""}
              </span>
            </div>
          )}

          {hoursText && (
            <div className={styles.specRow}>
              <span className={styles.specKey}>{copy.specHours}</span>
              <span className={`${styles.specVal} tabular-nums`}>{hoursText}</span>
            </div>
          )}

          <div className={styles.specRow}>
            <span className={styles.specKey}>{copy.specCoords}</span>
            <span className={`${styles.specVal} ${styles.mono} tabular-nums`}>
              {shop.lat.toFixed(5)}, {shop.lng.toFixed(5)}
            </span>
          </div>
        </div>

        {shop.curation && shop.curation.length > 0 && (
          <div className={styles.noteBox}>
            <span className={styles.sectionLabel}>{copy.specCuration}</span>
            <p className={styles.noteText}>{shop.curation.join(" · ")}</p>
          </div>
        )}

        {noteText && (
          <div className={styles.noteBox}>
            <span className={styles.sectionLabel}>{copy.specNote}</span>
            <p className={styles.noteText}>{noteText}</p>
          </div>
        )}

        {(instagramUrl || websiteUrl) && (
        <div className={styles.secondaryLinks}>
          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.outlineChip}
            >
              <span>{copy.instagram}</span>
              <ArrowUpRightIcon size={13} />
            </a>
          )}
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.outlineChip}
            >
              <span>{copy.website}</span>
              <ArrowUpRightIcon size={13} />
            </a>
          )}
        </div>
        )}

        {/* Auto-Computed Walkable Digging Course (<= 800m nearest vintage shops) */}
        {nearbySpots.length > 0 && (
          <div className={styles.nearbySection} data-testid="nearby-walk-course">
            <div className={styles.nearbyHeader}>
              <span className={styles.sectionLabel}>{copy.nearbyWalkTitle}</span>
              <span className={`${styles.nearbyCount} tabular-nums`}>{nearbySpots.length}</span>
            </div>
            <div className={styles.nearbyList}>
              {nearbySpots.map((n, idx) => (
                <button
                  key={n.id}
                  type="button"
                  className={styles.nearbyRow}
                  onClick={() => onSelectNearbySpot?.(n.id, n.cc)}
                >
                  <span className={`${styles.nearbyIndex} tabular-nums`}>{idx + 1}</span>
                  <span className={styles.nearbyName}>{n.name}</span>
                  <span className={`${styles.nearbyDist} tabular-nums`}>
                    {n.distanceM}m · {copy.walkMin(n.walkMin)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {sources.length > 0 && (
          <div className={styles.sourcesBlock}>
            <span className={styles.sectionLabel}>{copy.specSources}</span>
            <ul className={styles.sourceList}>
              {sources.map((src) => (
                <li key={src.url}>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.sourceLink}
                  >
                    <span className={styles.sourceTitle}>{src.title}</span>
                    {src.publisher && (
                      <span className={styles.sourcePub}>{src.publisher}</span>
                    )}
                    <ArrowUpRightIcon size={12} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Country-aware CTA group: Korea -> Naver/Kakao, elsewhere -> Google Maps + review search */}
      <div className={styles.ctaBar} data-testid="spot-cta-bar">
        <a
          href={isKorea ? naverMapUrl : googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.primaryCta}
          data-testid="cta-primary"
        >
          <span>{isKorea ? copy.naverDirectionsCta : copy.directionsCta}</span>
          <ArrowUpRightIcon size={16} />
        </a>
        <div className={styles.ctaRow}>
          <a
            href={isKorea ? kakaoMapUrl : reviewSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondaryCta}
            data-testid="cta-secondary"
          >
            <span>{isKorea ? copy.kakaoMap : copy.reviewSearchCta}</span>
            <ArrowUpRightIcon size={14} />
          </a>
          {isKorea && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.iconCta}
              aria-label={copy.googleMapsShort}
              title={copy.googleMapsShort}
              data-testid="cta-google"
            >
              <span>{copy.googleMapsShort}</span>
              <ArrowUpRightIcon size={13} />
            </a>
          )}
          <button
            type="button"
            className={styles.iconCta}
            onClick={handleCopyAddress}
            data-testid="cta-copy-address"
          >
            {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
            <span>{copied ? copy.copiedAddress : copy.copyAddress}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
