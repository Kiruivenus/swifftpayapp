import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  Globe,
  Zap,
  CheckCircle2,
  Play,
  Apple,
  CreditCard,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Lock,
  Check,
  Star,
  ChevronRight
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050816] text-[#F3F4F6] overflow-hidden font-sans selection:bg-[#FF6B00]/30">
      
      {/* Sticky Blurred Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-[#050816]/75 backdrop-blur-md border-b border-[#1E2533]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <img src="/logo.png" alt="SwiftPay Logo" className="w-9 h-9 object-contain rounded-xl shadow-lg shadow-[#FF6B00]/10 group-hover:scale-105 transition-transform" />
            <span className="text-xl font-bold tracking-tight text-white">SwiftPay</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link>
            <Link href="#security" className="hover:text-white transition-colors">Security</Link>
            <Link href="#download" className="hover:text-white transition-colors">Download</Link>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className="px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all bg-[#0D1017]/50 hover:bg-[#0D1017] border border-[#1E2533] rounded-xl"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-[#FF6B00] hover:bg-[#FF7A00] rounded-xl shadow-lg shadow-[#FF6B00]/10 hover:shadow-[#FF6B00]/25 transition-all hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 px-4 sm:px-6">
        {/* Soft Background Orange Glows */}
        <div className="absolute top-0 left-1/3 -translate-x-1/2 w-full max-w-5xl h-[600px] bg-[#FF6B00]/5 blur-[130px] rounded-full -z-10" />
        <div className="absolute top-20 right-0 w-80 h-80 bg-orange-600/[0.03] blur-[100px] rounded-full -z-10" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Side: Copywriting */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FF6B00]/10 border border-[#FF6B00]/20 rounded-full text-[11px] font-bold uppercase tracking-widest text-[#FF6B00] animate-pulse">
              <span className="w-1.5 h-1.5 bg-[#FF6B00] rounded-full" /> Trusted by African Businesses
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-[54px] font-black tracking-tight leading-[1.05] text-white">
              The fastest way to move money <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-[#FF6B00]">across Africa.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 max-w-xl leading-relaxed">
              Send, receive, convert and spend KES, USD and USDT from one secure financial platform built for modern African businesses and creators.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-3 w-full sm:w-auto">
              <Link href="/register" className="w-full sm:w-auto px-7 py-3.5 bg-[#FF6B00] hover:bg-[#FF7A00] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B00]/25 transition-all hover:scale-[1.02]">
                Get Started <ArrowRight size={18} />
              </Link>
              <Link href="#how-it-works" className="w-full sm:w-auto px-7 py-3.5 bg-[#0D1017] hover:bg-[#1E2533] text-white font-bold rounded-xl border border-[#1E2533] flex items-center justify-center gap-2 transition-all">
                View Demo
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-6 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5"><Check size={14} className="text-[#FF6B00]" /> Instant Settlements</span>
              <span className="flex items-center gap-1.5"><Check size={14} className="text-[#FF6B00]" /> Bank-Level Security</span>
              <span className="flex items-center gap-1.5"><Check size={14} className="text-[#FF6B00]" /> Multi-Currency Wallets</span>
            </div>
          </div>

          {/* Right Side: Fintech Dashboard Preview */}
          <div className="lg:col-span-6 relative flex justify-center">
            
            {/* Soft Ambient Glow */}
            <div className="absolute inset-0 bg-[#FF6B00]/5 blur-[80px] -z-10 rounded-full" />
            
            {/* Dashboard Container */}
            <div className="w-full max-w-[540px] bg-[#0D1017]/85 border border-[#1E2533] rounded-2xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-sm">
              
              {/* Header mockup */}
              <div className="flex items-center justify-between border-b border-[#1E2533]/50 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="text-[10px] text-slate-600 font-bold ml-2 tracking-widest uppercase">SwiftPay Platform</span>
                </div>
                <div className="flex items-center gap-2 bg-[#050816] px-2.5 py-1 rounded-lg border border-[#1E2533]/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] text-emerald-400 font-black">LIVE FX MODE</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                
                {/* Balance & Cards Column */}
                <div className="sm:col-span-7 space-y-4">
                  {/* Balance Widget */}
                  <div className="bg-[#050816]/70 border border-[#1E2533]/80 rounded-xl p-4 space-y-2">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Default Balance</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-medium text-slate-400">$</span>
                      <span className="text-2xl font-black text-white tracking-tight">12,480.00</span>
                      <span className="text-[10px] text-slate-500 ml-1">USD</span>
                    </div>
                    <div className="pt-2 border-t border-[#1E2533]/40 grid grid-cols-2 gap-2 text-left">
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase">KES Balance</p>
                        <p className="text-xs font-extrabold text-white">1,603,680.00</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase">USDT Asset</p>
                        <p className="text-xs font-extrabold text-[#FF6B00]">2,500.00 USDT</p>
                      </div>
                    </div>
                  </div>

                  {/* Virtual Card Preview */}
                  <div className="bg-gradient-to-br from-[#FF6B00] via-orange-600 to-rose-600 rounded-xl p-4 h-[135px] flex flex-col justify-between shadow-lg relative overflow-hidden select-none group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[9px] uppercase tracking-widest text-white/70 font-black">SwiftPay Business</p>
                        <p className="text-xs text-white font-bold mt-1">Virtual Card</p>
                      </div>
                      <CreditCard size={20} className="text-white/80" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-mono text-white tracking-widest">•••• •••• •••• 8240</p>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[7px] text-white/50 uppercase">Expiry</p>
                          <p className="text-[10px] font-medium text-white">12/28</p>
                        </div>
                        <span className="text-[10px] font-black uppercase text-white tracking-wider">VISA</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conversion Widget Column */}
                <div className="sm:col-span-5 space-y-4">
                  
                  {/* Conversion Tool */}
                  <div className="bg-[#050816]/70 border border-[#1E2533]/80 rounded-xl p-4 flex flex-col justify-between h-full space-y-3">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Quick Convert</p>
                    
                    <div className="space-y-1.5">
                      <div className="bg-[#0D1017] p-2 rounded border border-[#1E2533]/40 flex justify-between items-center">
                        <span className="text-xs text-slate-400 font-bold">150,000</span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-[#1E2533] text-white rounded font-bold">KES</span>
                      </div>
                      
                      <div className="flex justify-center my-1">
                        <RefreshCw size={12} className="text-[#FF6B00] animate-spin" />
                      </div>

                      <div className="bg-[#0D1017] p-2 rounded border border-[#1E2533]/40 flex justify-between items-center">
                        <span className="text-xs text-white font-bold">1,153.84</span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-[#FF6B00]/20 text-[#FF6B00] rounded font-bold">USDT</span>
                      </div>
                    </div>

                    <div className="text-[9px] text-slate-500 text-center">
                      1 USDT = 130.00 KES <br />
                      <span className="text-[#FF6B00] font-semibold">No Hidden Fees</span>
                    </div>
                  </div>

                </div>

              </div>

              {/* Transactions List */}
              <div className="mt-4 bg-[#050816]/70 border border-[#1E2533]/80 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Recent Transactions</p>
                  <span className="text-[9px] text-[#FF6B00] cursor-pointer hover:underline">View All</span>
                </div>
                <div className="space-y-2">
                  <TransactionRow
                    icon={<ArrowUpRight size={14} className="text-emerald-500" />}
                    title="M-Pesa Deposit"
                    subtitle="Ref: STK_92817"
                    amount="+ KES 12,000.00"
                    amountClass="text-emerald-500"
                  />
                  <TransactionRow
                    icon={<ArrowDownLeft size={14} className="text-slate-400" />}
                    title="Send to USD Wallet"
                    subtitle="Freelance Payout"
                    amount="- $85.00"
                    amountClass="text-white"
                  />
                  <TransactionRow
                    icon={<RefreshCw size={14} className="text-[#FF6B00]" />}
                    title="KES to USDT Swap"
                    subtitle="Completed"
                    amount="+ 350.00 USDT"
                    amountClass="text-[#FF6B00]"
                  />
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Live Stats Section */}
      <section className="border-y border-[#1E2533]/40 bg-[#07090E]/60 py-12 px-4 sm:px-6 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <StatCard value="$25M+" label="Processed Volume" />
          <StatCard value="100K+" label="Users across Africa" />
          <StatCard value="99.9%" label="Service Uptime" />
          <StatCard value="6" label="African Markets" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 sm:py-32 px-4 sm:px-6 relative">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-xs uppercase tracking-widest font-black text-[#FF6B00]">Engineered for African Scale</h2>
            <p className="text-3xl sm:text-4xl font-black tracking-tight text-white">Powerful core features, zero friction.</p>
            <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
              A comprehensive financial API and dashboard suite built to handle transfers, deposits, and payments instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Globe className="text-[#FF6B00]" size={28} />}
              title="Global Transfers"
              desc="Move money across African borders instantly with highly competitive real-time rates."
            />
            <FeatureCard
              icon={<CreditCard className="text-[#FF6B00]" size={28} />}
              title="Multi-Currency Wallets"
              desc="Hold, manage, and scale with KES, USD, EUR and USDT assets in a unified secure dashboard."
            />
            <FeatureCard
              icon={<RefreshCw className="text-[#FF6B00]" size={28} />}
              title="Virtual Cards"
              desc="Create secure, instant-use virtual cards for global online transactions and supplier payments."
            />
            <FeatureCard
              icon={<TrendingUp className="text-[#FF6B00]" size={28} />}
              title="Real-Time Exchange"
              desc="Convert between fiat and stablecoins instantly with fully transparent, mid-market exchange rates."
            />
            <FeatureCard
              icon={<ArrowDownLeft className="text-[#FF6B00]" size={28} />}
              title="M-Pesa Integration"
              desc="Eagerly deposit or withdraw funds directly to and from your M-Pesa account via prompt STK Push APIs."
            />
            <FeatureCard
              icon={<ShieldCheck className="text-[#FF6B00]" size={28} />}
              title="Enterprise Security"
              desc="Advanced 256-bit encryption, strict biometric logins, and localized real-time fraud monitoring."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 sm:py-32 px-4 sm:px-6 bg-[#07090E]/30 relative border-t border-[#1E2533]/40">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-xs uppercase tracking-widest font-black text-[#FF6B00]">Simple Setup Flow</h2>
            <p className="text-3xl sm:text-4xl font-black tracking-tight text-white">How it works</p>
          </div>

          <div className="relative">
            {/* Timeline line connection (Desktop) */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#1E2533] -translate-y-1/2 hidden md:block z-0" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
              <TimelineStep
                step="Step 1"
                title="Create Account"
                desc="Register your business or personal account, complete verification, and setup secure credentials within 2 minutes."
              />
              <TimelineStep
                step="Step 2"
                title="Fund Wallet"
                desc="Load assets via standard M-Pesa mobile money deposits, localized bank transfers, or incoming stablecoin paths."
              />
              <TimelineStep
                step="Step 3"
                title="Send, Convert & Spend"
                desc="Instantly transact cross-border, swap currencies at zero margin, or pay providers globally using virtual cards."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Product Showcase Section */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column: Phone Mockup */}
          <div className="relative flex justify-center order-2 lg:order-1">
            {/* Glow behind phone */}
            <div className="absolute inset-0 bg-[#FF6B00]/5 blur-[120px] rounded-full -z-10" />

            {/* Apple Device Layout */}
            <div className="w-[305px] h-[610px] bg-[#050816] rounded-[52px] border-[10px] border-[#1E2533] overflow-hidden shadow-2xl relative">
              {/* Dynamic Island */}
              <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-28 h-7 bg-[#1E2533] rounded-full flex items-center justify-center z-20">
                <span className="w-2.5 h-2.5 rounded-full bg-black/60 border border-white/5" />
              </div>
              
              {/* Inner phone screensaver mockup */}
              <div className="p-6 pt-16 space-y-6 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain rounded-lg" />
                    <span className="text-xs font-bold text-white">SwiftPay</span>
                  </div>
                  <Clock size={16} className="text-slate-500" />
                </div>

                <div className="space-y-1.5 bg-[#0D1017] p-3 border border-[#1E2533] rounded-2xl text-left">
                  <span className="text-[8px] text-slate-500 uppercase tracking-widest font-black">Default Wallet</span>
                  <div className="text-lg font-black text-white">$2,450.00</div>
                  <div className="text-[9px] text-[#FF6B00] font-semibold">1 USDT = 1.00 USD</div>
                </div>

                {/* Simulated Quick Send Screen */}
                <div className="space-y-3 bg-[#0D1017] p-3 border border-[#1E2533] rounded-2xl text-left flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[8px] text-slate-500 uppercase tracking-widest font-black">Quick Send</span>
                    <div className="space-y-1.5 mt-2">
                      <div className="p-2 bg-[#050816] border border-[#1E2533]/50 rounded flex justify-between items-center text-[10px]">
                        <span className="text-slate-400">Send To:</span>
                        <span className="text-white font-bold">K. Mwangi</span>
                      </div>
                      <div className="p-2 bg-[#050816] border border-[#1E2533]/50 rounded flex justify-between items-center text-[10px]">
                        <span className="text-slate-400">Amount:</span>
                        <span className="text-[#FF6B00] font-bold">KES 25,000</span>
                      </div>
                    </div>
                  </div>

                  <button className="w-full py-2 bg-[#FF6B00] text-white font-bold text-[10px] rounded-lg shadow-md shadow-[#FF6B00]/15">
                    Confirm Transfer
                  </button>
                </div>

                {/* Home Indicator */}
                <div className="w-32 h-1 bg-slate-800 rounded-full mx-auto self-end mt-2" />
              </div>
              
              {/* Device sheen layer */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Right Column: Features List */}
          <div className="space-y-8 order-1 lg:order-2">
            <div className="space-y-4">
              <h2 className="text-xs uppercase tracking-widest font-black text-[#FF6B00]">Unified Product Suite</h2>
              <p className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                Your money, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] to-rose-500">your control.</span>
              </p>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                Take command of your assets with our native mobile platform. From immediate transfers to currency conversions, financial liberty is now pocket-sized.
              </p>
            </div>

            <div className="space-y-4 text-left">
              <AppShowcaseFeature label="Send money globally at zero hidden costs" />
              <AppShowcaseFeature label="Convert KES ↔ USD instantly at mid-market rates" />
              <AppShowcaseFeature label="Create and configure unlimited virtual cards" />
              <AppShowcaseFeature label="Track transaction states via live webhooks" />
              <AppShowcaseFeature label="Secure wallet management using Face ID" />
            </div>
          </div>

        </div>
      </section>

      {/* Business Use Cases Section */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 bg-[#07090E]/30 relative border-t border-[#1E2533]/40">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-xs uppercase tracking-widest font-black text-[#FF6B00]">Custom Built Solutions</h2>
            <p className="text-3xl sm:text-4xl font-black tracking-tight text-white">Engineered for your workflow</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <UseCaseCard
              title="Freelancers"
              desc="Receive USD payments globally from clients and platforms. Convert directly to KES and settle straight to M-Pesa."
            />
            <UseCaseCard
              title="E-commerce Stores"
              desc="Settle invoices globally. Pay suppliers and advertising platforms using SwiftPay virtual cards with zero fx markup."
            />
            <UseCaseCard
              title="Remote Teams"
              desc="Automate global payroll. Distribute mass payouts to workers, developers, and partners in multiple currencies instantly."
            />
            <UseCaseCard
              title="Crypto Traders"
              desc="Move seamlessly between local fiat systems and stablecoin liquidity pools with rapid compliance tracking."
            />
          </div>
        </div>
      </section>

      {/* Trust & Security Section */}
      <section id="security" className="py-24 sm:py-32 px-4 sm:px-6 relative">
        <div className="max-w-6xl mx-auto">
          {/* Glass Card */}
          <div className="bg-gradient-to-br from-[#0D1017] to-[#07090E] border border-[#1E2533] rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-center gap-12">
            
            {/* Backdrop visual glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF6B00]/5 blur-[100px] pointer-events-none rounded-full" />
            
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-wider text-emerald-400">
                <Lock size={12} /> SECURE CRYPTOGRAPHIC PROTOCOL
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                Bank-level infrastructure, customized for African fintech.
              </h3>
              <p className="text-slate-400 text-sm sm:text-base">
                We leverage enterprise security systems to protect your balances. All operations are backed by dynamic fraud detection triggers and biometric barriers.
              </p>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#FF6B00]" /> 256-bit Encryption</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#FF6B00]" /> Multi-Factor Auth</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#FF6B00]" /> Biometric Protection</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#FF6B00]" /> Fraud Monitoring</span>
              </div>
            </div>

            {/* Shield Graphic */}
            <div className="w-48 h-48 bg-[#050816] rounded-2xl border border-[#1E2533] flex items-center justify-center shadow-inner shrink-0 relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#FF6B00]/5 to-transparent rounded-2xl pointer-events-none" />
              <ShieldCheck size={72} className="text-[#FF6B00] group-hover:scale-105 transition-transform" />
            </div>

          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 bg-[#07090E]/30 relative border-y border-[#1E2533]/40">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-xs uppercase tracking-widest font-black text-[#FF6B00]">Verified User Reviews</h2>
            <p className="text-3xl sm:text-4xl font-black tracking-tight text-white">What our users say</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard
              initials="KO"
              avatarColor="bg-orange-500"
              name="Kevin Ochieng"
              title="Freelance Web Designer"
              quote="SwiftPay made it easier for us to receive international payments without delays. Setting up was incredibly fast, and funds reach my M-Pesa instantly."
            />
            <TestimonialCard
              initials="AM"
              avatarColor="bg-rose-500"
              name="Amina Mutua"
              title="Founder, Mutua Apparel"
              quote="Paying international suppliers in China used to cost us hundreds of dollars in hidden bank margins. With SwiftPay virtual cards, we settle invoices immediately with zero markup."
            />
            <TestimonialCard
              initials="JN"
              avatarColor="bg-amber-600"
              name="Joseph Ndwiga"
              title="Crypto Trader"
              quote="The liquidity on KES to USDT swaps is the best in the region. Settle rates are updated in real-time and customer service resolved my registration questions instantly."
            />
          </div>
        </div>
      </section>

      {/* Download App Section */}
      <section id="download" className="py-24 sm:py-32 px-4 sm:px-6 relative">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-[#0D1017] to-[#050816] border border-[#1E2533] rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-12">
          
          {/* Orange gradient light */}
          <div className="absolute inset-0 bg-[#FF6B00]/[0.02] pointer-events-none" />

          <div className="space-y-6 flex-1 text-center md:text-left">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Take your finances anywhere.
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-md">
              Download SwiftPay on iOS and Android. Open a global multi-currency account in less than two minutes.
            </p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
              <button className="flex items-center gap-3 px-6 py-3 bg-[#050816] border border-[#1E2533] rounded-xl hover:border-slate-700 transition-all select-none">
                <Play size={20} className="text-[#FF6B00]" fill="currentColor" />
                <div className="text-left">
                  <p className="text-[8px] uppercase font-black text-slate-500 leading-none mb-1">Get it on</p>
                  <p className="text-xs font-bold text-white leading-none">Google Play</p>
                </div>
              </button>
              <button className="flex items-center gap-3 px-6 py-3 bg-[#050816] border border-[#1E2533] rounded-xl hover:border-slate-700 transition-all select-none">
                <Apple size={20} className="text-white" fill="currentColor" />
                <div className="text-left">
                  <p className="text-[8px] uppercase font-black text-slate-500 leading-none mb-1">Download on the</p>
                  <p className="text-xs font-bold text-white leading-none">App Store</p>
                </div>
              </button>
            </div>
          </div>

          {/* Inline Phone Preview */}
          <div className="w-[200px] h-[340px] bg-[#050816] rounded-[32px] border-[6px] border-[#1E2533] overflow-hidden relative shrink-0 shadow-lg hidden sm:block">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-[#1E2533] rounded-full z-20" />
            <div className="p-4 pt-10 space-y-4">
              <div className="w-8 h-8 rounded bg-[#FF6B00]/10 flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
              </div>
              <div className="space-y-1.5">
                <div className="h-2 w-12 bg-slate-800 rounded" />
                <div className="h-3.5 w-24 bg-slate-800 rounded" />
              </div>
              <div className="h-24 w-full bg-gradient-to-br from-[#FF6B00] to-rose-600 rounded-xl" />
            </div>
          </div>

        </div>
      </section>

      {/* Footer Upgrade */}
      <footer className="py-20 px-4 sm:px-6 border-t border-[#1E2533]/50 bg-[#050816] relative text-left">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            
            {/* Brand column */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="SwiftPay Logo" className="w-8 h-8 object-contain rounded-lg" />
                <span className="text-lg font-bold text-white">SwiftPay</span>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm max-w-xs leading-relaxed">
                Premium cryptographic transaction clearing, borderless multi-currency management, and localized card settlements built for modern African enterprises.
              </p>
              <div className="flex items-center gap-4 text-slate-500">
                <span className="cursor-pointer hover:text-white transition-colors">Twitter</span>
                <span className="cursor-pointer hover:text-white transition-colors">LinkedIn</span>
                <span className="cursor-pointer hover:text-white transition-colors">Discord</span>
              </div>
            </div>

            {/* Links column: Products */}
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-widest font-black text-white">Products</p>
              <ul className="space-y-2 text-xs font-semibold text-slate-500">
                <li><Link href="#features" className="hover:text-white transition-colors">Global Transfers</Link></li>
                <li><Link href="#features" className="hover:text-white transition-colors">Virtual Cards</Link></li>
                <li><Link href="#features" className="hover:text-white transition-colors">Multi-Currency Wallets</Link></li>
                <li><Link href="#features" className="hover:text-white transition-colors">Real-Time Exchange</Link></li>
              </ul>
            </div>

            {/* Links column: Company */}
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-widest font-black text-white">Company</p>
              <ul className="space-y-2 text-xs font-semibold text-slate-500">
                <li><span className="cursor-not-allowed text-slate-600">About</span></li>
                <li><span className="cursor-not-allowed text-slate-600">Blog</span></li>
                <li><span className="cursor-not-allowed text-slate-600">Careers</span></li>
                <li><span className="cursor-not-allowed text-slate-600">Contact</span></li>
              </ul>
            </div>

            {/* Links column: Legal */}
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-widest font-black text-white">Legal</p>
              <ul className="space-y-2 text-xs font-semibold text-slate-500">
                <li><span className="cursor-not-allowed text-slate-600">Privacy Policy</span></li>
                <li><span className="cursor-not-allowed text-slate-600">Terms of Service</span></li>
                <li><span className="cursor-not-allowed text-slate-600">Compliance</span></li>
              </ul>
            </div>

          </div>

          <div className="border-t border-[#1E2533]/40 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-600">
            <p>© 2026 SwiftPay Financial. All rights reserved.</p>
            <p className="text-center sm:text-right">SwiftPay is a registered clearing aggregator and financial technology service provider. Settle transactions are regulated under standard mobile money framework policies.</p>
          </div>

        </div>
      </footer>

    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="p-6 bg-[#0D1017]/10 border border-[#1E2533]/20 rounded-2xl hover:border-[#FF6B00]/20 hover:bg-[#0D1017]/35 transition-all group">
      <p className="text-2xl sm:text-3xl font-black text-white group-hover:scale-102 transition-transform">{value}</p>
      <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-8 bg-[#0D1017]/30 border border-[#1E2533] rounded-2xl hover:border-[#FF6B00]/30 transition-all hover:-translate-y-1 duration-300 group text-left">
      <div className="mb-6 group-hover:scale-105 transition-transform flex items-center justify-center w-12 h-12 rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/20">
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-3 text-white">{title}</h3>
      <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function TimelineStep({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <div className="space-y-4 p-6 bg-[#0D1017]/40 border border-[#1E2533]/70 rounded-2xl hover:border-[#FF6B00]/20 transition-all text-left relative z-10">
      <span className="text-[10px] uppercase font-black text-[#FF6B00] bg-[#FF6B00]/10 px-2.5 py-1 rounded-full border border-[#FF6B00]/20">{step}</span>
      <h4 className="text-lg font-bold text-white pt-2">{title}</h4>
      <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function AppShowcaseFeature({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
        <Check size={12} className="text-[#FF6B00] font-black" />
      </div>
      <span className="text-slate-300 text-xs sm:text-sm font-semibold">{label}</span>
    </div>
  );
}

function UseCaseCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-6 bg-[#0D1017]/30 border border-[#1E2533]/80 rounded-2xl hover:border-[#FF6B00]/20 transition-all text-left flex flex-col justify-between space-y-4">
      <div>
        <h4 className="text-base font-bold text-white">{title}</h4>
        <p className="text-slate-400 text-xs mt-2 leading-relaxed">{desc}</p>
      </div>
      <span className="text-[10px] text-[#FF6B00] font-bold flex items-center cursor-pointer hover:underline">Read More <ChevronRight size={10} /></span>
    </div>
  );
}

function TestimonialCard({ initials, avatarColor, name, title, quote }: { initials: string; avatarColor: string; name: string; title: string; quote: string }) {
  return (
    <div className="p-8 bg-[#0D1017]/40 border border-[#1E2533] rounded-2xl flex flex-col justify-between text-left space-y-6 hover:border-[#FF6B00]/20 transition-all">
      <div className="flex items-center gap-1.5 text-[#FF6B00]">
        {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
      </div>
      <p className="text-slate-300 text-xs sm:text-sm italic leading-relaxed">"{quote}"</p>
      <div className="flex items-center gap-3 pt-2">
        <div className={`w-9 h-9 rounded-full ${avatarColor} text-white text-xs font-black flex items-center justify-center select-none`}>
          {initials}
        </div>
        <div>
          <p className="text-xs font-bold text-white leading-none">{name}</p>
          <p className="text-[10px] text-slate-500 mt-1 leading-none">{title}</p>
        </div>
      </div>
    </div>
  );
}

function TransactionRow({ icon, title, subtitle, amount, amountClass }: { icon: React.ReactNode; title: string; subtitle: string; amount: string; amountClass: string }) {
  return (
    <div className="flex items-center justify-between text-xs py-1">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-[#0D1017] border border-[#1E2533]/50 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="font-bold text-white leading-none">{title}</p>
          <p className="text-[9px] text-slate-600 mt-1 leading-none">{subtitle}</p>
        </div>
      </div>
      <span className={`font-mono font-black ${amountClass}`}>{amount}</span>
    </div>
  );
}
