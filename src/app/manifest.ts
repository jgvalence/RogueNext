import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Panlibrarium",
    short_name: "Panlibrarium",
    description: "Panlibrarium - roguelike deckbuilder",
    start_url: "/",
    display: "standalone",
    orientation: "landscape",
    background_color: "#020617",
    theme_color: "#020617",
    icons: [],
  };
}
