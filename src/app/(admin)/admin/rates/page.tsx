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
    const [showAddRegionModal, setShowAddRegionModal] = useState(false);

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

    const handleDeletePair = async (base: string, quote: string) => {
        if (!confirm(`Are you sure you want to delete the ${base}/${quote} pair?`)) return;
        try {
            setSaving(true);
            await adminService.deleteRatePair(base, quote);
            await fetchData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading || !config) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 font-sans">
                <Loader2 className="animate-spin text-primary-orange" size={40} />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Syncing platform rates...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20 font-sans">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Rates & Localization</h2>
                    <p className="text-slate-400 mt-1">Configure global exchange rates, supported regions, and transaction fees.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchHistory}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#0D1017] hover:bg-white/[0.03] text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-[#1E2533] transition-all shadow-sm"
                    >
                        <History size={16} />
                        View History
                    </button>
                    <button
                        onClick={handleSaveFeesLimits}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary-orange hover:bg-primary-orange-hover text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-primary-orange/20 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Global Conversion Rates */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl p-8 backdrop-blur-md shadow-2xl">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-3">
                                <Coins className="text-primary-orange" size={22} />
                                Currency Conversion Rates
                            </h3>
                            <div className={`flex items-center gap-2 px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-all ${config.liveSync ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]' : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.1)]'}`}>
                                <div className={`w-1 h-1 rounded-full ${config.liveSync ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                                <span>{config.liveSync ? 'Live Sync Active' : 'Live Sync Disabled'}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {config.fxRates.map((rate: any) => (
                                <RateControlRow
                                    key={rate._id}
                                    base={rate.baseCurrency}
                                    quote={rate.quoteCurrency}
                                    rate={rate.rate}
                                    source={rate.source}
                                    onUpdate={fetchData}
                                    onDelete={() => handleDeletePair(rate.baseCurrency, rate.quoteCurrency)}
                                />
                            ))}
                            {config.fxRates.length === 0 && (
                                <div className="text-center py-10 bg-[#07090E]/40 rounded-2xl border border-dashed border-[#1E2533]">
                                    <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">No active rate pairings found.</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setNewPairModal(true)}
                            className="w-full mt-6 py-4 bg-[#07090E] hover:bg-white/[0.02] border border-[#1E2533] hover:border-primary-orange/20 rounded-2xl text-slate-400 hover:text-white text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={16} />
                            Add Custom Pairing
                        </button>
                    </div>

                    <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl p-8 backdrop-blur-md shadow-2xl">
                        <h3 className="text-base font-bold text-white mb-8 flex items-center gap-3 uppercase tracking-wider">
                            <Settings2 className="text-primary-orange" size={22} />
                            Platform Fees & Limits
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-[#1E2533] pb-2.5 flex items-center gap-2">
                                    <Percent size={14} className="text-slate-600" /> Revenue & Operations
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
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-[#1E2533] pb-2.5 flex items-center gap-2">
                                    <ShieldCheck size={14} className="text-slate-600" /> Transaction Sanity
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
                    <div className="bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl p-6 backdrop-blur-md shadow-2xl">
                        <h3 className="text-base font-bold text-white mb-6 flex items-center gap-3 uppercase tracking-wider">
                            <Globe className="text-primary-orange" size={20} />
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

                        <button
                            onClick={() => setShowAddRegionModal(true)}
                            className="w-full mt-6 py-4 bg-primary-orange-light hover:bg-primary-orange-light/20 border border-primary-orange-border rounded-2xl text-primary-orange hover:text-primary-orange-hover text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={16} />
                            Add Supported Region
                        </button>

                        <div className="mt-8 p-4 bg-primary-orange-light/10 border border-primary-orange-border rounded-2xl flex items-start gap-4">
                            <Info size={16} className="text-primary-orange shrink-0 mt-0.5" />
                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                                Disabling a region prevents NEW users from registering but allows existing users to continue transactions until their accounts are manually flagged.
                            </p>
                        </div>
                    </div>

                    <div className={`bg-[#0D1017]/80 border border-[#1E2533] rounded-3xl p-6 backdrop-blur-md shadow-2xl transition-all duration-500 ${config.conversionControl.conversionsFrozen ? 'ring-2 ring-rose-500/50 bg-rose-500/5 border-rose-500/30' : ''}`}>
                        <div className={`flex items-center gap-3 mb-4 ${config.conversionControl.conversionsFrozen ? 'text-rose-400 font-bold' : 'text-slate-400 font-bold'}`}>
                            <AlertCircle size={20} className={config.conversionControl.conversionsFrozen ? 'animate-pulse text-rose-400' : 'text-slate-600'} />
                            <h4 className="text-xs tracking-wider uppercase">Emergency Control</h4>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed mb-6 font-medium">
                            {config.conversionControl.conversionsFrozen
                                ? `CONVERSIONS HALTED: ${config.conversionControl.freezeReason}`
                                : "Globally freeze all KES/USDT conversions in case of extreme volatility or system exploit."}
                        </p>
                        <button
                            onClick={handleToggleFreeze}
                            disabled={saving}
                            className={`w-full py-3.5 text-white font-black text-xs rounded-xl shadow-lg transition-all uppercase tracking-widest flex items-center justify-center gap-2 ${config.conversionControl.conversionsFrozen ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20 border border-rose-500/20'}`}
                        >
                            {saving ? <Loader2 className="animate-spin" size={14} /> : null}
                            {config.conversionControl.conversionsFrozen ? "RESTORE ALL CONVERSIONS" : "FREEZE ALL CONVERSIONS"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Change History Modal */}
            {historyOpen && (
                <RateHistoryModal
                    history={history}
                    onClose={() => setHistoryOpen(false)}
                />
            )}

            {/* New Rate Pair Modal */}
            {newPairModal && (
                <NewRateModal
                    onClose={() => setNewPairModal(false)}
                    onSuccess={() => { setNewPairModal(false); fetchData(); }}
                />
            )}

            {/* Add Region Modal */}
            {showAddRegionModal && (
                <AddRegionModal
                    onClose={() => setShowAddRegionModal(false)}
                    onSuccess={() => { setShowAddRegionModal(false); fetchData(); }}
                />
            )}
        </div>
    );
}

function RateControlRow({ base, quote, rate, source, onUpdate, onDelete }: any) {
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#07090E]/40 border border-[#1E2533] rounded-2xl hover:border-primary-orange/20 transition-all duration-300 group">
            <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{base} Pairing</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${source === 'manual' ? 'bg-primary-orange-light text-primary-orange border border-primary-orange-border' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                        {source}
                    </span>
                </div>
                <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">{quote} (Local Currency)</span>
            </div>
            <div className="flex items-center gap-6">
                <div className="text-right">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2 group-hover:text-primary-orange transition-colors">Direct Rate</p>
                    <div className="flex items-center gap-3 font-mono">
                        <div className="text-xs font-bold text-slate-500 font-sans">1 {base} =</div>
                        <input
                            type="number"
                            step="0.01"
                            value={val}
                            onChange={(e) => setVal(parseFloat(e.target.value))}
                            className="w-28 bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-2 text-sm font-bold text-white text-center focus:outline-none focus:border-primary-orange transition-all shadow-inner"
                        />
                    </div>
                </div>
                <button
                    onClick={handleUpdate}
                    disabled={saving || val === rate}
                    className="p-3 text-primary-orange hover:text-white hover:bg-primary-orange-light border border-transparent hover:border-primary-orange-border rounded-xl transition-all disabled:opacity-30"
                >
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                </button>
                <button
                    onClick={onDelete}
                    className="p-3 text-rose-400 hover:text-white hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-xl transition-all"
                    title="Delete Pair"
                >
                    <Trash2 size={18} />
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-6 animate-in fade-in duration-300 font-sans">
            <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl w-full max-w-sm p-8 shadow-2xl space-y-6">
                <div className="text-center">
                    <div className="w-16 h-16 bg-primary-orange-light border border-primary-orange-border/30 text-primary-orange rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Plus size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">Add Custom Pairing</h3>
                    <p className="text-xs text-slate-500 mt-2">Initialize a new manual exchange pair.</p>
                </div>
 
                <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Base</label>
                            <input value={base} onChange={e => setBase(e.target.value.toUpperCase())} className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:border-primary-orange outline-none uppercase font-mono" placeholder="USDT" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Quote</label>
                            <input value={quote} onChange={e => setQuote(e.target.value.toUpperCase())} className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:border-primary-orange outline-none uppercase font-mono" placeholder="KES" />
                        </div>
                    </div>
                    <div className="space-y-2 pt-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Rate (1 {base} = ? {quote})</label>
                        <input value={rate} onChange={e => setRate(e.target.value)} type="number" step="0.01" className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-3 text-base font-black text-white focus:border-primary-orange outline-none placeholder:text-slate-800 font-mono" placeholder="0.00" />
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <button onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold text-xs uppercase hover:text-white transition-colors">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-3 px-8 py-3 bg-primary-orange hover:bg-primary-orange-hover text-white font-black text-xs rounded-xl shadow-lg shadow-primary-orange/20 flex items-center justify-center gap-2 uppercase tracking-widest"
                    >
                        {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                        Create Pair
                    </button>
                </div>
            </div>
        </div>
    );
}

function AddRegionModal({ onClose, onSuccess }: any) {
    const [countryName, setCountryName] = useState('');
    const [countryCode, setCountryCode] = useState('');
    const [currencyCode, setCurrencyCode] = useState('');
    const [phonePrefix, setPhonePrefix] = useState('');
    const [saving, setSaving] = useState(false);
 
    const handleSubmit = async () => {
        if (!countryName || !countryCode || !currencyCode || !phonePrefix) {
            return alert("Please fill all fields");
        }
        try {
            setSaving(true);
            await adminService.addRegion({
                countryName,
                countryCode: countryCode.toUpperCase(),
                currencyCode: currencyCode.toUpperCase(),
                phonePrefix
            });
            onSuccess();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };
 
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-6 animate-in fade-in duration-300 font-sans">
            <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl w-full max-w-md p-8 shadow-2xl space-y-6">
                <div className="text-center">
                    <div className="w-16 h-16 bg-primary-orange-light border border-primary-orange-border/30 text-primary-orange rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Globe size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">Add Supported Region</h3>
                    <p className="text-xs text-slate-500 mt-2">Registers a new country and its currency mapping.</p>
                </div>
 
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2 col-span-2">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest pl-1">Country Name</label>
                        <input value={countryName} onChange={e => setCountryName(e.target.value)} className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:border-primary-orange outline-none" placeholder="e.g. Uganda" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest pl-1">Country Code (ISO)</label>
                        <input value={countryCode} onChange={e => setCountryCode(e.target.value.toUpperCase())} className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:border-primary-orange outline-none font-mono" placeholder="UG" maxLength={2} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest pl-1">Currency Code</label>
                        <input value={currencyCode} onChange={e => setCurrencyCode(e.target.value.toUpperCase())} className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:border-primary-orange outline-none font-mono" placeholder="UGX" maxLength={4} />
                    </div>
                    <div className="space-y-2 col-span-2">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest pl-1">Phone Prefix</label>
                        <input value={phonePrefix} onChange={e => setPhonePrefix(e.target.value)} className="w-full bg-[#07090E] border border-[#1E2533] rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:border-primary-orange outline-none font-mono" placeholder="+256" />
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <button onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold text-xs uppercase hover:text-white transition-colors">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-3 px-8 py-3 bg-primary-orange hover:bg-primary-orange-hover text-white font-black text-xs rounded-xl shadow-lg shadow-primary-orange/20 flex items-center justify-center gap-2 uppercase tracking-widest"
                    >
                        {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                        Add Region
                    </button>
                </div>
            </div>
        </div>
    );
}

function FeeInput({ label, value, icon, onChange }: any) {
    return (
        <div className="space-y-2 group">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block transition-colors group-focus-within:text-primary-orange pl-0.5">{label}</label>
            <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary-orange transition-colors">
                    {icon}
                </div>
                <input
                    type="number"
                    step="0.01"
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className="w-full pl-11 pr-4 py-3 bg-[#07090E] border border-[#1E2533] rounded-2xl text-sm font-black text-slate-200 focus:outline-none focus:border-primary-orange shadow-inner group-hover:bg-[#07090E]/80 transition-all font-mono"
                />
            </div>
        </div>
    );
}

function RegionToggle({ name, code, currency, prefix, active, onToggle }: any) {
    return (
        <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${active ? 'bg-primary-orange-light/5 border-primary-orange-border/30 shadow-inner' : 'bg-[#07090E]/20 border-[#1E2533] opacity-50 grayscale'}`}>
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all ${active ? 'bg-primary-orange text-white rotate-6 shadow-md shadow-primary-orange/10' : 'bg-[#07090E] text-slate-600 border border-[#1E2533]'}`}>
                    {code.substring(0, 2)}
                </div>
                <div>
                    <p className={`text-xs font-bold ${active ? 'text-white' : 'text-slate-500'}`}>{name}</p>
                    <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mt-1 font-mono">{prefix} • {currency}</p>
                </div>
            </div>
            <button
                onClick={onToggle}
                className={`w-12 h-6 rounded-full relative transition-all duration-500 shadow-inner ${active ? 'bg-primary-orange' : 'bg-slate-700'}`}
            >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-500 shadow-lg ${active ? 'left-7' : 'left-1'}`} />
            </button>
        </div>
    );
}

function RateHistoryModal({ history, onClose }: any) {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300 font-sans">
            <div className="bg-[#0D1017] border border-[#1E2533] rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
                <div className="p-6 border-b border-[#1E2533] flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-3 uppercase tracking-wider">
                        <History className="text-primary-orange" size={22} />
                        Rates Change History
                    </h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-xl font-bold">✕</button>
                </div>
                <div className="p-6 overflow-y-auto space-y-3 custom-scrollbar">
                    {history.map((h: any, i: number) => (
                        <div key={i} className="p-4 bg-[#07090E]/40 rounded-2xl border border-[#1E2533] flex justify-between items-start font-mono text-xs">
                            <div>
                                <p className="text-[9px] font-black text-primary-orange uppercase tracking-widest">{h.type}</p>
                                <p className="text-xs text-slate-300 mt-1.5 font-sans font-bold">Changed by {h.changedBy?.username || 'Admin'}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5 font-sans font-medium">{new Date(h.timestamp).toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <div className="px-2 py-1 bg-[#07090E] rounded-lg border border-[#1E2533] text-[10px] text-slate-400 font-mono">
                                    {h.ip}
                                </div>
                            </div>
                        </div>
                    ))}
                    {history.length === 0 && <p className="text-center py-10 text-slate-500 font-bold uppercase tracking-wider text-xs">No history records found.</p>}
                </div>
            </div>
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
