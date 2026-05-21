import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/apiClient";

interface LogoProps {
  logoPath?: string;
  alt: string;
  size?: number;
  className?: string;
  onLogoAvailable?: (available: boolean) => void;
}

const DEFAULT_LOGO_PATH = "/smartlogo.png";

const normalizeLogoUrl = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:")) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return null;
};

const Logo: React.FC<LogoProps> = ({ logoPath, alt, size = 120, className = "", onLogoAvailable }) => {
  const initialLogo = useMemo(
    () => normalizeLogoUrl(logoPath) ?? (logoPath ? null : DEFAULT_LOGO_PATH),
    [logoPath]
  );

  const [logo, setLogo] = useState<string | null>(initialLogo);
  const [loading, setLoading] = useState<boolean>(initialLogo === null);

  useEffect(() => {
    if (initialLogo) {
      setLogo(initialLogo);
      onLogoAvailable?.(true);
      setLoading(false);
      return;
    }

    api
      .get<{ success: boolean; data: { logo_url?: string | null } | null }>("/api/restaurant")
      .then((res) => {
        const normalized = normalizeLogoUrl(res.data?.logo_url);
        if (normalized) {
          setLogo(normalized);
          onLogoAvailable?.(true);
        } else {
          setLogo(DEFAULT_LOGO_PATH);
          onLogoAvailable?.(false);
        }
      })
      .catch(() => {
        setLogo(DEFAULT_LOGO_PATH);
        onLogoAvailable?.(false);
      })
      .finally(() => setLoading(false));
  }, [initialLogo, onLogoAvailable]);

  if (loading) return <div className={`flex justify-center mb-6 ${className}`}>Loading...</div>;

  const resolvedLogo = logo ?? DEFAULT_LOGO_PATH;

  return (
    <div className={`flex justify-center mb-6 ${className}`}>
      <div className="rounded-full overflow-hidden p-1 bg-white">
        <img
          src={resolvedLogo}
          alt={alt}
          width={size}
          height={size}
          className="rounded-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = DEFAULT_LOGO_PATH;
            setLogo(DEFAULT_LOGO_PATH);
            onLogoAvailable?.(false);
          }}
        />
      </div>
    </div>
  );
};

export default Logo;
