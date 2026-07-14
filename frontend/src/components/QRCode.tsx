import { useEffect, useState } from "react";
import QR from "qrcode";

export function QRCode({
  value,
  size = 240,
  dark = "#0A0A0A",
  light = "#FFFFFF",
  className,
}: {
  value: string;
  size?: number;
  dark?: string;
  light?: string;
  className?: string;
}) {
  const [dataUrl, setDataUrl] = useState<string>("");
  useEffect(() => {
    let alive = true;
    QR.toDataURL(value, {
      width: size * 2,
      margin: 1,
      color: { dark, light },
      errorCorrectionLevel: "H",
    }).then((d) => {
      if (alive) setDataUrl(d);
    });
    return () => {
      alive = false;
    };
  }, [value, size, dark, light]);
  return (
    <img
      src={dataUrl}
      alt="QR code"
      width={size}
      height={size}
      className={className}
      style={{ imageRendering: "pixelated" }}
    />
  );
}
