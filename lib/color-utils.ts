export function getBrightness(hex: string) {
  if (!hex.startsWith("#") || (hex.length !== 7 && hex.length !== 4)) {
    return 0;
  }
  const normalized =
    hex.length === 4
      ? `#${hex
          .slice(1)
          .split("")
          .map((char) => char + char)
          .join("")}`
      : hex;
  const r = Number.parseInt(normalized.slice(1, 3), 16);
  const g = Number.parseInt(normalized.slice(3, 5), 16);
  const b = Number.parseInt(normalized.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}
