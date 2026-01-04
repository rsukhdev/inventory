
import React from 'react';
import { supabase } from '../services/supabase';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const isConnected = !!supabase;

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'items', label: 'Items', icon: '📦' },
    { id: 'challan', label: 'Challan', icon: '📄' },
    { id: 'ai', label: 'AI Scan', icon: '✨' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Top Brand Header */}
      <header className="bg-slate-900 text-white px-4 pt-4 pb-2 sticky top-0 z-30 shadow-md no-print">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-indigo-400">Tex</span>Flow
            </h1>
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 border-slate-600 text-slate-400'}`}>
              <span className="text-[8px] font-black uppercase tracking-widest">{isConnected ? 'Cloud Active' : 'Local Storage'}</span>
              <div className={`w-1 h-1 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-slate-400">🔔</button>
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold shadow-lg shadow-indigo-500/20">JD</div>
          </div>
        </div>

        {/* Top Tabs */}
        <nav className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 transition-all relative min-w-[70px] ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-slate-400'
              }`}
            >
              <span className="text-lg mb-1">{tab.icon}</span>
              <span className="text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-t-full"></div>
              )}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-24">
        <div className="p-4 sm:p-6 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @media print {
          .no-print { display: none !important; }
          body { background-color: white !important; }
          main { padding: 0 !important; }
        }
      `}</style>
    </div>
  );
};

export default Layout;
