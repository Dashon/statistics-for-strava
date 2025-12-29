
"use client";

import { useState } from "react";
import { syncActivities } from "@/app/actions/sync";
import { RefreshCw } from "lucide-react";
import { clsx } from "clsx";

export default function SyncButton() {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncActivities();
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={syncing}
      className={clsx(
        "flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white rounded-full px-5 py-2 text-sm font-bold uppercase tracking-widest transition-all",
        syncing && "opacity-50 cursor-not-allowed"
      )}
    >
      <RefreshCw className={clsx("w-4 h-4", syncing && "animate-spin")} />
      {syncing ? "Syncing..." : "Sync"}
    </button>
  );
}
