"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    Globe,
    Coins,
    Plus,
    Trash2,
    Save,
    AlertCircle,
    TrendingDown,
    TrendingUp,
    Settings2,
    Percent,
    History,
    Info,
    Loader2
} from 'lucide-react';
import { adminService } from '@/services/admin.service';

export default function RatesPage() {
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [newPairModal, setNewPairModal] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await adminService.getRatesConfig();
            setConfig(data);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveFeesLimits = useCallback(async () => {
        try {
            setSaving(true);
            await adminService.updateFeesLimits(config.feesLimits);
            alert("Fees and limits updated successfully.");
            await fetchData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    }, [config, fetchData]);

    const handleToggleRegion = async (code: string, enabled: boolean) => {
        try {
            await adminService.updateRegion(code, { enabled });
            await fetchData();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleToggleFreeze = async () => {
        const isFrozen = config.conversionControl.conversionsFrozen;
        const reason = isFrozen ? "" : prompt("Reason for freezing conversions?") || "Emergency maintenance";

        try {
            setSaving(true);
            await adminService.toggleConversionFreeze(!isFrozen, reason);
            await fetchData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const data = await adminService.getRatesHistory();
            setHistory(data.history);
            setHistoryOpen(true);
        } catch (err: any) {
            alert(err.message);
        }
    };

    if (loading || !config) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="animate-spin text-indigo-500" size={48} />
                <p className="text-slate-500 font-medium animate-pulse">Syncing platform rates...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Rates & Localization</h2>
                    <p className="text-slate-400 mt-1">Configure global exchange rates, supported regions, and transaction fees.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchHistory}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition-all"
                    >
                        <History size={18} />
                        View History
                    </button>
                    <button
                        onClick={handleSaveFeesLimits}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Global Conversion Rates */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm shadow-xl shadow-black/20">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-bold text-white flex items-center gap-3">
                                <Coins className="text-indigo-400" size={24} />
                                Currency Conversion Rates
                            </h3>
                            <div className={`flex items-center gap-2 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-all ${config.liveSync ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                <TrendingUp size={12} /> {config.liveSync ? 'Live Sync Active' : 'Live Sync Disabled'}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {config.fxRates.map((rate: any) => (
                                <RateControlRow
                                    key={rate._id}
                                    base={rate.baseCurrency}
                                    quote={rate.quoteCurrency}
                                    rate={rate.rate}
                                    source={rate.source}
                                    onUpdate={fetchData}
                                />
                            ))}
                            {config.fxRates.length === 0 && (
                                <div className="text-center py-10 bg-slate-950/30 rounded-2xl border border-dashed border-slate-800">
                                    <p className="text-slate-500 text-sm">No active rate pairings found.</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setNewPairModal(true)}
                            className="w-full mt-6 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={16} />
                            Add Custom Pairing
                        </button>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm shadow-xl shadow-black/10">
                        <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-3">
                            <Settings2 className="text-indigo-400" size={24} />
                            Platform Fees & Limits
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800/50 pb-2 flex items-center gap-2">
                                    <Percent size={14} /> Revenue & Operations
                                </h4>
                                <div className="space-y-4">
                                    <FeeInput
                                        label="Withdrawal Fee (%)"
                                        value={config.feesLimits.withdrawalFeePercent}
                                        onChange={(v: number) => setConfig({ ...config, feesLimits: { ...config.feesLimits, withdrawalFeePercent: v } })}
                                        icon={<Percent size={14} />}
                                    />
                                    <FeeInput
                                        label="Conversion Spread (%)"
                                        value={config.feesLimits.conversionSpreadPercent}
                                        onChange={(v: number) => setConfig({ ...config, feesLimits: { ...config.feesLimits, conversionSpreadPercent: v } })}
                                        icon={<Percent size={14} />}
                                    />
                                    <FeeInput
                                        label="Network Fee (USDT flat)"
                                        value={config.feesLimits.networkFeeUsdtFlat}
                                        onChange={(v: number) => setConfig({ ...config, feesLimits: { ...config.feesLimits, networkFeeUsdtFlat: v } })}
                                        icon={<Coins size={14} />}
                                    />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800/50 pb-2 flex items-center gap-2">
                                    <ShieldCheck size={14} /> Transaction Sanity
                                </h4>
                                <div className="space-y-4">
                                    <FeeInput
                                        label="Min. Withdrawal (KES)"
                                        value={config.feesLimits.minWithdrawByCurrency?.KES || 0}
                                        onChange={(v: number) => setConfig({ ...config, feesLimits: { ...config.feesLimits, minWithdrawByCurrency: { ...config.feesLimits.minWithdrawByCurrency, KES: v } } })}
                                        icon={<TrendingDown size={14} />}
                                    />
                                    <FeeInput
                                        label="Min. Deposit (KES)"
                                        value={config.feesLimits.minDepositByCurrency?.KES || 0}
                                        onChange={(v: number) => setConfig({ ...config, feesLimits: { ...config.feesLimits, minDepositByCurrency: { ...config.feesLimits.minDepositByCurrency, KES: v } } })}
                                        icon={<TrendingUp size={14} />}
                                    />
                                    <FeeInput
                                        label="Daily Limit (Verified KES)"
                                        value={config.feesLimits.dailyLimitVerifiedByCurrency?.KES || 0}
                                        onChange={(v: number) => setConfig({ ...config, feesLimits: { ...config.feesLimits, dailyLimitVerifiedByCurrency: { ...config.feesLimits.dailyLimitVerifiedByCurrency, KES: v } } })}
                                        icon={<ShieldCheck size={14} />}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Country Management */}
                <div className="space-y-6">
                    <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-3xl p-6 backdrop-blur-md shadow-xl">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                            <Globe className="text-indigo-400" size={20} />
                            Supported Regions
                        </h3>

                        <div className="space-y-3">
                            {config.regions.map((region: any) => (
                                <RegionToggle
                                    key={region._id}
                                    name={region.countryName}
                                    code={region.countryCode}
                                    currency={region.currencyCode}
                                    prefix={region.phonePrefix}
                                    active={region.enabled}
                                    onToggle={() => handleToggleRegion(region.countryCode, !region.enabled)}
                                />
                            ))}
                        </div>

                        <div className="mt-8 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-start gap-4">
                            <Info size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-indigo-300 font-medium leading-relaxed">
                                Disabling a region prevents NEW users from registering but allows existing users to continue transactions until their accounts are manually flagged.
                            </p>
                        </div>
                    </div>

                    <div className={`bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm transition-all duration-500 ${config.conversionControl.conversionsFrozen ? 'ring-2 ring-rose-500/50 bg-rose-500/5 border-rose-500/30' : ''}`}>
                        <div className={`flex items-center gap-3 mb-4 ${config.conversionControl.conversionsFrozen ? 'text-rose-400' : 'text-slate-400'}`}>
                            <AlertCircle size={20} className={config.conversionControl.conversionsFrozen ? 'animate-pulse' : ''} />
                            <h4 className="font-bold text-sm tracking-tight uppercase">Emergency Control</h4>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed mb-6 font-medium">
                            {config.conversionControl.conversionsFrozen
                                ? `CONVERSIONS HALTED: ${config.conversionControl.freezeReason}`
                                : "Globally freeze all KES/USDT conversions in case of extreme volatility or system exploit."}
                        </p>
                        <button
                            onClick={handleToggleFreeze}
                            disabled={saving}
                            className={`w-full py-3 text-white font-black text-xs rounded-xl shadow-lg transition-all uppercase tracking-widest flex items-center justify-center gap-2 ${config.conversionControl.conversionsFrozen ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'}`}
                        >
                            {saving ? <Loader2 className="animate-spin" size={14} /> : null}
                            {config.conversionControl.conversionsFrozen ? "RESTORE ALL CONVERSIONS" : "FREEZE ALL CONVERSIONS"}
                        </button>
                    </div>
                </div>
            </div>

            {/* History Modal (Simplified for injection) */}
            {historyOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                <History className="text-indigo-400" size={24} />
                                Rates Change History
                            </h3>
                            <button onClick={() => setHistoryOpen(false)} className="text-slate-500 hover:text-white transition-colors">✕</button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4">
                            {history.map((h, i) => (
                                <div key={i} className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 flex justify-between items-start">
                                    <div>
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{h.type}</p>
                                        <p className="text-xs text-slate-300 mt-1 font-medium">Changed by {h.changedBy?.username || 'Admin'}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">{new Date(h.timestamp).toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="px-2 py-1 bg-slate-800 rounded text-[9px] text-slate-400 font-mono">
                                            {h.ip}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {history.length === 0 && <p className="text-center py-10 text-slate-500">No history records found.</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* New Pair Modal Integration */}
            {newPairModal && (
                <NewRateModal
                    onClose={() => setNewPairModal(false)}
                    onSuccess={() => { setNewPairModal(false); fetchData(); }}
                />
            )}
        </div>
    );
}

function RateControlRow({ base, quote, rate, source, onUpdate }: any) {
    const [val, setVal] = useState(rate);
    const [saving, setSaving] = useState(false);

    const handleUpdate = async () => {
        try {
            setSaving(true);
            await adminService.updateRatePair({ baseCurrency: base, quoteCurrency: quote, rate: val });
            onUpdate();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-950/50 border border-slate-800/80 rounded-2xl hover:border-slate-700 transition-all group">
            <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{base} Pairing</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${source === 'manual' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                        {source}
                    </span>
                </div>
                <span className="text-sm font-bold text-slate-200 uppercase">{quote} (Local Currency)</span>
            </div>
            <div className="flex items-center gap-6">
                <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 group-hover:text-indigo-400 transition-colors">Direct Rate</p>
                    <div className="flex items-center gap-3">
                        <div className="text-xs font-bold text-slate-400">1 {base} =</div>
                        <input
                            type="number"
                            step="0.01"
                            value={val}
                            onChange={(e) => setVal(parseFloat(e.target.value))}
                            className="w-28 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm font-bold text-white text-center focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
                        />
                    </div>
                </div>
                <button
                    onClick={handleUpdate}
                    disabled={saving || val === rate}
                    className="p-3 text-indigo-400 hover:text-white hover:bg-indigo-600 rounded-xl transition-all disabled:opacity-30"
                >
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                </button>
            </div>
        </div>
    );
}

function NewRateModal({ onClose, onSuccess }: any) {
    const [base, setBase] = useState('USDT');
    const [quote, setQuote] = useState('KES');
    const [rate, setRate] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        if (!rate || parseFloat(rate) <= 0) return alert("Please enter a valid rate");
        try {
            setSaving(true);
            await adminService.updateRatePair({ baseCurrency: base, quoteCurrency: quote, rate: parseFloat(rate) });
            onSuccess();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-8 shadow-2xl space-y-6">
                <div className="text-center">
                    <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Plus size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white">Add Custom Pairing</h3>
                    <p className="text-xs text-slate-500 mt-2">Initialize a new manual exchange pair.</p>
                </div>

                <div className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-600 uppercase pl-1">Base</label>
                            <input value={base} onChange={e => setBase(e.target.value.toUpperCase())} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-indigo-500 outline-none" placeholder="USDT" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-600 uppercase pl-1">Quote</label>
                            <input value={quote} onChange={e => setQuote(e.target.value.toUpperCase())} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-indigo-500 outline-none" placeholder="KES" />
                        </div>
                    </div>
                    <div className="space-y-2 pt-2">
                        <label className="text-[10px] font-black text-slate-600 uppercase pl-1">Rate (1 {base} = ? {quote})</label>
                        <input value={rate} onChange={e => setRate(e.target.value)} type="number" step="0.01" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-lg font-black text-white focus:border-indigo-500 outline-none placeholder:text-slate-800" placeholder="0.00" />
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <button onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold text-xs uppercase hover:text-white transition-colors">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-3 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                        CREATE PAIR
                    </button>
                </div>
            </div>
        </div>
    );
}

function FeeInput({ label, value, icon, onChange }: any) {
    return (
        <div className="space-y-2 group">
            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block transition-colors group-focus-within:text-indigo-400">{label}</label>
            <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors">
                    {icon}
                </div>
                <input
                    type="number"
                    step="0.01"
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className="w-full pl-11 pr-4 py-3 bg-slate-950/20 border border-slate-800 rounded-2xl text-sm font-black text-slate-200 focus:outline-none focus:border-indigo-500/50 shadow-inner group-hover:bg-slate-950/40 transition-all font-mono"
                />
            </div>
        </div>
    );
}

function RegionToggle({ name, code, currency, prefix, active, onToggle }: any) {
    return (
        <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${active ? 'bg-indigo-500/5 border-indigo-500/30' : 'bg-slate-950/20 border-slate-800 opacity-50 grayscale'}`}>
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black transition-all ${active ? 'bg-indigo-500 text-white rotate-6' : 'bg-slate-800 text-slate-600'}`}>
                    {code.substring(0, 2)}
                </div>
                <div>
                    <p className={`text-xs font-bold ${active ? 'text-white' : 'text-slate-500'}`}>{name}</p>
                    <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mt-0.5">{prefix} • {currency}</p>
                </div>
            </div>
            <button
                onClick={onToggle}
                className={`w-12 h-6 rounded-full relative transition-all duration-500 shadow-inner ${active ? 'bg-indigo-500' : 'bg-slate-700'}`}
            >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-500 shadow-lg ${active ? 'left-7' : 'left-1'}`} />
            </button>
        </div>
    );
}

function ShieldCheck({ size, className }: any) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}
