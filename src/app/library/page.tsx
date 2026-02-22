import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { getProgressionAction } from "@/server/actions/progression";
import { histoireDefinitions } from "@/game/data/histoires";
import { LibraryClient } from "./_components/LibraryClient";
import { LibraryLoadError } from "./_components/LibraryLoadError";

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/library");

  const result = await getProgressionAction();
  if (!result.success) {
    return <LibraryLoadError scope="library" message={result.error.message} />;
  }

  return (
    <LibraryClient
      initialProgression={result.data.progression}
      histoires={histoireDefinitions}
    />
  );
}
