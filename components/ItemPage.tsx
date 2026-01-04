
import React, { useState, useEffect } from 'react';
import { FabricItem, FabricRoll } from '../types';

interface ItemPageProps {
  item: FabricItem;
  groups: string[];
  onSave: (updatedItem: FabricItem) => void;
  onBack: () => void;
  onDelete: (id: string) => void;
}

const ItemPage: React.FC<ItemPageProps> = ({ item, groups, onSave, onBack, onDelete }) => {
  const [formData, setFormData] = useState<FabricItem>({ 
    ...item,
    rolls: item.rolls || []
  });

  const totalMeters = (formData.rolls || []).reduce((sum, roll) => sum + (Number(roll.meters) || 0), 0);

  useEffect(() => {
    setFormData(prev => ({ ...prev, quantityMeters: totalMeters }));
  }, [totalMeters]);

  const handleRollFieldChange = (index: number, field: 'lotNumber' | 'remarks', value: string) => {
    const newRolls = [...(formData.rolls || [])];
    if (newRolls[index]) {
      newRolls[index] = { ...newRolls[index], [field]: value };
      setFormData({ ...formData, rolls: newRolls });
    }
  };

  return (
    <div className="min-h-screen bg-white animate-in slide-in-from-right duration-300">
      <div className="sticky top-0 bg-white/90 backdrop-blur-md z-40 border-b border-slate-100 px-4 py-4 flex items-center justify-between shadow-sm">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors">
          <span className="text-xl">←</span>
          <span className="text-xs font-black uppercase tracking-widest">Back</span>
        </button>
        <div className="text-center">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tighter">{formData.name}</h2>
          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{formData.color}</p>
        </div>
        <button 
          onClick={() => onSave(formData)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all"
        >
          Save
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-10">
        <section className="space-y-6">
          <div className="flex items-center justify-between border-l-4 border-indigo-600 pl-4 py-1">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Variant Attributes</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fabric Group</label>
                <select 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3.5 text-xs font-black text-slate-900 uppercase focus:ring-2 focus:ring-indigo-500/20"
                >
                  {groups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Variant / Color Name</label>
                <input 
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value.toUpperCase()})}
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3.5 text-xs font-black text-slate-900 uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stock Category</label>
                <input 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value.toUpperCase()})}
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3.5 text-xs font-black text-indigo-600 uppercase"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">GSM</label>
                  <input 
                    type="number"
                    value={formData.gsm}
                    onChange={(e) => setFormData({...formData, gsm: Number(e.target.value)})}
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3.5 text-xs font-black text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Width (In)</label>
                  <input 
                    type="number"
                    value={formData.widthIn}
                    onChange={(e) => setFormData({...formData, widthIn: Number(e.target.value)})}
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3.5 text-xs font-black text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Location Rack</label>
                <input 
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value.toUpperCase()})}
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3.5 text-xs font-black text-slate-900 uppercase"
                />
              </div>

              <div className="bg-slate-900 p-4 rounded-2xl text-white flex justify-between items-center shadow-lg">
                <span className="text-[10px] font-black uppercase tracking-widest">Consolidated Stock</span>
                <span className="text-xl font-black">{totalMeters.toLocaleString()} <small className="text-[10px] opacity-70">MTRS</small></span>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between border-l-4 border-slate-900 pl-4 py-1">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Stock Roll Inventory</h3>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start gap-3">
            <span className="text-amber-500 text-lg">ℹ️</span>
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide leading-relaxed">
              Rolls marked in amber are <strong>ON HOLD</strong>. These will not be available for standard commercial issuing until released in Quality Checking.
            </p>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse min-w-[320px]">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="py-3 px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest w-24">Lot No.</th>
                  <th className="py-3 px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest w-24">Meters</th>
                  <th className="py-3 px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(formData.rolls || []).map((roll, index) => (
                  <tr key={roll.id} className={`group transition-colors ${roll.isHold ? 'bg-amber-50 shadow-inner' : ''}`}>
                    <td className="py-4 px-2">
                      <input 
                        value={roll.lotNumber}
                        onChange={(e) => handleRollFieldChange(index, 'lotNumber', e.target.value.toUpperCase())}
                        className="w-full bg-transparent border-none p-0 text-xs font-black text-slate-900 focus:ring-0"
                      />
                    </td>
                    <td className="py-4 px-2">
                      <p className={`text-xs font-black ${roll.isHold ? 'text-amber-700' : 'text-indigo-600'}`}>{(roll.meters || 0).toLocaleString()}m</p>
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex flex-col gap-1.5 min-w-0">
                        {roll.isHold && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[7px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded-sm uppercase tracking-widest">LOCKED STOCK</span>
                          </div>
                        )}
                        <input 
                          value={roll.remarks || ''}
                          placeholder="Details..."
                          onChange={(e) => handleRollFieldChange(index, 'remarks', e.target.value)}
                          className={`w-full bg-transparent border-none p-0 text-[11px] font-medium placeholder:text-slate-200 focus:ring-0 ${roll.isHold ? 'text-amber-600' : 'text-slate-500'}`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {(!formData.rolls || formData.rolls.length === 0) && (
              <div className="py-12 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No stock entries registered.</p>
              </div>
            )}
          </div>
        </section>

        <section className="pt-10 flex flex-col items-center gap-6 pb-24">
          <button 
            onClick={() => {
              if(window.confirm('Permanently delete this variant and all its stock history?')) {
                onDelete(formData.id);
              }
            }}
            className="text-[9px] font-bold text-rose-300 hover:text-rose-500 uppercase tracking-widest transition-colors"
          >
            Destroy Variant Entry
          </button>
        </section>
      </div>
    </div>
  );
};

export default ItemPage;
