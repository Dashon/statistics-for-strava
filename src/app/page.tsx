
import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-purple-500/10 pointer-events-none" />
      
      <div className="z-10 text-center space-y-8 max-w-2xl">
        <h1 className="text-7xl font-black tracking-tighter bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent italic">
          QT.run
        </h1>
        <p className="text-xl text-zinc-400 font-medium">
          Transform your Strava data into cinematic insights. 
          The next generation of statistics for the serious athlete.
        </p>

        <form
          action={async () => {
            "use server";
            await signIn("strava");
          }}
        >
          <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-10 rounded-full transition-all hover:scale-105 shadow-xl shadow-orange-500/20 text-lg">
            Connect with Strava
          </button>
        </form>
      </div>
    </main>
  );
}
