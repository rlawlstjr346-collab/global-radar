import { ImageResponse } from "next/og";
import { BRAND_MARK_DATA_URI } from "@/lib/brandMark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element
    <img src={BRAND_MARK_DATA_URI} width={180} height={180} alt="" />,
    size,
  );
}
