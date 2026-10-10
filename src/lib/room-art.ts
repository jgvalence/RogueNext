/** Painted locations; recurring Scribe encounters deliberately share his identity. */
export function getRoomArtSrc(id: string, size: "small" | "scene" | "full" = "scene") {
  const scene = id.startsWith("scribe_") ? "erased_scribe" : id;
  return `/images/rooms/painted-v1/${scene}${size === "small" ? "-small" : size === "full" ? "-full" : ""}.webp`;
}
