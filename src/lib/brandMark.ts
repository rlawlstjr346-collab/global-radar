/** The ATLAS. wire-globe mark (same geometry as the former icon.svg), as a data URI for ImageResponse. */
export const BRAND_MARK_SVG = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="12" fill="#18181B"/><circle cx="24" cy="24" r="13" stroke="#FFFFFF" stroke-width="2"/><ellipse cx="24" cy="24" rx="6.5" ry="13" stroke="#FFFFFF" stroke-width="1.75"/><line x1="11" y1="24" x2="37" y2="24" stroke="#FFFFFF" stroke-width="1.75"/><circle cx="24" cy="24" r="2.75" fill="#FFFFFF"/></svg>`;

export const BRAND_MARK_DATA_URI = `data:image/svg+xml;base64,${Buffer.from(BRAND_MARK_SVG).toString("base64")}`;
