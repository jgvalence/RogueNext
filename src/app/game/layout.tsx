import type { ReactNode } from "react";

export const metadata = {
  title: "Panlibrarium",
  description: "A deck-builder roguelike through books of mythology",
};

export default function GameRootLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
