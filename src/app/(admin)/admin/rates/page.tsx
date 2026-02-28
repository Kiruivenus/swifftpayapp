import React from 'react';
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
    Info
} from 'lucide-react';

export default function RatesPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Rates & Localization</h2>
                    <p className="text-slate-400 mt-1">Configure global exchange rates, supported regions, and transaction fees.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition-all">
                        <History size={18} />
                        Rate History
                    </button>
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20">
                        <Save size={18} />
                        Publish Changes
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Global Conversion Rates */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-bold text-white flex items-center gap-3">
                                <Coins className="text-indigo-400" size={24} />
                                Currency Conversion Rates
                            </h3>
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20">
                                <TrendingUp size={12} /> Live Sync Active
                            </div>
                        </div>

                        <div className="space-y-4">
                            <RateControlRow
                                from="USDT"
                                to="KES (Kenyan Shilling)"
                                rate="134.50"
                                trend="up"
                                percent="+0.12%"
                            />
                            <RateControlRow
                                from="USDT"
                                to="UGX (Ugandan Shilling)"
                                rate="3,842.00"
                                trend="down"
                                percent="-0.05%"
                            />
                            <RateControlRow
                                from="USDT"
                                to="TZS (Tanzanian Shilling)"
                                rate="2,560.00"
                                trend="stable"
                                percent="0.00%"
                            />
                        </div>

                        <button className="w-full mt-6 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                            <Plus size={16} />
                            Add Custom Pairing
                        </button>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-3">
                            <Settings2 className="text-indigo-400" size={24} />
                            Platform Fees & Limits
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Global Fees</h4>
                                <div className="space-y-4">
                                    <FeeInput label="Withdrawal Fee (%)" value="1.5" icon={<Percent size={14} />} />
                                    <FeeInput label="Conversion Spread (%)" value="0.8" icon={<Percent size={14} />} />
                                    <FeeInput label="Network Fee (USDT flat)" value="1.0" icon={<Coins size={14} />} />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">User Limits</h4>
                                <div className="space-y-4">
                                    <FeeInput label="Min. Deposit (KES)" value="1,000" icon={<TrendingUp size={14} />} />
                                    <FeeInput label="Min. Withdrawal (KES)" value="500" icon={<TrendingDown size={14} />} />
                                    <FeeInput label="Daily Limit (Verified)" value="250,000" icon={<ShieldCheck size={14} />} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Country Management */}
                <div className="space-y-6">
                    <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-3xl p-6 backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                            <Globe className="text-indigo-400" size={20} />
                            Supported Regions
                        </h3>

                        <div className="space-y-3">
                            <CountryToggle name="Kenya" code="KE" flag="🇰🇪" active={true} />
                            <CountryToggle name="Uganda" code="UG" flag="🇺🇬" active={true} />
                            <CountryToggle name="Tanzania" code="TZ" flag="🇹🇿" active={true} />
                            <CountryToggle name="Rwanda" code="RW" flag="🇷🇼" active={false} />
                            <CountryToggle name="Nigeria" code="NG" flag="🇳🇬" active={false} />
                        </div>

                        <div className="mt-8 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-start gap-3">
                            <Info size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-indigo-300 font-medium leading-relaxed">
                                Enabling a new region automatically activates its local currency for deposits but requires manual rate configuration.
                            </p>
                        </div>

                        <button className="w-full mt-6 py-3 bg-white text-slate-950 font-black text-xs rounded-xl hover:bg-slate-200 transition-all uppercase tracking-widest">
                            Add New Region
                        </button>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-3 text-rose-400 mb-4">
                            <AlertCircle size={20} />
                            <h4 className="font-bold text-sm">Emergency Rate Lock</h4>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed mb-6">
                            In case of extreme market volatility, use this to freeze all conversions platform-wide. This will prevent users from exchanging USDT/KES.
                        </p>
                        <button className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-500/20 transition-all uppercase tracking-widest">
                            FROZEN ALL CONVERSIONS
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RateControlRow({ from, to, rate, trend, percent }: any) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-950/50 border border-slate-800/80 rounded-2xl hover:border-slate-700 transition-all group">
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">{from} Pairing</span>
                <span className="text-sm font-bold text-slate-200">{to}</span>
            </div>
            <div className="flex items-center gap-8">
                <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1 group-hover:text-indigo-400 transition-colors">Current Rate</p>
                    <div className="flex items-center gap-3">
                        <div className="text-xs font-bold text-slate-400">1 {from} =</div>
                        <input
                            type="text"
                            defaultValue={rate}
                            className="w-24 bg-slate-800/50 border border-slate-700 rounded-lg px-2 py-1 text-sm font-bold text-white text-center focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                </div>
                <div className="flex flex-col items-end min-w-[60px]">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Status</span>
                    <div className={`flex items-center gap-1 text-[10px] font-black ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-slate-400'}`}>
                        {trend === 'up' && <TrendingUp size={10} />}
                        {trend === 'down' && <TrendingDown size={10} />}
                        {percent}
                    </div>
                </div>
                <button className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all">
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}

function FeeInput({ label, value, icon }: any) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">{label}</label>
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">
                    {icon}
                </div>
                <input
                    type="text"
                    defaultValue={value}
                    className="w-full pl-9 pr-4 py-2 bg-slate-950/10 border border-slate-800 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-indigo-500/50 shadow-inner"
                />
            </div>
        </div>
    );
}

function CountryToggle({ name, code, flag, active }: any) {
    return (
        <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${active ? 'bg-slate-950/20 border-indigo-500/30' : 'bg-slate-900/10 border-slate-800 opacity-60'}`}>
            <div className="flex items-center gap-3">
                <span className="text-xl grayscale-[0.5] group-hover:grayscale-0">{flag}</span>
                <div>
                    <p className="text-xs font-bold text-white">{name}</p>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{code}</p>
                </div>
            </div>
            <button className={`w-8 h-4 rounded-full relative transition-all ${active ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${active ? 'left-4.5' : 'left-0.5'}`} />
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
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}
