import { useEffect, useRef, useState } from "react";

// ── helpers ──────────────────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// ── mock phone screen SVGs ────────────────────────────────────────────────────
function PhoneMock({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative mx-auto ${className}`} style={{ width: 240, filter: "drop-shadow(0 32px 64px rgba(124,92,252,0.25))" }}>
      <div className="rounded-[36px] border-4 border-[#1a1a2e] bg-[#0d0d1a] overflow-hidden" style={{ width: 240, height: 480 }}>
        {/* notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#1a1a2e] rounded-b-2xl z-10" />
        <div className="w-full h-full bg-white overflow-hidden pt-6">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── App icons inline ──────────────────────────────────────────────────────────
const APP_ICONS: Record<string, string> = {
  Instagram: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/32px-Instagram_logo_2016.svg.png",
  YouTube:   "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/32px-YouTube_full-color_icon_%282017%29.svg.png",
  TikTok:    "https://upload.wikimedia.org/wikipedia/en/thumb/a/a9/TikTok_logo.svg/32px-TikTok_logo.svg.png",
  Twitter:   "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Logo_of_Twitter.svg/32px-Logo_of_Twitter.svg.png",
};

// ── screens inside phones ─────────────────────────────────────────────────────
function Screen1() {
  return (
    <div className="p-4 flex flex-col gap-3">
      <p className="text-xs font-semibold text-gray-400 text-center">Time Disappeared</p>
      <div className="bg-gray-50 rounded-2xl p-3 flex items-center gap-3">
        <img src={APP_ICONS.Instagram} className="w-8 h-8 rounded-lg" alt="" />
        <div>
          <p className="text-[10px] text-gray-400">Started scrolling</p>
          <p className="text-sm font-bold text-gray-800">10:08 AM</p>
        </div>
      </div>
      <div className="flex justify-center">
        <div className="w-0.5 h-6 bg-[#7C5CFC] opacity-40" />
      </div>
      <div className="bg-gray-50 rounded-2xl p-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-sm">🕐</div>
        <div>
          <p className="text-[10px] text-gray-400">Still scrolling</p>
          <p className="text-sm font-bold text-gray-800">11:21 AM</p>
        </div>
      </div>
      <div className="bg-[#EEF0FF] rounded-2xl p-4 text-center mt-2">
        <p className="text-[10px] text-[#7C5CFC] font-medium">🕐 gone</p>
        <p className="text-2xl font-black text-[#7C5CFC]">1h 13m</p>
      </div>
    </div>
  );
}

function Screen2() {
  const items = [
    { time: "9:00 AM",  app: "YouTube",   note: '"Just one video…"' },
    { time: "11:30 AM", app: "Instagram", note: '"Quick check"' },
    { time: "2:45 PM",  app: "Twitter",   note: '"What\'s happening?"' },
    { time: "7:10 PM",  app: "YouTube",   note: '"5 minutes break"' },
  ];
  return (
    <div className="p-4 flex flex-col gap-2">
      <p className="text-xs font-semibold text-gray-400 text-center mb-1">Distractions all day</p>
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2">
          <p className="text-[9px] text-gray-400 w-12 shrink-0">{it.time}</p>
          <img src={APP_ICONS[it.app]} className="w-6 h-6 rounded" alt="" />
          <p className="text-[10px] text-gray-500 italic truncate">{it.note}</p>
        </div>
      ))}
      <div className="mt-2 text-center">
        <span className="text-xs text-gray-500">And before you know it, </span>
        <span className="text-xs font-bold text-[#7C5CFC]">hours are gone.</span>
      </div>
    </div>
  );
}

function Screen3() {
  return (
    <div className="p-4 flex flex-col gap-2">
      <p className="text-xs font-semibold text-gray-400 text-center mb-1">My Limits</p>
      {[
        { app: "Instagram", icon: APP_ICONS.Instagram, limit: "1h / day",  used: "32m", pct: 53 },
        { app: "YouTube",   icon: APP_ICONS.YouTube,   limit: "45m / day", used: "20m", pct: 44 },
        { app: "TikTok",    icon: APP_ICONS.TikTok,    limit: "30m / day", used: "Limit reached", pct: 100 },
      ].map((r, i) => (
        <div key={i} className="bg-gray-50 rounded-xl p-2">
          <div className="flex items-center gap-2 mb-1">
            <img src={r.icon} className="w-6 h-6 rounded" alt="" />
            <p className="text-[10px] font-semibold text-gray-700 flex-1">{r.app}</p>
            <p className="text-[9px] text-gray-400">{r.limit}</p>
          </div>
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${r.pct}%`, backgroundColor: r.pct >= 100 ? "#EF4444" : "#7C5CFC" }} />
          </div>
          <p className={`text-[9px] mt-0.5 text-right ${r.pct >= 100 ? "text-red-500 font-bold" : "text-gray-400"}`}>{r.used}</p>
        </div>
      ))}
      {/* lock card */}
      <div className="bg-[#7C5CFC] rounded-2xl p-3 text-center mt-1">
        <p className="text-[9px] text-white/80 mb-1">🔒 Instagram is locked</p>
        <p className="text-xs font-black text-white tracking-widest">02 : 15 : 32</p>
        <div className="flex gap-2 mt-2">
          <div className="flex-1 bg-white/20 rounded-xl py-1.5 text-[9px] text-white font-semibold">Wait 4:32<br/>Free</div>
          <div className="flex-1 bg-white rounded-xl py-1.5 text-[9px] text-[#7C5CFC] font-bold">Unlock now<br/>$5</div>
        </div>
      </div>
    </div>
  );
}

// ── stat card ─────────────────────────────────────────────────────────────────
function Stat({ value, label }: { value: string; label: string }) {
  const { ref, visible } = useInView();
  return (
    <div ref={ref} className={`text-center transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <p className="text-5xl font-black text-[#7C5CFC]">{value}</p>
      <p className="text-sm text-gray-500 mt-1 max-w-[140px] mx-auto leading-snug">{label}</p>
    </div>
  );
}

// ── feature card ──────────────────────────────────────────────────────────────
function Feature({ icon, title, desc, delay }: { icon: string; title: string; desc: string; delay: string }) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={`bg-white rounded-3xl p-6 border border-purple-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ transitionDelay: delay }}
    >
      <div className="w-12 h-12 rounded-2xl bg-[#EEF0FF] flex items-center justify-center text-2xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function Index() {
  const heroRef = useInView(0.1);
  const howRef = useInView(0.1);
  const featRef = useInView(0.1);
  const ctaRef = useInView(0.1);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-16 py-4 bg-white/80 backdrop-blur border-b border-purple-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#7C5CFC] flex items-center justify-center text-white font-black text-sm">S</div>
          <span className="font-bold text-gray-900 text-lg">Screenly</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-500 font-medium">
          <a href="#how" className="hover:text-[#7C5CFC] transition-colors">How it works</a>
          <a href="#features" className="hover:text-[#7C5CFC] transition-colors">Features</a>
          <a href="#stats" className="hover:text-[#7C5CFC] transition-colors">Impact</a>
        </div>
        <a href="#download" className="bg-[#7C5CFC] text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-[#6a4de8] transition-colors">
          Get the app
        </a>
      </nav>

      {/* ── HERO ── */}
      <section className="pt-32 pb-20 px-6 md:px-16 flex flex-col lg:flex-row items-center gap-16 max-w-7xl mx-auto">
        <div
          ref={heroRef.ref}
          className={`flex-1 transition-all duration-700 ${heroRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          <div className="inline-flex items-center gap-2 bg-[#EEF0FF] text-[#7C5CFC] text-xs font-semibold px-4 py-2 rounded-full mb-6">
            📱 Take back your screen time
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight mb-6">
            Ever opened an app<br />
            for 5 minutes…<br />
            <span className="text-[#7C5CFC]">and lost an hour?</span>
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-lg">
            Apps are designed to keep you scrolling. Screenly helps you define real limits, block distractions, and unlock only when it truly matters.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="#download" className="bg-[#7C5CFC] text-white font-bold px-8 py-4 rounded-2xl text-center hover:bg-[#6a4de8] transition-all hover:scale-105 shadow-lg shadow-purple-200">
              Download free →
            </a>
            <a href="#how" className="border border-purple-200 text-[#7C5CFC] font-semibold px-8 py-4 rounded-2xl text-center hover:bg-[#EEF0FF] transition-colors">
              See how it works
            </a>
          </div>
        </div>

        {/* phones */}
        <div className="flex-1 flex justify-center items-end gap-6 relative">
          <div className="translate-y-8 hidden md:block opacity-80">
            <PhoneMock><Screen2 /></PhoneMock>
          </div>
          <div className="z-10">
            <PhoneMock><Screen1 /></PhoneMock>
          </div>
          <div className="translate-y-8 hidden md:block opacity-80">
            <PhoneMock><Screen3 /></PhoneMock>
          </div>
          {/* glow */}
          <div className="absolute inset-0 -z-10 flex items-center justify-center">
            <div className="w-80 h-80 rounded-full bg-[#7C5CFC] opacity-10 blur-[80px]" />
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section id="stats" className="py-20 bg-[#F9F8FF]">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
          <Stat value="3h 15m" label="avg daily screen time per person" />
          <Stat value="96×"    label="average phone unlocks per day" />
          <Stat value="40%"    label="more focus time reported by users" />
          <Stat value="$5"     label="emergency unlock when it truly matters" />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-24 px-6 md:px-16 max-w-7xl mx-auto">
        <div
          ref={howRef.ref}
          className={`text-center mb-16 transition-all duration-700 ${howRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <p className="text-[#7C5CFC] font-semibold text-sm mb-3 uppercase tracking-widest">How it works</p>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900">Simple. Powerful. Honest.</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-12 items-start">
          {[
            {
              step: "01",
              title: "See where time goes",
              desc: "Screenly shows you exactly which apps ate your time and when. No judgment — just clarity.",
              screen: <Screen1 />,
            },
            {
              step: "02",
              title: "Spot the pattern",
              desc: "Notifications, reels, endless feeds — they pull you in constantly. See the pattern to break it.",
              screen: <Screen2 />,
            },
            {
              step: "03",
              title: "Set your limits",
              desc: "Define daily time caps or block windows per app. We enforce them — no workarounds.",
              screen: <Screen3 />,
            },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-8">
              <PhoneMock>{item.screen}</PhoneMock>
              <div className="text-center">
                <span className="text-[#7C5CFC] font-black text-sm">{item.step}</span>
                <h3 className="text-xl font-bold text-gray-900 mt-1 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6 md:px-16 bg-[#F9F8FF]">
        <div className="max-w-6xl mx-auto">
          <div
            ref={featRef.ref}
            className={`text-center mb-16 transition-all duration-700 ${featRef.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <p className="text-[#7C5CFC] font-semibold text-sm mb-3 uppercase tracking-widest">Features</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900">Everything you need to<br /><span className="text-[#7C5CFC]">reclaim your focus.</span></h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Feature delay="0ms"   icon="⏱️" title="Daily time limits"      desc="Set a max daily usage per app. Once hit, it locks — that's it. No negotiation." />
            <Feature delay="100ms" icon="🗓️" title="Time window blocking"   desc="Block Instagram from 9 AM–6 PM on weekdays. You decide when apps are available." />
            <Feature delay="200ms" icon="⚡" title="Emergency unlock"       desc="Need access urgently? Unlock instantly for a small fee. No guilt, just honesty." />
            <Feature delay="300ms" icon="⏳" title="Free cooldown"          desc="Not sure? Wait 5 minutes for free. Usually, the urge passes." />
            <Feature delay="400ms" icon="📊" title="Usage insights"         desc="Weekly reports show your patterns so you can make informed decisions." />
            <Feature delay="500ms" icon="🔒" title="Enforced blocking"      desc="We use OS-level enforcement. No app hopping to bypass your limits." />
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 px-6 md:px-16 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[#7C5CFC] font-semibold text-sm mb-3 uppercase tracking-widest">Real people</p>
          <h2 className="text-4xl font-black text-gray-900">They took back control.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: "Priya S.", role: "Student", quote: "I was spending 4 hours on Instagram daily. Screenly cut it to 45 minutes in a week. My grades actually improved." },
            { name: "Rahul M.", role: "Software Engineer", quote: "The emergency unlock is genius. Knowing I can always get access makes me trust the blocking more." },
            { name: "Ananya K.", role: "Designer", quote: "The time window feature is perfect. TikTok blocked during work hours, totally open on weekends. Balance." },
          ].map((t, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm">
              <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#EEF0FF] flex items-center justify-center font-bold text-[#7C5CFC] text-sm">
                  {t.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-gray-400 text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="download" className="py-24 px-6 mx-4 md:mx-16 mb-16 rounded-3xl bg-[#7C5CFC] text-white text-center">
        <div
          ref={ctaRef.ref}
          className={`transition-all duration-700 ${ctaRef.visible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
        >
          <p className="text-purple-200 font-semibold text-sm mb-4 uppercase tracking-widest">Start today</p>
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            We know self-control<br />is <span className="text-yellow-300">really hard.</span>
          </h2>
          <p className="text-purple-200 text-lg mb-10 max-w-lg mx-auto">
            Screenly makes it easier. Set your limits once and let the app do the rest.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#" className="bg-white text-[#7C5CFC] font-bold px-8 py-4 rounded-2xl hover:bg-purple-50 transition-all hover:scale-105">
              📱 Download for Android
            </a>
            <a href="#" className="bg-white/20 border border-white/30 text-white font-bold px-8 py-4 rounded-2xl hover:bg-white/30 transition-all">
              🍎 Coming soon on iOS
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 px-6 md:px-16 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#7C5CFC] flex items-center justify-center text-white font-black text-xs">S</div>
            <span className="font-bold text-gray-700">Screenly</span>
          </div>
          <p className="text-sm text-gray-400">© 2025 Screenly. Take back your time.</p>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-[#7C5CFC] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#7C5CFC] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#7C5CFC] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
