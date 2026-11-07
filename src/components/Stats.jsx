import { useCountUp, useInView, formatNumber } from "../hooks.js";

const NEON = ["#22c1d6", "#4a90e2", "#16c060", "#a78bfa", "#f4b740", "#f472b6"];

function StatCard({ item, color, start }) {
  const value = useCountUp(item.n, start);
  return (
    <div className="reveal">
      <div className="group relative h-full overflow-hidden rounded-3xl border border-white/15 bg-white/[0.06] p-6 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/30 hover:bg-white/[0.09] sm:p-7">
        <div aria-hidden className="absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-35 blur-2xl transition-opacity duration-300 group-hover:opacity-60" style={{ background: color }} />
        <p className="relative text-[2rem] font-extrabold tracking-tight whitespace-nowrap tabular-nums sm:text-5xl" style={{ color, textShadow: `0 0 28px ${color}80` }}>
          {formatNumber(value)}
          {item.suffix ?? "+"}
        </p>
        <p className="relative mt-2 text-[15px] leading-snug text-white/75">{item.label}</p>
        <span aria-hidden className="absolute inset-x-6 bottom-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      </div>
    </div>
  );
}

export default function Stats({ t }) {
  const [ref, inView] = useInView(0.2);
  return (
    <section id="about" aria-labelledby="stats-h" className="relative overflow-hidden bg-ink py-20 text-white sm:py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-[-10%] h-[460px] w-[460px] animate-blob rounded-full bg-[radial-gradient(closest-side,rgba(34,193,214,0.35),transparent)]" />
        <div className="absolute right-[-10%] bottom-[-30%] h-[520px] w-[520px] animate-blob rounded-full bg-[radial-gradient(closest-side,rgba(109,63,217,0.45),transparent)]" style={{ animationDelay: "-8s" }} />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:26px_26px] [mask-image:radial-gradient(70%_70%_at_50%_50%,#000,transparent)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold tracking-[0.2em] text-teal uppercase">{t.stats.kicker}</p>
          <h2 id="stats-h" className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{t.stats.h2}</h2>
        </div>
        <div ref={ref} className="mt-12 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
          {t.stats.items.map((item, i) => (
            <StatCard key={item.label} item={item} color={NEON[i % NEON.length]} start={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}
