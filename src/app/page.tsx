
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
          Transform your running data into cinematic insights. 
          The next generation of statistics for the serious athlete.
        </p>

        {/* Primary Login Options */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* Strava - Primary */}
          <form
            action={async () => {
              "use server";
              await signIn("strava");
            }}
          >
            <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-10 rounded-full transition-all hover:scale-105 shadow-xl shadow-orange-500/20 text-lg flex items-center gap-3">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
              </svg>
              Connect with Strava
            </button>
          </form>

          {/* Garmin - Coming Soon */}
          <button 
            disabled
            className="bg-zinc-800 text-zinc-400 font-bold py-4 px-10 rounded-full transition-all shadow-xl text-lg flex items-center gap-3 cursor-not-allowed opacity-60"
            title="Coming Soon"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22c-5.523 0-10-4.477-10-10S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-18c-4.411 0-8 3.589-8 8s3.589 8 8 8 8-3.589 8-8-3.589-8-8-8zm0 14c-3.309 0-6-2.691-6-6s2.691-6 6-6 6 2.691 6 6-2.691 6-6 6z"/>
            </svg>
            Garmin (Soon)
          </button>
        </div>

        {/* Secondary providers hint */}
        <p className="text-sm text-zinc-600 pt-4">
          Connect additional sources like <span className="text-zinc-500">Oura</span>, <span className="text-zinc-500">WHOOP</span>, and <span className="text-zinc-500">Apple Health</span> after login.
        </p>
      </div>
    </main>
  );
}
