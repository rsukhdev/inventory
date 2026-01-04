
import React, { useState, useMemo, useEffect } from 'react';
import { Challan, FabricItem, ChallanMainType, ChallanSubType, FabricRoll, SelectedIssueRoll, HoldAction, ChallanItem } from '../types';
import { ChallanNav } from '../App';

const QualityRollSelector: React.FC<{
  quality: FabricItem;
  mode: ChallanMainType;
  subType: ChallanSubType;
  onCancel: () => void;
  onComplete: (item: ChallanItem) => void;
}> = ({ quality, mode, subType, onCancel, onComplete }) => {
  const [newRolls, setNewRolls] = useState<FabricRoll[]>([]);
  const [selectedIssueRolls, setSelectedIssueRolls] = useState<SelectedIssueRoll[]>([]);
  const [holdActions, setHoldActions] = useState<HoldAction[]>([]);

  const [lotInput, setLotInput] = useState('');
  const [metersInput, setMetersInput] = useState('');

  const handleAddReceiveRoll = () => {
    if (!metersInput || isNaN(Number(metersInput))) return;
    const newRoll: FabricRoll = {
      id: `new-${Date.now()}-${newRolls.length}`,
      lotNumber: lotInput.toUpperCase() || 'N/A',
      meters: Number(metersInput),
      remarks: ''
    };
    setNewRolls([...newRolls, newRoll]);
    setLotInput('');
    setMetersInput('');
  };

  const handleToggleIssueRoll = (roll: FabricRoll) => {
    const existing = selectedIssueRolls.find(r => r.rollId === roll.id);
    if (existing) {
      setSelectedIssueRolls(selectedIssueRolls.filter(r => r.rollId !== roll.id));
    } else {
      setSelectedIssueRolls([...selectedIssueRolls, {
        rollId: roll.id,
        metersToIssue: roll.meters,
        isPartial: false
      }]);
    }
  };

  const handleAdjustIssueMeters = (rollId: string, meters: number) => {
    const roll = quality.rolls.find(r => r.id === rollId);
    if (!roll) return;
    const m = Math.min(meters, roll.meters);
    setSelectedIssueRolls(prev => prev.map(r => 
      r.rollId === rollId ? { ...r, metersToIssue: m, isPartial: m < roll.meters } : r
    ));
  };

  const handleHoldAction = (rollId: string, action: 'Hold' | 'Release') => {
    const existing = holdActions.find(a => a.rollId === rollId);
    // If user clicks the same action that is already selected, deselect it
    if (existing && existing.action === action) {
      setHoldActions(holdActions.filter(a => a.rollId !== rollId));
    } else {
      // Otherwise set/update the action for this roll
      const newAction: HoldAction = { rollId, action, reason: '' };
      if (existing) {
        setHoldActions(holdActions.map(a => a.rollId === rollId ? newAction : a));
      } else {
        setHoldActions([...holdActions, newAction]);
      }
    }
  };

  const handleFinalize = () => {
    let total = 0;
    if (mode === 'Receive') {
      total = newRolls.reduce((s, r) => s + r.meters, 0);
    } else if (mode === 'Issue') {
      total = selectedIssueRolls.reduce((s, r) => s + r.metersToIssue, 0);
    } else if (mode === 'Checking' && subType === 'Hold/Release') {
      total = quality.rolls.filter(r => holdActions.some(a => a.rollId === r.id)).reduce((s, r) => s + r.meters, 0);
    } else if (mode === 'Checking' && subType === 'Refolding') {
      total = selectedIssueRolls.reduce((s, r) => s + (r.newMeters || 0), 0);
    }

    onComplete({
      fabricId: quality.id,
      fabricName: quality.name,
      color: quality.color,
      newRolls: mode === 'Receive' ? newRolls : undefined,
      selectedRolls: (mode === 'Issue' || subType === 'Refolding') ? selectedIssueRolls : undefined,
      holdActions: subType === 'Hold/Release' ? holdActions : undefined,
      totalMeters: total
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">{quality.name}</h4>
          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{quality.color}</p>
        </div>
        <button onClick={onCancel} className="text-[10px] font-black text-rose-500 uppercase">Change Fabric</button>
      </div>

      {mode === 'Receive' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase">Lot Number</label>
              <input value={lotInput} onChange={e => setLotInput(e.target.value)} placeholder="Lot #" className="w-full bg-white border-none rounded-lg px-3 py-2 text-xs font-bold" />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase">Meters</label>
              <input type="number" value={metersInput} onChange={e => setMetersInput(e.target.value)} placeholder="0.00" className="w-full bg-white border-none rounded-lg px-3 py-2 text-xs font-bold" />
            </div>
            <button onClick={handleAddReceiveRoll} className="col-span-2 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">Add Roll</button>
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {newRolls.map((r, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-white border border-slate-50 rounded-xl shadow-sm">
                <span className="text-[10px] font-black text-slate-900 uppercase">Lot {r.lotNumber}</span>
                <span className="text-xs font-black text-indigo-600">{r.meters}m</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
          {quality.rolls.map((roll) => {
            const isSelected = selectedIssueRolls.some(r => r.rollId === roll.id);
            const activeHoldAction = holdActions.find(a => a.rollId === roll.id);

            return (
              <div key={roll.id} className={`p-4 rounded-2xl border transition-all ${
                (isSelected || activeHoldAction) ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 
                roll.isHold ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'
              }`}>
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-[11px] font-black text-slate-900 uppercase">Lot {roll.lotNumber}</p>
                      {roll.isHold && (
                        <span className="text-[7px] font-black bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded uppercase tracking-tighter">ON HOLD</span>
                      )}
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{roll.meters}m Available</p>
                  </div>

                  <div className="shrink-0">
                    {subType === 'Hold/Release' ? (
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => handleHoldAction(roll.id, 'Hold')} 
                          className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${activeHoldAction?.action === 'Hold' ? 'bg-rose-600 text-white shadow-lg' : roll.isHold ? 'bg-slate-100 text-slate-300 opacity-50 cursor-not-allowed' : 'bg-slate-100 text-slate-400'}`}
                        >
                          Hold
                        </button>
                        <button 
                          onClick={() => handleHoldAction(roll.id, 'Release')} 
                          className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${activeHoldAction?.action === 'Release' ? 'bg-emerald-600 text-white shadow-lg' : !roll.isHold ? 'bg-slate-100 text-slate-300 opacity-50 cursor-not-allowed' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}
                        >
                          Release
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end gap-1.5">
                        <button 
                          onClick={() => handleToggleIssueRoll(roll)} 
                          className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                          {isSelected ? 'Picked' : 'Pick'}
                        </button>
                        {isSelected && (
                           <div className="flex items-center gap-1 animate-in slide-in-from-right-2">
                             <span className="text-[7px] font-black uppercase text-slate-400">Qty:</span>
                             <input 
                              type="number" 
                              placeholder="Mtrs" 
                              className="w-14 bg-white border border-indigo-100 rounded px-1.5 py-1 text-[10px] font-black text-indigo-600 focus:ring-0"
                              onChange={(e) => handleAdjustIssueMeters(roll.id, Number(e.target.value))}
                            />
                           </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button 
        disabled={(mode === 'Receive' && newRolls.length === 0) || (mode === 'Issue' && selectedIssueRolls.length === 0) || (subType === 'Hold/Release' && holdActions.length === 0)}
        onClick={handleFinalize}
        className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl disabled:opacity-20 active:scale-95 transition-all"
      >
        Confirm Selection
      </button>
    </div>
  );
};

interface ChallanViewProps {
  challans: Challan[];
  fabrics: FabricItem[];
  nav: ChallanNav;
  setNav: (nav: ChallanNav) => void;
  onSave: (challan: Challan) => void;
}

const ChallanView: React.FC<ChallanViewProps> = ({ challans, fabrics, nav, setNav, onSave }) => {
  useEffect(() => {
    if (nav.view !== 'menu' && (!nav.mainType || !nav.subType)) {
      setNav({ view: 'menu' });
    }
  }, [nav, setNav]);

  if (nav.view === 'menu') {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="text-center py-4">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Inventory Movements</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Select Activity Head</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">📤</span>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Issue Challans</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['Mill', 'Sales', 'Sampling', 'Other'].map((sub) => (
                <button 
                  key={sub}
                  onClick={() => setNav({ view: 'list', mainType: 'Issue', subType: sub as ChallanSubType })}
                  className="bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-slate-600 border border-transparent hover:border-indigo-100 active:scale-95"
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">📥</span>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Receive Challans</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {['Grey', 'Mill Receipt', 'Purchase', 'Sampling Receipt', 'Other'].map((sub) => (
                <button 
                  key={sub}
                  onClick={() => setNav({ view: 'list', mainType: 'Receive', subType: sub as ChallanSubType })}
                  className="bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-slate-600 border border-transparent hover:border-indigo-100 active:scale-95"
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-[32px] p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 text-6xl opacity-10 group-hover:scale-125 transition-transform duration-700">🔍</div>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">🔍</span>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Quality Checking</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['Refolding', 'Hold/Release'].map((sub) => (
                <button 
                  key={sub}
                  onClick={() => setNav({ view: 'list', mainType: 'Checking', subType: sub as ChallanSubType })}
                  className="bg-white/10 hover:bg-white/20 text-white/80 hover:text-white p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 active:scale-95"
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (nav.view === 'list') {
    const filteredChallans = challans.filter(c => c.subType === nav.subType && c.mainType === nav.mainType);
    
    return (
      <div className="fixed inset-0 bg-slate-50 z-[40] overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
        <header className="bg-white border-b border-slate-100 px-6 py-5 flex items-center justify-between shrink-0 shadow-sm z-[60] sticky top-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setNav({ view: 'menu' })} className="text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 w-8 h-8 rounded-full flex items-center justify-center">
              <span className="text-xl">←</span>
            </button>
            <div className="min-w-0">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tighter truncate">{nav.subType} Records</h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{nav.mainType} Ledger</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pt-24 pb-40 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-4">
            {filteredChallans.map((challan) => (
              <button 
                key={challan.id}
                onClick={() => setNav({ ...nav, view: 'editor', editingId: challan.id })}
                className="w-full bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-xl hover:shadow-indigo-50/50 transition-all text-left group"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{challan.number}</p>
                    {challan.isTransferred && (
                      <span className="text-[8px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 font-black rounded uppercase">Transferred</span>
                    )}
                  </div>
                  <p className="text-sm font-black text-slate-900 uppercase truncate">{challan.partyName}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest line-clamp-1">
                    {challan.items.map(i => i.fabricName).join(', ')}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-lg font-black text-slate-900 leading-none">
                    {challan.items.reduce((sum, item) => sum + item.totalMeters, 0).toLocaleString()} <small className="text-[10px] font-bold opacity-30">MTRS</small>
                  </p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    {new Date(challan.date).toLocaleDateString()}
                  </p>
                </div>
              </button>
            ))}

            {filteredChallans.length === 0 && (
              <div className="py-24 text-center">
                <div className="w-16 h-16 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4 text-2xl opacity-30">📄</div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">No Entries Found</p>
              </div>
            )}
          </div>
        </main>

        <button 
          onClick={() => setNav({ ...nav, view: 'editor', editingId: undefined })}
          className="fixed bottom-28 right-6 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl shadow-indigo-300 flex items-center justify-center text-3xl font-light hover:scale-110 active:scale-90 transition-all z-[70] no-print"
        >
          +
        </button>
      </div>
    );
  }

  if (nav.view === 'editor') {
    const existing = !nav.editingId ? null : challans.find(c => c.id === nav.editingId);
    
    return (
      <ChallanEditor 
        challan={existing}
        mainType={nav.mainType!}
        subType={nav.subType!}
        fabrics={fabrics}
        allChallans={challans}
        onBack={() => setNav({ ...nav, view: 'list' })}
        onSave={onSave}
      />
    );
  }

  return null;
};

const ChallanEditor: React.FC<{
  challan: Challan | null;
  mainType: ChallanMainType;
  subType: ChallanSubType;
  fabrics: FabricItem[];
  allChallans: Challan[];
  onBack: () => void;
  onSave: (challan: Challan) => void;
}> = ({ challan, mainType, subType, fabrics, allChallans, onBack, onSave }) => {
  const nextNumber = useMemo(() => {
    if (challan) return challan.number;
    const prefix = `${subType.charAt(0).toUpperCase()}${mainType.charAt(0).toUpperCase()}`;
    const sameSubChallans = allChallans.filter(c => c.subType === subType && c.mainType === mainType);
    const numbers = sameSubChallans.map(c => {
      const match = c.number.match(/-(\d+)$/);
      return match ? parseInt(match[1]) : 0;
    });
    const highest = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `${prefix}-${highest + 1}`;
  }, [challan, subType, mainType, allChallans]);

  const [formData, setFormData] = useState<Partial<Challan>>(
    challan || {
      id: Date.now().toString(),
      number: nextNumber,
      date: new Date().toISOString().split('T')[0],
      partyName: '',
      mainType,
      subType,
      items: [],
      status: 'Draft'
    }
  );

  const [selectedQualityId, setSelectedQualityId] = useState('');
  const [showItemSelector, setShowItemSelector] = useState(false);
  const selectedQuality = fabrics.find(f => f.id === selectedQualityId);

  const handleAddItem = (item: any) => {
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), item]
    }));
    setShowItemSelector(false);
    setSelectedQualityId('');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] overflow-hidden flex flex-col animate-in slide-in-from-bottom-12 duration-300">
      <header className="bg-slate-50 border-b border-slate-100 px-3 py-3 sm:px-6 sm:py-5 flex items-center justify-between no-print shrink-0 shadow-sm z-[110]">
        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden min-w-0 flex-1 mr-2">
          <button onClick={onBack} className="text-slate-400 hover:text-slate-900 transition-colors bg-white w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0">
            <span className="text-lg">←</span>
          </button>
          <div className="min-w-0">
            <h2 className="text-[11px] sm:text-sm font-black text-slate-900 uppercase tracking-tighter truncate leading-tight">
              {challan ? 'Review' : 'Create'} {formData.number}
            </h2>
            <p className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest">{subType}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {challan && (
            <button onClick={handlePrint} className="bg-slate-900 text-white px-3 py-2 sm:px-4 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-95">
              🖨️ <span className="hidden sm:inline ml-1">Print</span>
            </button>
          )}
          {!challan?.isTransferred && (
            <button 
              disabled={formData.items?.length === 0 || !formData.partyName}
              onClick={() => onSave(formData as Challan)}
              className="bg-indigo-600 text-white px-4 py-2.5 sm:px-6 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 disabled:opacity-20 whitespace-nowrap"
            >
              {challan ? 'Update Challan' : 'Save & Confirm'}
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 no-print bg-white custom-scrollbar pb-40">
        <div className="max-w-2xl mx-auto space-y-10">
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Party / Department</label>
              <input 
                disabled={!!challan}
                value={formData.partyName}
                onChange={(e) => setFormData({...formData, partyName: e.target.value.toUpperCase()})}
                placeholder="e.g. MILL FLOOR / CUSTOMER NAME"
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-black text-slate-900 uppercase placeholder:text-slate-200 focus:ring-2 focus:ring-indigo-500/10"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Transaction Date</label>
              <input 
                disabled={!!challan}
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/10"
              />
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between border-l-4 border-indigo-600 pl-4 py-1">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Selected Quality List</h3>
              {!challan && (
                <button 
                  onClick={() => setShowItemSelector(true)}
                  className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                >
                  + Add Quality
                </button>
              )}
            </div>

            <div className="space-y-4">
              {formData.items?.map((item, idx) => (
                <div key={idx} className="bg-slate-50 rounded-3xl p-5 border border-slate-100 flex flex-col sm:flex-row gap-4 justify-between sm:items-center relative animate-in fade-in zoom-in-95">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Fabric Variant</p>
                    <p className="text-sm font-black text-slate-900 uppercase leading-none mb-1">{item.fabricName}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{item.color}</p>
                  </div>
                  <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
                    <p className="text-xl font-black text-indigo-600">{item.totalMeters.toLocaleString()} <small className="text-[10px]">MTRS</small></p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {mainType === 'Issue' ? `${item.selectedRolls?.length || 0} Rolls Picked` : 
                       mainType === 'Receive' ? `${item.newRolls?.length || 0} Rolls New` : 
                       `${item.holdActions?.length || item.selectedRolls?.length || 0} Units Modified`}
                    </p>
                  </div>
                </div>
              ))}
              
              {!formData.items?.length && (
                <div className="py-12 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No entries added to this challan.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {showItemSelector && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 no-print">
          <div className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] shadow-2xl flex flex-col h-[90vh] sm:h-auto sm:max-h-[95vh] overflow-hidden animate-in slide-in-from-bottom-24 duration-300">
            <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Quality Selection</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Select rolls for inventory update</p>
              </div>
              <button onClick={() => { setShowItemSelector(false); setSelectedQualityId(''); }} className="text-slate-300 text-3xl hover:text-slate-900 transition-colors px-2">&times;</button>
            </div>
            
            <div className="p-5 sm:p-8 overflow-y-auto custom-scrollbar flex-1 pb-20">
              {!selectedQualityId ? (
                <div className="grid grid-cols-1 gap-3">
                  {fabrics.map(f => {
                     const heldRolls = f.rolls?.filter(r => r.isHold) || [];
                     return (
                        <button 
                          key={f.id}
                          onClick={() => setSelectedQualityId(f.id)}
                          className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left group ${heldRolls.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-transparent hover:border-indigo-100'}`}
                        >
                          <div className="min-w-0 pr-4">
                            <p className="text-xs font-black text-slate-900 uppercase group-hover:text-indigo-600 truncate">{f.name}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">{f.color} • {f.category}</p>
                            {heldRolls.length > 0 && <span className="text-[7px] font-black text-amber-600 uppercase tracking-widest mt-1 block">⚠️ Contains Held Stock</span>}
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[10px] font-black text-slate-900">{f.quantityMeters.toLocaleString()}m</p>
                            <p className="text-[7px] font-bold text-slate-400 uppercase">Available</p>
                          </div>
                        </button>
                     );
                  })}
                </div>
              ) : selectedQuality ? (
                <QualityRollSelector 
                  quality={selectedQuality} 
                  mode={mainType} 
                  subType={subType}
                  onCancel={() => setSelectedQualityId('')}
                  onComplete={handleAddItem}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallanView;
