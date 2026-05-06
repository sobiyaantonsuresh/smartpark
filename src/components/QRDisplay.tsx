import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QRDisplay({ value, size = 220 }: { value: string; size?: number }) {
  const [src, setSrc] = useState<string>("");
  useEffect(() => {
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 1,
      color: { dark: "#0a0f1c", light: "#ffffff" },
    }).then(setSrc);
  }, [value, size]);

  return (
    <div
      className="rounded-xl bg-white p-3"
      style={{ width: size + 24, height: size + 24 }}
    >
      {src ? (
        <img src={src} alt="QR code" width={size} height={size} className="block" />
      ) : (
        <div className="h-full w-full animate-pulse bg-muted" />
      )}
    </div>
  );
}
