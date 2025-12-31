
import { auth } from "@/auth";
import { db } from "@/db";
import { gear } from "@/db/schema";
import { redirect } from "next/navigation";
import { getAthleteProfile } from "@/app/actions/profile";
import { convertDistance, getDistanceUnit, type MeasurementUnit } from "@/lib/units";

export default async function GearPage() {
  const session = (await auth()) as any;
  if (!session?.userId) redirect("/");

  const profile = await getAthleteProfile();
  const unitPreference = (profile?.measurementUnit as MeasurementUnit) || 'metric';

  const allGear = await db.query.gear.findMany({
    columns: { gearId: true, name: true, type: true, distanceInMeter: true, isRetired: true, createdOn: true }
  });

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent italic">
          GEAR
        </h1>
        <p className="text-zinc-500 uppercase tracking-widest text-xs font-bold mt-1">Tools of the Trade</p>
      </div>

      {allGear.length === 0 ? (
        <div className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-16 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-zinc-900 mx-auto flex items-center justify-center">
              <span className="text-3xl">👟</span>
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">No Gear Found</h3>
            <p className="text-zinc-500 text-sm">
              Your gear will appear here once you sync activities that include gear information from Strava.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allGear.map((g) => (
                <div key={g.gearId} className="bg-zinc-950 border border-zinc-900 p-8 rounded-[2.5rem] flex flex-col gap-6 group hover:border-zinc-800 transition-colors">
                    <div className="flex justify-between items-start">
                      <span className="bg-zinc-900 text-zinc-500 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{g.type}</span>
                      {g.isRetired && <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Retired</span>}
                    </div>
                    <div>
                        <h3 className="text-white font-black text-2xl uppercase tracking-tighter italic">{g.name}</h3>
                        <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest mt-1">Brand Identity</p>
                    </div>
                    <div className="pt-6 border-t border-zinc-900 flex justify-between items-end">
                        <div>
                          <span className="text-white font-black text-3xl leading-none">
                            {convertDistance(g.distanceInMeter, unitPreference).toFixed(0)}
                          </span>
                          <span className="text-zinc-600 font-bold ml-2 uppercase text-xs">{getDistanceUnit(unitPreference)}</span>
                        </div>
                        <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic group-hover:text-cyan-500 transition-colors">Usage Stats &rarr;</span>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
}
