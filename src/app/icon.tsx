import { ImageResponse } from "next/og";
import { BRAND_MARK_DATA_URI } from "@/lib/brandMark";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element
    <img src={BRAND_MARK_DATA_URI} width={32} height={32} alt="" />,
    size,
  );
}
