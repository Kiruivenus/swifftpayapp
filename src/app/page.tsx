import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  Globe,
  Zap,
  CheckCircle2,
  Play,
  Apple
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#07090E] text-[#F3F4F6] overflow-hidden font-sans selection:bg-orange-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#07090E]/80 backdrop-blur-xl border-b border-[#1E2533]/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <img src="/logo.png" alt="SwiftPay Logo" className="w-10 h-10 object-contain rounded-xl shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform" />
            <span className="text-xl font-bold tracking-tight text-white">SwiftPay</span>
          </div>

          <div className="hidden md:flex items-center gap-10 text-sm font-bold text-slate-400">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#security" className="hover:text-white transition-colors">Security</Link>
            <Link href="#download" className="hover:text-white transition-colors">Download</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-6 py-2.5 text-sm font-bold text-slate-300 hover:text-white transition-all bg-[#0D1017]/50 hover:bg-[#0D1017] border border-[#1E2533] rounded-xl"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-6 py-2.5 text-sm font-black text-white bg-orange-600 hover:bg-orange-500 rounded-xl shadow-lg shadow-orange-600/20 transition-all hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-6">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[600px] bg-orange-600/10 blur-[120px] rounded-full -z-10" />
        <div className="absolute top-40 right-0 w-96 h-96 bg-orange-600/5 blur-[100px] rounded-full -z-10" />

        <div className="max-w-7xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-orange-400 animate-fade-in">
            <Zap size={14} /> New: Regional USDT Transfers now live
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-4xl mx-auto leading-[1.1] text-white">
            The Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-rose-500">Fintech in Africa</span> is here.
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Securely send, receive, and convert KES to USDT. Modern banking designed for the next generation of African entrepreneurs.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
            <button className="w-full sm:w-auto px-8 py-4 bg-white text-slate-950 font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-200 transition-all shadow-xl shadow-white/5">
              Download the App <ArrowRight size={20} />
            </button>
            <div className="flex items-center gap-8">
              <div className="flex flex-col items-center gap-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Users</p>
                <p className="text-xl font-bold text-white">50k+</p>
              </div>
              <div className="w-px h-8 bg-[#1E2533]" />
              <div className="flex flex-col items-center gap-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Volume</p>
                <p className="text-xl font-bold text-white">$10M+</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-32 px-6 border-t border-[#1E2533]/50 bg-[#07090E]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Globe size={40} />}
              title="Global Access"
              desc="Bridge the gap between local currency and global digital assets within seconds."
            />
            <FeatureCard
              icon={<ShieldCheck size={40} />}
              title="Industrial Security"
              desc="Bank-grade encryption and multi-factor authentication protect your hard-earned assets."
            />
            <FeatureCard
              icon={<Zap size={40} />}
              title="Instant Transfers"
              desc="Zero waiting time. M-Pesa integrated deposits and real-time bank settlements."
            />
          </div>
        </div>
      </section>

      {/* App Showcase */}
      <section className="py-32 px-6 bg-[#0D1017]/30">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8 order-2 lg:order-1">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Your money, <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-500">your control.</span></h2>
            <div className="space-y-6">
              <AppFeature label="Real-time KES to USDT conversion" />
              <AppFeature label="M-Pesa Buy Goods Integration" />
              <AppFeature label="Multi-currency support for East Africa" />
              <AppFeature label="Secure biometric wallet access" />
            </div>
            <div className="flex flex-wrap gap-4 pt-4">
              <button className="flex items-center gap-3 px-6 py-3 bg-[#07090E] border border-[#1E2533] rounded-2xl hover:border-slate-700 transition-all">
                <Play size={24} className="text-orange-500" fill="currentColor" />
                <div className="text-left">
                  <p className="text-[10px] uppercase font-black leading-none mb-1 text-slate-500">Get it on</p>
                  <p className="text-sm font-bold text-white leading-none">Google Play</p>
                </div>
              </button>
              <button className="flex items-center gap-3 px-6 py-3 bg-[#07090E] border border-[#1E2533] rounded-2xl hover:border-slate-700 transition-all">
                <Apple size={24} className="text-white" fill="currentColor" />
                <div className="text-left">
                  <p className="text-[10px] uppercase font-black leading-none mb-1 text-slate-500">Download on the</p>
                  <p className="text-sm font-bold text-white leading-none">App Store</p>
                </div>
              </button>
            </div>
          </div>

          {/* Phone Mockup */}
          <div className="relative order-1 lg:order-2 flex justify-center">
            <div className="w-[300px] h-[600px] bg-[#07090E] rounded-[4rem] border-[8px] border-[#1E2533] overflow-hidden shadow-2xl relative">
              {/* Internal Mockup Content */}
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between mt-4">
                  <div className="w-10 h-10 rounded-full bg-slate-800" />
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-slate-800 rounded-full" />
                  <div className="h-8 w-40 bg-slate-800 rounded-full" />
                </div>
                <div className="h-48 w-full bg-gradient-to-br from-orange-500 to-rose-600 rounded-3xl p-6 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="h-4 w-20 bg-white/20 rounded-full" />
                    <div className="h-6 w-10 bg-white/20 rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-16 bg-white/20 rounded-full" />
                    <div className="h-6 w-32 bg-white/40 rounded-full" />
                  </div>
                </div>
              </div>
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
            </div>
            {/* Floating glow behind phone */}
            <div className="absolute inset-0 bg-orange-500/20 blur-[100px] -z-10 rounded-full" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-[#1E2533]/50 bg-[#07090E]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="SwiftPay Logo" className="w-8 h-8 object-contain rounded-lg" />
            <span className="text-lg font-bold text-white">SwiftPay</span>
          </div>

          <p className="text-slate-500 text-sm font-medium">© 2024 SwiftPay Financial. All rights reserved.</p>

          <div className="flex items-center gap-8 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <span className="cursor-pointer hover:text-white transition-colors">Twitter</span>
            <span className="cursor-pointer hover:text-white transition-colors">Discord</span>
            <span className="cursor-pointer hover:text-white transition-colors">LinkedIn</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: any) {
  return (
    <div className="p-8 bg-[#0D1017]/30 border border-[#1E2533] rounded-3xl hover:border-orange-500/30 transition-all group">
      <div className="text-orange-400 mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function AppFeature({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center">
        <CheckCircle2 size={16} className="text-orange-400" />
      </div>
      <span className="text-slate-300 font-medium">{label}</span>
    </div>
  );
}
