import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { getProgressionAction } from "@/server/actions/progression";
import { histoireDefinitions } from "@/game/data/histoires";
import { LibraryClient } from "./_components/LibraryClient";

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/library");

  const result = await getProgressionAction();
  if (!result.success) redirect("/");

  return (
    <LibraryClient
      initialProgression={result.data.progression}
      histoires={histoireDefinitions}
    />
  );
}
