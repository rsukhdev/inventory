
import React, { useState, useEffect } from 'react';
import { supabase, saveSupabaseConfig, disconnectSupabase, DB_TABLES } from '../services/supabase';

const Settings: React.FC = () => {
  const [url, setUrl] = useState(localStorage.getItem('texflow_supabase_url') || '');
  const [key, setKey] = useState(localStorage.getItem('texflow_supabase_key') || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const isConnected = !!supabase;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !key) {
      alert('Please enter both URL and Anon Key');
      return;
    }
    saveSupabaseConfig(url, key);
  };

  const testConnection = async () => {
    if (!supabase) return;
    setTesting(true);
    setTestResult(null);
    try {
      // Test if we can access the fabrics table
      const { error } = await supabase.from(DB_TABLES.FABRICS).select('id').limit(1);
      
      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('not found')) {
          setTestResult({ 
            success: false, 
            message: 'Keys are valid, but Tables are missing! Please run the SQL script in Supabase Editor.' 
          });
        } else {
          setTestResult({ success: false, message: `Connection Error: ${error.message}` });
        }
      } else {
        setTestResult({ success: true, message: 'Database Connected & Tables Verified Successfully!' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: 'Network Error: Check your Project URL.' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center py-4">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">System Settings</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cloud Persistence & Sync</p>
      </div>

      {isConnected ? (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg shadow-emerald-200">
                ☁️
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Active Cloud Link</h3>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Live Sync Enabled</p>
              </div>
            </div>
            <button 
              onClick={disconnectSupabase}
              className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline"
            >
              Disconnect
            </button>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Project Endpoint</p>
                <p className="text-xs font-bold text-slate-600 truncate">{url}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Security Token</p>
                <p className="text-xs font-bold text-slate-600">••••••••••••••••••••••••••••••</p>
              </div>
            </div>

            <button 
              onClick={testConnection}
              disabled={testing}
              className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 ${
                testing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white shadow-xl'
              }`}
            >
              {testing ? 'Probing Database...' : 'Test Connection Status'}
            </button>

            {testResult && (
              <div className={`p-4 rounded-2xl border flex items-start gap-3 animate-in zoom-in-95 duration-200 ${
                testResult.success ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
              }`}>
                <span className="text-lg">{testResult.success ? '✅' : '❌'}</span>
                <p className="text-[10px] font-bold uppercase leading-relaxed tracking-wide">
                  {testResult.message}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 bg-slate-50/50">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Setup Cloud Sync</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sync data across all office devices</p>
          </div>

          <form onSubmit={handleSave} className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Project URL</label>
                <input 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xyz.supabase.co"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-slate-900 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Anon Key (Publishable API Key)</label>
                <input 
                  type="password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="Paste your Public Anon Key here"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-slate-900 text-xs"
                />
              </div>
            </div>

            <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 flex items-start gap-3">
              <span className="text-indigo-600">💡</span>
              <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide leading-relaxed">
                Find these in your **Supabase Dashboard** under <br/>
                <span className="font-black underline">Settings > API</span>. <br/>
                The "Anon" key is your **Publishable key**.
              </p>
            </div>

            <button 
              type="submit" 
              className="w-full py-4 bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl active:scale-95 transition-all"
            >
              Connect Database
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Technical Requirements</h3>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">
          Once keys are saved, TexFlow will look for the following tables: 
          <code className="bg-slate-50 text-indigo-600 px-1 mx-0.5 rounded">fabrics</code>, 
          <code className="bg-slate-50 text-indigo-600 px-1 mx-0.5 rounded">challans</code>, 
          and <code className="bg-slate-50 text-indigo-600 px-1 mx-0.5 rounded">groups</code>. 
          If they don't exist, data will not sync.
        </p>
      </div>
    </div>
  );
};

export default Settings;
