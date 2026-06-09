import Image from "next/image";

import { cn } from "@/lib/utils";

type AppLogoProps = {
  className?: string;
  size?: number;
};

export function AppLogo({ className, size = 40 }: AppLogoProps) {
  return (
    <Image
      priority
      alt="Olive Social Impact tree logo"
      className={cn("object-contain", className)}
      height={size}
      src="/olive-tree-logo.png"
      width={size}
    />
  );
}
