'use client';

import { useState } from 'react';
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { updateLayoutConfig } from '@/app/actions/public-profile';
import { Save, Loader2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from "next/dynamic";

const GridLayout = dynamic(
  () => import("react-grid-layout").then((mod) => {
    const RGL = mod.default || mod;
    const TypedMod = mod as any;
    const WidthProvider = TypedMod.WidthProvider || (RGL as any).WidthProvider;
    return WidthProvider ? WidthProvider(RGL) : RGL;
  }),
  { ssr: false }
) as any;

// Type definition for Layout object since the imported one might be mistyped or tricky
interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  static?: boolean;
}

const defaultLayout: LayoutItem[] = [
  { i: 'stats_header', x: 0, y: 0, w: 12, h: 4, static: false },
  { i: 'next_race', x: 0, y: 4, w: 4, h: 8 },
  { i: 'form_curve', x: 4, y: 4, w: 4, h: 8 },
  { i: 'activity_map', x: 8, y: 4, w: 4, h: 8 },
  { i: 'training_volume', x: 0, y: 12, w: 12, h: 8 },
  { i: 'calendar', x: 0, y: 20, w: 12, h: 6 },
  { i: 'race_results', x: 0, y: 26, w: 6, h: 12 },
  { i: 'recent_activities', x: 6, y: 26, w: 6, h: 12 },
];

interface ProfileLayoutEditorProps {
  initialLayout?: any[]; // Allow loose typing from DB
}

export function ProfileLayoutEditor({ initialLayout }: ProfileLayoutEditorProps) {
  const [layout, setLayout] = useState<LayoutItem[]>(
    Array.isArray(initialLayout) ? (initialLayout as LayoutItem[]) : defaultLayout
  );
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleLayoutChange = (newLayout: LayoutItem[]) => {
    setLayout(newLayout);
  };

  const saveLayout = async () => {
    setSaving(true);
    try {
      // Clean layout object (remove internal RGL props if needed, but RGL output is usually clean enough)
      const cleanLayout = layout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h }));
      await updateLayoutConfig(cleanLayout);
      router.refresh();
      alert('Layout saved!');
    } catch (error) {
      console.error(error);
      alert('Failed to save layout');
    } finally {
      setSaving(false);
    }
  };

  const resetLayout = () => {
    if (confirm('Reset to default layout?')) {
      setLayout(defaultLayout);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-zinc-900 p-4 rounded-xl border border-zinc-800">
        <div>
          <h2 className="text-white font-bold">Customize Profile Layout</h2>
          <p className="text-zinc-500 text-xs">Drag and resize widgets to arrange your public profile.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetLayout}
            className="px-3 py-2 rounded bg-zinc-800 text-zinc-400 hover:text-white flex items-center gap-2 text-sm font-bold"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={saveLayout}
            disabled={saving}
            className="px-4 py-2 rounded bg-orange-600 text-white hover:bg-orange-500 flex items-center gap-2 text-sm font-bold"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Layout
          </button>
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden min-h-[800px] relative">
        <GridLayout
          className="layout"
          layout={layout}
          cols={12}
          rowHeight={30}
          // width={1200} // Managed by WidthProvider
          onLayoutChange={handleLayoutChange}
          draggableHandle=".drag-handle"
        >
          <div key="stats_header" className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col">
            <div className="bg-zinc-800/50 p-1 cursor-move drag-handle flex justify-center"><div className="w-8 h-1 bg-zinc-700 rounded-full"/></div>
            <div className="flex-1 flex items-center justify-center font-bold text-zinc-500">Summary Stats</div>
          </div>
          <div key="next_race" className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col">
            <div className="bg-zinc-800/50 p-1 cursor-move drag-handle flex justify-center"><div className="w-8 h-1 bg-zinc-700 rounded-full"/></div>
            <div className="flex-1 flex items-center justify-center font-bold text-zinc-500">Next Race</div>
          </div>
          <div key="form_curve" className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col">
            <div className="bg-zinc-800/50 p-1 cursor-move drag-handle flex justify-center"><div className="w-8 h-1 bg-zinc-700 rounded-full"/></div>
            <div className="flex-1 flex items-center justify-center font-bold text-zinc-500">Form Curve</div>
          </div>
          <div key="activity_map" className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col">
             <div className="bg-zinc-800/50 p-1 cursor-move drag-handle flex justify-center"><div className="w-8 h-1 bg-zinc-700 rounded-full"/></div>
             <div className="flex-1 flex items-center justify-center font-bold text-zinc-500">Activity Map</div>
          </div>
          <div key="training_volume" className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col">
             <div className="bg-zinc-800/50 p-1 cursor-move drag-handle flex justify-center"><div className="w-8 h-1 bg-zinc-700 rounded-full"/></div>
             <div className="flex-1 flex items-center justify-center font-bold text-zinc-500">Training Volume Chart</div>
          </div>
          <div key="calendar" className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col">
             <div className="bg-zinc-800/50 p-1 cursor-move drag-handle flex justify-center"><div className="w-8 h-1 bg-zinc-700 rounded-full"/></div>
             <div className="flex-1 flex items-center justify-center font-bold text-zinc-500">Consistency Calendar</div>
          </div>
          <div key="race_results" className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col">
             <div className="bg-zinc-800/50 p-1 cursor-move drag-handle flex justify-center"><div className="w-8 h-1 bg-zinc-700 rounded-full"/></div>
             <div className="flex-1 flex items-center justify-center font-bold text-zinc-500">Race Results Table</div>
          </div>
          <div key="recent_activities" className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col">
             <div className="bg-zinc-800/50 p-1 cursor-move drag-handle flex justify-center"><div className="w-8 h-1 bg-zinc-700 rounded-full"/></div>
             <div className="flex-1 flex items-center justify-center font-bold text-zinc-500">Recent Activities List</div>
          </div>
        </GridLayout>
      </div>
    </div>
  );
}
