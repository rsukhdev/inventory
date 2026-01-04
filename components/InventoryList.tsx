
import React, { useState } from 'react';
import { FabricItem } from '../types';

interface InventoryListProps {
  groups: string[];
  items: FabricItem[];
  onEdit: (item: FabricItem) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

const InventoryList: React.FC<InventoryListProps> = ({ groups, items, onEdit, onDelete, onToggleFavorite }) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Grouping items by their group name
  const itemsByGroup = items.reduce((acc, item) => {
    if (!acc[item.name]) {
      acc[item.name] = [];
    }
    acc[item.name].push(item);
    return acc;
  }, {} as Record<string, FabricItem[]>);

  const toggleGroup = (name: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  return (
    <div className="space-y-4">
      {groups.map((groupName) => {
        const groupItems = itemsByGroup[groupName] || [];
        const isExpanded = expandedGroups[groupName];
        
        // Sum total from all rolls of all items in the group - added defensive checks
        const groupTotalMeters = groupItems.reduce((acc, item) => {
          return acc + (item.rolls?.reduce((rSum, roll) => rSum + (Number(roll.meters) || 0), 0) || 0);
        }, 0);

        return (
          <div key={groupName} className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden transition-all duration-300">
            {/* Item Group Header */}
            <div 
              onClick={() => toggleGroup(groupName)}
              className={`p-5 flex items-center justify-between cursor-pointer transition-colors ${isExpanded ? 'bg-slate-50 border-b border-slate-100/50' : 'bg-white'}`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg font-black text-xs uppercase transition-all ${isExpanded ? 'bg-indigo-600 rotate-3' : 'bg-slate-900'}`}>
                  {groupName.substring(0, 2)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-slate-900 text-sm truncate uppercase tracking-tighter">{groupName}</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                    {groupItems.length} Variants Available
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-5">
                <div className="text-right">
                  <span className="text-sm font-black text-indigo-600">{groupTotalMeters.toLocaleString()}m</span>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">Group Stock</p>
                </div>
                <span className={`text-slate-300 text-[10px] transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </div>
            </div>

            {/* Individual Items (Expanded) */}
            {isExpanded && (
              <div className="bg-slate-50/20 animate-in fade-in slide-in-from-top-2 duration-300">
                {groupItems.length > 0 ? (
                  <div className="p-3 space-y-2">
                    {groupItems.map((item) => {
                      // Added defensive check
                      const itemTotal = item.rolls?.reduce((sum, roll) => sum + (Number(roll.meters) || 0), 0) || 0;
                      const hasHold = item.rolls?.some(r => r.isHold);
                      
                      return (
                        <button 
                          key={item.id} 
                          onClick={() => onEdit(item)}
                          className="w-full text-left bg-white p-4 rounded-2xl border border-slate-50 shadow-sm flex items-center justify-between hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50/40 transition-all active:scale-[0.98] group"
                        >
                          <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                            {/* Color Section */}
                            <div className="min-w-0">
                              <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Variant</p>
                              <div className="flex items-center gap-1">
                                <p className="text-[11px] font-black text-slate-900 truncate uppercase tracking-tighter">{item.color}</p>
                                {hasHold && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Locked Stock Present"></span>}
                              </div>
                            </div>

                            {/* Category Tag */}
                            <div>
                              <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Category</p>
                              <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 font-bold rounded-full uppercase tracking-tighter">
                                {item.category || 'N/A'}
                              </span>
                            </div>

                            {/* Rack Location */}
                            <div className="hidden sm:block">
                              <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Rack</p>
                              <p className="text-[11px] font-bold text-slate-500 uppercase">{item.location}</p>
                            </div>

                            {/* Stock Status */}
                            <div className="text-right">
                              <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Meters</p>
                              <div className="flex items-center justify-end gap-2">
                                <span className={`text-[12px] font-black ${itemTotal < 20 ? 'text-rose-600' : 'text-slate-900'}`}>
                                  {itemTotal.toLocaleString()}
                                </span>
                                <div className={`w-1.5 h-1.5 rounded-full ${itemTotal < 20 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="ml-4 pl-4 border-l border-slate-50 text-slate-200 group-hover:text-indigo-400 transition-colors">
                            <span className="text-xs">▶</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-10 text-center">
                    <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.2em]">Zero Stock Entries</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {groups.length === 0 && (
        <div className="py-24 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
          <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.3em]">Vault Empty</p>
        </div>
      )}
    </div>
  );
};

export default InventoryList;
