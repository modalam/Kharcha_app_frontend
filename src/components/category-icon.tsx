import { icons, Tag, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function toLucideIconName(value: string): string {
  if (value in icons) return value;

  if (value.includes("-")) {
    return value
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join("");
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function resolveCategoryIcon(icon: string | null | undefined): LucideIcon {
  if (!icon) return Tag;
  const iconName = toLucideIconName(icon);
  return (icons[iconName as keyof typeof icons] as LucideIcon | undefined) ?? Tag;
}

export function getIconColorForBackground(color: string): string {
  const hex = color.replace("#", "");
  if (hex.length !== 6) return "#ffffff";

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.65 ? "#1f2937" : "#ffffff";
}

export function CategoryIcon({
  icon,
  className,
}: {
  icon: string | null | undefined;
  className?: string;
}) {
  const Icon = resolveCategoryIcon(icon);
  return <Icon className={cn("h-5 w-5", className)} />;
}
