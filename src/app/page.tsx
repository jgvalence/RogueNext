import { auth } from "@/lib/auth/config";
import { HomeContent } from "@/components/home/HomeContent";

export default async function HomePage() {
  const session = await auth();
  const isSignedIn = !!session?.user;

  return <HomeContent isSignedIn={isSignedIn} />;
}
