
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import InventoryList from './components/InventoryList';
import ChallanView from './components/ChallanView';
import ItemPage from './components/ItemPage';
import Settings from './components/Settings';
import { FabricItem, Challan, ChallanMainType, ChallanSubType, FabricRoll } from './types';
import { INITIAL_FABRICS } from './constants';
import { analyzeFabricImage } from './services/geminiService';
import { supabase, DB_TABLES } from './services/supabase';

type ModalType = 'none' | 'add-group' | 'add-item';
type ViewMode = 'main' | 'item-page';

export type ChallanNav = {
  view: 'menu' | 'list' | 'editor';
  mainType?: ChallanMainType;
  subType?: ChallanSubType;
  editingId?: string;
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewMode, setViewMode] = useState<ViewMode>('main');
  const [challanNav, setChallanNav] = useState<ChallanNav>({ view: 'menu' });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  
  const [fabrics, setFabrics] = useState<FabricItem[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [challans, setChallans] = useState<Challan[]>([]);

  // Reset Challan nav when entering tab
  const handleSetTab = (tab: string) => {
    if (tab === 'challan') {
      setChallanNav({ view: 'menu' });
    }
    setActiveTab(tab);
  };

  // INITIAL DATA LOAD
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setDbError(null);

      if (!supabase) {
        const savedFabrics = localStorage.getItem('texflow_fabrics');
        const savedGroups = localStorage.getItem('texflow_groups');
        const savedChallans = localStorage.getItem('texflow_challans');
        
        setFabrics(savedFabrics ? JSON.parse(savedFabrics) : INITIAL_FABRICS);
        setGroups(savedGroups ? JSON.parse(savedGroups) : Array.from(new Set(INITIAL_FABRICS.map((f: any) => f.name))));
        setChallans(savedChallans ? JSON.parse(savedChallans) : []);
        setLoading(false);
        return;
      }

      try {
        const [fabRes, groupRes, challanRes] = await Promise.all([
          supabase.from(DB_TABLES.FABRICS).select('*'),
          supabase.from(DB_TABLES.GROUPS).select('name'),
          supabase.from(DB_TABLES.CHALLANS).select('*').order('date', { ascending: false })
        ]);

        if (fabRes.error || groupRes.error || challanRes.error) {
          const err = fabRes.error || groupRes.error || challanRes.error;
          console.error("Supabase Error:", err);
          
          if (err?.message?.includes('not found')) {
            setDbError("Database connected, but TABLES NOT FOUND. Go to Settings and check the Help section.");
          } else {
            setDbError(`Sync Error: ${err?.message}`);
          }
          
          const savedFabrics = localStorage.getItem('texflow_fabrics');
          setFabrics(savedFabrics ? JSON.parse(savedFabrics) : INITIAL_FABRICS);
        } else {
          if (fabRes.data) setFabrics(fabRes.data);
          if (groupRes.data) setGroups(groupRes.data.map(g => g.name).sort());
          if (challanRes.data) setChallans(challanRes.data);
        }
      } catch (err: any) {
        console.error("DB Sync Exception:", err);
        setDbError("Connection failed. Check your Project URL in Settings.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // PERSISTENCE EFFECT
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('texflow_fabrics', JSON.stringify(fabrics));
      localStorage.setItem('texflow_groups', JSON.stringify(groups));
      localStorage.setItem('texflow_challans', JSON.stringify(challans));
    }
  }, [fabrics, groups, challans, loading]);

  const [modalType, setModalType] = useState<ModalType>('none');
  const [selectedFabric, setSelectedFabric] = useState<FabricItem | null>(null);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setSyncing(true);
    if (supabase) {
      await supabase.from(DB_TABLES.FABRICS).delete().eq('id', id);
    }
    setFabrics(prev => prev.filter(f => f.id !== id));
    setViewMode('main');
    setSelectedFabric(null);
    setSyncing(false);
  };

  const handleOpenItem = (item: FabricItem) => {
    setSelectedFabric(item);
    setViewMode('item-page');
  };

  const handleSaveItemUpdates = async (updatedItem: FabricItem) => {
    setSyncing(true);
    const itemWithTime = { ...updatedItem, lastUpdated: new Date().toISOString() };
    
    if (supabase) {
      await supabase.from(DB_TABLES.FABRICS).upsert(itemWithTime);
    }
    
    setFabrics(prev => prev.map(f => f.id === updatedItem.id ? itemWithTime : f));
    setViewMode('main');
    setSelectedFabric(null);
    setSyncing(false);
  };

  const commitChallanToInventory = async (challan: Challan) => {
    setSyncing(true);
    const updatedFabrics: FabricItem[] = [];

    setFabrics(prevFabrics => {
      let nextFabrics = [...prevFabrics];

      challan.items.forEach(item => {
        const fabricIdx = nextFabrics.findIndex(f => f.id === item.fabricId);
        if (fabricIdx === -1) return;

        const fabric = { ...nextFabrics[fabricIdx] };
        let rolls = [...(fabric.rolls || [])];

        if (challan.mainType === 'Receive') {
          if (item.newRolls) {
            rolls = [...rolls, ...item.newRolls];
          }
        } else if (challan.mainType === 'Issue') {
          item.selectedRolls?.forEach(issued => {
            const rollIdx = rolls.findIndex(r => r.id === issued.rollId);
            if (rollIdx !== -1) {
              if (issued.isPartial) {
                const updatedRoll = { ...rolls[rollIdx] };
                updatedRoll.meters -= issued.metersToIssue;
                rolls[rollIdx] = updatedRoll;
              } else {
                rolls.splice(rollIdx, 1);
              }
            }
          });
        } else if (challan.mainType === 'Checking') {
           if (challan.subType === 'Refolding') {
            item.selectedRolls?.forEach(adj => {
              const rollIdx = rolls.findIndex(r => r.id === adj.rollId);
              if (rollIdx !== -1) {
                rolls[rollIdx] = { ...rolls[rollIdx], meters: adj.newMeters || rolls[rollIdx].meters };
              }
            });
          } else if (challan.subType === 'Hold/Release') {
            item.holdActions?.forEach(action => {
              const rollIdx = rolls.findIndex(r => r.id === action.rollId);
              if (rollIdx !== -1) {
                rolls[rollIdx] = { 
                  ...rolls[rollIdx], 
                  isHold: action.action === 'Hold',
                  holdReason: action.action === 'Hold' ? action.reason : ''
                };
              }
            });
          }
        }

        fabric.rolls = rolls;
        fabric.quantityMeters = rolls.reduce((sum, r) => sum + (Number(r.meters) || 0), 0);
        fabric.lastUpdated = new Date().toISOString();
        nextFabrics[fabricIdx] = fabric;
        updatedFabrics.push(fabric);
      });

      return nextFabrics;
    });

    if (supabase && updatedFabrics.length > 0) {
      await supabase.from(DB_TABLES.FABRICS).upsert(updatedFabrics);
    }
    setSyncing(false);
  };

  const handleSaveChallan = async (challan: Challan) => {
    setSyncing(true);
    const isExisting = challans.some(c => c.id === challan.id);
    
    if (!isExisting && !challan.isTransferred) {
      await commitChallanToInventory(challan);
    }

    if (supabase) {
      await supabase.from(DB_TABLES.CHALLANS).upsert(challan);
    }

    setChallans(prev => {
      const exists = prev.find(c => c.id === challan.id);
      if (exists) return prev.map(c => c.id === challan.id ? challan : c);
      return [challan, ...prev];
    });

    setChallanNav(prev => ({ ...prev, view: 'list' }));
    setSyncing(false);
  };

  const handleToggleFavorite = useCallback(async (id: string) => {
    const item = fabrics.find(f => f.id === id);
    if (!item) return;

    const updated = { ...item, isFavorite: !item.isFavorite };
    setFabrics(prev => prev.map(f => f.id === id ? updated : f));

    if (supabase) {
      await supabase.from(DB_TABLES.FABRICS).update({ is_favorite: updated.isFavorite }).eq('id', id);
    }
  }, [fabrics]);

  const handleSaveGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const groupName = (formData.get('groupName') as string).trim().toUpperCase();
    if (!groupName) return;
    if (groups.includes(groupName)) {
      setGroupError(`The group "${groupName}" already exists.`);
      return;
    }

    setSyncing(true);
    if (supabase) {
      await supabase.from(DB_TABLES.GROUPS).insert({ name: groupName });
    }

    setGroups(prev => [...prev, groupName].sort());
    setGroupError(null);
    setModalType('none');
    setSyncing(false);
  };

  const handleCreateNewItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newItem: FabricItem = {
      id: Date.now().toString(),
      name: (formData.get('name') as string).trim().toUpperCase(), 
      category: (formData.get('category') as string).trim().toUpperCase(),
      color: (formData.get('color') as string).trim().toUpperCase(),
      rolls: [],
      quantityMeters: 0,
      widthIn: Number(formData.get('widthIn')),
      gsm: Number(formData.get('gsm')),
      location: (formData.get('location') as string).trim().toUpperCase(),
      composition: 'Standard',
      imageUrl: `https://picsum.photos/seed/${Date.now()}/400/400`,
      lastUpdated: new Date().toISOString(),
      isFavorite: false
    };

    setSyncing(true);
    if (supabase) {
      await supabase.from(DB_TABLES.FABRICS).insert(newItem);
    }

    setFabrics(prev => [newItem, ...prev]);
    setModalType('none');
    handleOpenItem(newItem);
    setSyncing(false);
  };

  const filteredFabrics = useMemo(() => {
    if (!searchQuery) return fabrics;
    const q = searchQuery.toLowerCase();
    return fabrics.filter(f => 
      f.name.toLowerCase().includes(q) || 
      f.color.toLowerCase().includes(q) || 
      f.location.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q)
    );
  }, [fabrics, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-8 shadow-2xl shadow-indigo-500/20"></div>
        <h2 className="text-xl font-black uppercase tracking-[0.3em] mb-2">TexFlow Core</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Establishing Secure Database Link...</p>
      </div>
    );
  }

  if (viewMode === 'item-page' && selectedFabric) {
    return (
      <ItemPage 
        item={selectedFabric} 
        groups={groups}
        onSave={handleSaveItemUpdates}
        onBack={() => setViewMode('main')}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={handleSetTab}>
      {syncing && (
        <div className="fixed top-4 right-4 z-[100] bg-indigo-600 text-white px-3 py-1.5 rounded-full shadow-xl flex items-center gap-2 animate-in slide-in-from-top-4 duration-300">
          <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
          <span className="text-[8px] font-black uppercase tracking-widest">Syncing Cloud...</span>
        </div>
      )}

      {dbError && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 animate-in fade-in duration-300">
          <span className="text-rose-500 font-bold">⚠️</span>
          <div className="flex-1">
             <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest mb-1">Database Sync Warning</p>
             <p className="text-[11px] font-bold text-rose-600 leading-relaxed uppercase">{dbError}</p>
          </div>
          <button onClick={() => setDbError(null)} className="text-rose-300 hover:text-rose-500 font-bold text-lg leading-none">&times;</button>
        </div>
      )}

      {activeTab === 'dashboard' && (
        <Dashboard 
          items={fabrics} 
          onSelectItem={(item) => {
            setActiveTab('items');
            setSearchQuery(item.name);
          }} 
        />
      )}

      {activeTab === 'items' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Inventory..." 
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-sm transition-all font-medium"
              />
              <span className="absolute left-3 top-3 text-slate-400 text-xs">🔍</span>
            </div>
            <button 
              onClick={() => setModalType('add-group')}
              className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all whitespace-nowrap"
            >
              + Group
            </button>
            <button 
              onClick={() => groups.length === 0 ? alert('Create Group first') : setModalType('add-item')}
              className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all whitespace-nowrap"
            >
              + Item
            </button>
          </div>
          <InventoryList 
            groups={groups}
            items={filteredFabrics} 
            onEdit={handleOpenItem} 
            onDelete={handleDelete}
            onToggleFavorite={handleToggleFavorite}
          />
        </div>
      )}

      {activeTab === 'challan' && (
        <ChallanView 
          challans={challans}
          fabrics={fabrics}
          nav={challanNav}
          setNav={setChallanNav}
          onSave={handleSaveChallan}
        />
      )}

      {activeTab === 'ai' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center">
            <h3 className="text-lg font-bold text-slate-900 tracking-tighter uppercase font-black">AI Scanner</h3>
            <div className="mt-8">
              <div className={`relative border-2 border-dashed rounded-[40px] aspect-square flex flex-col items-center justify-center p-2 transition-all mx-auto max-w-[280px] ${previewImage ? 'border-indigo-400 bg-indigo-50/20 shadow-inner' : 'border-slate-100 bg-slate-50'}`}>
                {previewImage ? <img src={previewImage} className="w-full h-full object-cover rounded-[32px] shadow-sm" /> : <div className="text-center p-4"><span className="text-4xl mb-3 block">📸</span><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Capture Swatch</p></div>}
                <input type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setPreviewImage(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <button disabled={!previewImage || analyzing} onClick={async () => {
                if (!previewImage) return;
                setAnalyzing(true);
                try {
                  const result = await analyzeFabricImage(previewImage);
                  setAnalysisResult(result);
                } catch (err) { alert('Analysis failed.'); } finally { setAnalyzing(false); }
              }} className="mt-8 w-full max-w-[280px] mx-auto py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-2xl">
                {analyzing ? <span className="animate-spin text-lg">⚙️</span> : 'Identify Fabric'}
              </button>
            </div>
          </div>
          {analysisResult && (
            <div className="bg-indigo-600 text-white rounded-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
              <div className="space-y-6">
                <div>
                  <p className="text-[9px] uppercase font-black opacity-50 tracking-widest mb-1">Identified Group</p>
                  <p className="text-2xl font-black uppercase tracking-tighter">{analysisResult.name}</p>
                </div>
                <div className="bg-black/10 p-4 rounded-2xl border border-white/5"><p className="text-xs leading-relaxed font-medium">{analysisResult.description}</p></div>
              </div>
              <button onClick={() => {
                const newItem: FabricItem = {
                  id: Date.now().toString(),
                  name: analysisResult.name,
                  category: 'UNASSIGNED',
                  color: analysisResult.suggestedColor || 'NEW',
                  rolls: [],
                  quantityMeters: 0,
                  widthIn: 0,
                  gsm: 0,
                  composition: analysisResult.estimatedComposition,
                  location: 'PENDING',
                  lastUpdated: new Date().toISOString(),
                  isFavorite: false
                };
                setFabrics(prev => [newItem, ...prev]);
                handleOpenItem(newItem);
              }} className="mt-8 w-full py-5 bg-white text-indigo-700 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">Create Entry</button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <Settings />
      )}

      {modalType !== 'none' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/70 backdrop-blur-md px-4">
          <div className="bg-white rounded-t-[40px] sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-24 duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{modalType === 'add-group' ? 'New Fabric Group' : 'Add New Variant'}</h3>
              <button onClick={() => setModalType('none')} className="text-slate-400 text-2xl px-2 leading-none">&times;</button>
            </div>
            {modalType === 'add-group' && (
              <form onSubmit={handleSaveGroup} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Group Name</label>
                  <input required name="groupName" autoFocus placeholder="e.g. BLACKOUT" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-black text-slate-900 uppercase text-base" />
                  {groupError && <p className="text-[10px] font-bold text-rose-500 uppercase mt-2">⚠️ {groupError}</p>}
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="flex-1 py-4 bg-slate-900 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl active:scale-95 transition-all">Create Group</button>
                </div>
              </form>
            )}
            {modalType === 'add-item' && (
              <form onSubmit={handleCreateNewItem} className="p-8 space-y-5 overflow-y-auto flex-1">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fabric Group</label>
                  <select required name="name" className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-900 uppercase appearance-none">
                    <option value="" disabled>Select Group</option>
                    {groups.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</label><input required name="category" placeholder="Suits, Curtain, Dress, etc." className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold uppercase" /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Color Variant</label><input required name="color" placeholder="Color #1, Beige, etc." className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold uppercase" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">GSM</label><input required name="gsm" type="number" className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" /></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Width (In)</label><input required name="widthIn" type="number" className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" /></div>
                  </div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Location</label><input required name="location" placeholder="RACK A-1" className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold uppercase" /></div>
                </div>
                <div className="pt-6 pb-2"><button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-indigo-100 active:scale-95 transition-all">Proceed to Create Variant</button></div>
              </form>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
