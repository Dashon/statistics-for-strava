'use client';

import { useState } from 'react';
import { RaceList } from './RaceList';
import { RaceForm } from './RaceForm';
import { Plus, X } from 'lucide-react';

export function RaceManagement({ races }: { races: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRace, setEditingRace] = useState<any>(null);

  const handleAdd = () => {
    setEditingRace(null);
    setIsModalOpen(true);
  };

  const handleEdit = (race: any) => {
    setEditingRace(race);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    setEditingRace(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-black uppercase tracking-tight text-white mb-1">Race Calendar</h1>
           <p className="text-zinc-500 text-sm">Manage your upcoming events and past results.</p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Race
        </button>
      </div>

      <RaceList races={races} onEdit={handleEdit} />

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
              <h2 className="text-lg font-bold text-white">
                {editingRace ? 'Edit Race' : 'Schedule Race'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <RaceForm 
                initialData={editingRace}
                onSuccess={handleSuccess}
                onCancel={() => setIsModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
