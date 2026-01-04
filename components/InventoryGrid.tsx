
import React from 'react';
import { FabricItem } from '../types';

interface InventoryGridProps {
  items: FabricItem[];
  onEdit: (item: FabricItem) => void;
  onDelete: (id: string) => void;
}

const InventoryGrid: React.FC<InventoryGridProps> = ({ items, onEdit, onDelete }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-md transition-shadow">
          <div className="relative h-48 overflow-hidden bg-slate-200">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
            )}
            <div className="absolute top-3 right-3 flex gap-2">
              <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                item.quantityMeters < 10 ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
              }`}>
                {item.quantityMeters < 10 ? 'Low Stock' : 'In Stock'}
              </span>
            </div>
          </div>
          
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-slate-900 leading-tight">{item.name}</h3>
                {/* Fixed: Changed non-existent 'type' to 'category' */}
                <p className="text-xs text-slate-500">{item.category} • {item.composition}</p>
              </div>
              {/* Fixed: Removed non-existent 'pricePerMeter' and replaced with 'color' */}
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-tighter">{item.color}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 my-4 py-3 border-y border-slate-100">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Qty Available</p>
                <p className="text-sm font-medium text-slate-800">{item.quantityMeters} m</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Width / GSM</p>
                {/* Fixed: Changed widthCm to widthIn */}
                <p className="text-sm font-medium text-slate-800">{item.widthIn}" / {item.gsm}g</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 mt-4">
               <button 
                onClick={() => onEdit(item)}
                className="flex-1 px-3 py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 text-xs font-semibold transition-colors"
              >
                Edit
              </button>
              <button 
                onClick={() => onDelete(item.id)}
                className="px-3 py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InventoryGrid;
