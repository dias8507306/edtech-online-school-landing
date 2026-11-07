import { Icon } from "./Icons.jsx";
import Tilt from "./Tilt.jsx";
import { LINKS } from "../data.js";
import { useNav } from "../nav.js";

const PRODUCTS = [
  { key: "tests", name: "EDUAPP TESTS", icon: Icon.ListChecks, glow: "#16c060", iconBg: "from-green to-teal", href: "#catalog", live: false },
  { key: "online", name: "EDUAPP ONLINE", icon: Icon.Radio, glow: "#ef4444", iconBg: "from-blue to-violet", href: LINKS.register, live: true },
  { key: "courses", name: "EDUAPP COURSES", icon: Icon.Video, glow: "#6d3fd9", iconBg: "from-violet to-fuchsia-500", href: LINKS.courses, live: false },
];

export default function Products({ t, catalogHref }) {
  const nav = useNav();
  return (
    <section id="products" aria-labelledby="products-h" className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold tracking-[0.2em] text-violet uppercase">{t.products.kicker}</p>
          <h2 id="products-h" className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{t.products.h2}</h2>
          <p className="mt-4 text-lg text-muted">{t.products.lead}</p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {PRODUCTS.map((p, i) => {
            const c = t.products[p.key];
            const ProductIcon = p.icon;
            return (
              <div key={p.key} className="reveal" style={{ transitionDelay: `${i * 0.08}s` }}>
                <Tilt
                  max={7}
                  glow={p.glow}
                  className="flex h-full flex-col rounded-3xl border border-line bg-white p-7 shadow-[0_1px_2px_rgba(30,22,56,0.05),0_24px_50px_-34px_rgba(30,22,56,0.45)] hover:shadow-[0_2px_4px_rgba(30,22,56,0.06),0_36px_70px_-34px_rgba(109,63,217,0.55)]"
                >
                  <div className="relative z-10 flex items-center justify-between">
                    <span className={`grid h-14 w-14 place-items-center rounded-2xl bg-linear-to-br ${p.iconBg} text-white shadow-lg`}>
                      <ProductIcon className="h-7 w-7" />
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-bold text-ink/80">
                      {p.live && (
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-red-400" />
                          <span className="relative h-2 w-2 rounded-full bg-red-500" />
                        </span>
                      )}
                      {c.badge}
                    </span>
                  </div>
                  <p className="relative z-10 mt-6 text-xs font-bold tracking-[0.18em] text-muted">{p.name}</p>
                  <h3 className="relative z-10 mt-2 text-2xl font-extrabold tracking-tight">{c.title}</h3>
                  <p className="relative z-10 mt-3 leading-relaxed text-muted">{c.text}</p>
                  <ul className="relative z-10 mt-5 space-y-2">
                    {c.points.map((pt) => (
                      <li key={pt} className="flex items-center gap-2.5 text-[15px] font-medium text-ink/85">
                        <Icon.Check className="h-4 w-4 shrink-0 text-green" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                  <a href={p.key === "tests" ? catalogHref : p.key === "online" ? nav.register : p.href} className="group/cta relative z-10 mt-auto inline-flex items-center gap-2 pt-7 font-bold text-blue">
                    {c.cta}
                    <Icon.ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/cta:translate-x-1" />
                  </a>
                </Tilt>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
