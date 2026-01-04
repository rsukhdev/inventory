
import React from 'react';
import { FabricItem } from '../types';

interface DashboardProps {
  items: FabricItem[];
  onSelectItem: (item: FabricItem) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ items, onSelectItem }) => {
  const favorites = React.useMemo(() => items.filter(item => item.isFavorite), [items]);
  const recents = React.useMemo(() => [...items].sort((a, b) => 
    new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  ).slice(0, 5), [items]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. FAVORITE ITEMS */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Favorite Fabrics</h3>
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">Starred</span>
        </div>
        
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2">
          {favorites.length > 0 ? (
            favorites.map((item) => (
              <div 
                key={item.id} 
                onClick={() => onSelectItem(item)}
                className="min-w-[calc(50%-6px)] w-[calc(50%-6px)] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col active:scale-95 transition-transform"
              >
                <div className="h-32 bg-slate-100 relative">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">🧵</div>
                  )}
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full text-[12px] shadow-sm">⭐</div>
                </div>
                <div className="p-4 flex-1 flex items-center">
                  <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 uppercase">
                    {item.name}
                  </h4>
                </div>
              </div>
            ))
          ) : (
            <div className="w-full py-8 text-center bg-slate-100/50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-xs text-slate-400 uppercase font-bold">No favorites yet</p>
            </div>
          )}
        </div>
      </section>

      {/* 2. RECENTS LIST */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Recently Updated</h3>
          <button className="text-[10px] font-bold text-slate-400 uppercase">View History</button>
        </div>
        
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-50 overflow-hidden">
          {recents.map((item) => (
            <div 
              key={item.id} 
              onClick={() => onSelectItem(item)}
              className="p-4 flex items-center gap-4 active:bg-slate-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0 overflow-hidden border border-slate-100">
                <img src={item.imageUrl} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate uppercase">{item.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-tighter">{item.category}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{item.location}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900">{item.quantityMeters.toLocaleString()}m</p>
                <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-tighter">
                  {new Date(item.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Dashboard;
