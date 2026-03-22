import Image from "next/image";

import { brandName } from "@/lib/brand";

type BrandLogoProps = {
  variant?: "mark" | "lockup";
  className?: string;
  priority?: boolean;
};

const logoAssets = {
  mark: {
    src: "/restshore/logo-mark.svg",
    alt: `${brandName} logo mark`,
    width: 512,
    height: 512,
  },
  lockup: {
    src: "/restshore/logo-lockup.svg",
    alt: `${brandName} logo`,
    width: 1180,
    height: 260,
  },
} as const;

export function BrandLogo({
  variant = "mark",
  className,
  priority = false,
}: BrandLogoProps) {
  const asset = logoAssets[variant];

  return (
    <Image
      src={asset.src}
      alt={asset.alt}
      width={asset.width}
      height={asset.height}
      className={className}
      priority={priority}
    />
  );
}
