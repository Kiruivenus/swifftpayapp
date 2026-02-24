import Link from "next/link";
import { Activity, Database, Smartphone, ExternalLink, ShieldCheck, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="text-white w-7 h-7 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">SwiftPay</h1>
              <p className="text-slate-400 text-sm font-medium">Backend API Center</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">System Operational</span>
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Status Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Section */}
            <section className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl backdrop-blur-sm">
              <h2 className="text-3xl font-bold text-white mb-4">Production Gateway</h2>
              <p className="text-slate-400 text-lg leading-relaxed max-w-xl mb-8">
                Your SwiftPay transaction engine is live. This interface monitors connectivity between your
                Android app, MongoDB Atlas, and the M-Pesa Daraja system.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="https://vercel.com/dashboard"
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-600/20"
                >
                  <Activity size={18} />
                  Vercel Logs
                </Link>
                <Link
                  href="/api/mpesa/stkpush"
                  className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition-all"
                >
                  <Smartphone size={18} />
                  Test API
                </Link>
              </div>
            </section>

            {/* Configured Endpoints */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl hover:border-indigo-500/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4">
                  <ShieldCheck className="text-indigo-400" size={24} />
                </div>
                <h3 className="text-white font-bold mb-1">Authentication</h3>
                <p className="text-slate-400 text-sm">Secure JWT-based login and user registration endpoints.</p>
              </div>
              <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl hover:border-blue-500/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                  <Database className="text-blue-400" size={24} />
                </div>
                <h3 className="text-white font-bold mb-1">Data Layer</h3>
                <p className="text-slate-400 text-sm">Automated synchronization with MongoDB Atlas cloud.</p>
              </div>
            </section>
          </div>

          {/* Sidebar Status Column */}
          <div className="space-y-6">
            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-3xl backdrop-blur-sm">
              <h3 className="text-slate-100 font-bold mb-6 flex items-center justify-between">
                Service Status
                <Link href="#" className="text-indigo-400 hover:text-indigo-300">
                  <Activity size={16} />
                </Link>
              </h3>

              <div className="space-y-6">
                <StatusItem label="API Runtime" status="Healthy" />
                <StatusItem label="MongoDB Atlas" status="Connected" />
                <StatusItem label="M-Pesa Webhook" status="Operational" />
                <StatusItem label="JWT Auth" status="Active" />
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-4">Technical Specs</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Next.js Version</span>
                    <span className="text-slate-200">15+</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Environment</span>
                    <span className="text-slate-200">Production</span>
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="https://github.com/Kiruivenus/swifftpayapp"
              target="_blank"
              className="flex items-center justify-between p-4 bg-slate-900/30 border border-slate-800 hover:border-indigo-500/50 rounded-2xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ExternalLink size={14} />
                </div>
                <span className="text-sm font-medium">Source Code</span>
              </div>
              <Activity className="text-indigo-500/40" size={16} />
            </Link>
          </div>
        </main>

        <footer className="mt-20 pt-8 border-t border-slate-900 text-center">
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} SwiftPay Financial Technologies. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}

function StatusItem({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400 text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-slate-200 text-sm font-medium">{status}</span>
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
      </div>
    </div>
  );
}
