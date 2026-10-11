import { auth } from "@/lib/auth/config";
import { HomeContent } from "@/components/home/HomeContent";
import { prisma } from "@/lib/db/prisma";

export default async function HomePage() {
  const session = await auth();
  const isSignedIn = !!session?.user;

  const activeRun = session?.user?.id
    ? await prisma.run
        .findFirst({
          where: { userId: session.user.id, status: "IN_PROGRESS" },
          select: { id: true },
        })
        .catch(() => null)
    : null;
  return (
    <HomeContent isSignedIn={isSignedIn} hasActiveRun={Boolean(activeRun)} />
  );
}
