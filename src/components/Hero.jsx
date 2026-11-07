import { Icon } from "./Icons.jsx";
import TestPreview from "./TestPreview.jsx";
import { REVIEWS } from "../data.js";

// onStart — открывает окно бесплатной диагностики (без JavaScript ссылка просто ведёт к блоку #diagnostic)
export default function Hero({ t, base, onStart }) {
  return (
    <section id="top" className="relative overflow-hidden pt-28 pb-20 lg:pt-36 lg:pb-28">
      {/* фон: мягкие пятна фирменных цветов + сетка */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-32 h-[520px] w-[520px] animate-blob rounded-full bg-[radial-gradient(closest-side,rgba(34,193,214,0.35),transparent)]" />
        <div className="absolute top-10 right-[-160px] h-[560px] w-[560px] animate-blob rounded-full bg-[radial-gradient(closest-side,rgba(109,63,217,0.28),transparent)]" style={{ animationDelay: "-6s" }} />
        <div className="absolute bottom-[-220px] left-1/3 h-[480px] w-[480px] animate-blob rounded-full bg-[radial-gradient(closest-side,rgba(74,144,226,0.25),transparent)]" style={{ animationDelay: "-12s" }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(30,22,56,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(30,22,56,0.05)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(70%_60%_at_50%_30%,#000,transparent)]" />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div className="animate-rise">
          <p className="inline-flex items-center gap-2 rounded-full border border-teal/30 bg-white/70 px-3.5 py-1.5 text-sm font-semibold text-ink/80 shadow-sm backdrop-blur">
            <Icon.Sparkles className="h-4 w-4 text-teal" />
            {t.hero.badge}
          </p>

          <h1 className="mt-6 text-4xl leading-[1.08] font-extrabold tracking-tight text-balance text-ink sm:text-5xl lg:text-[3.05rem]">
            {t.hero.h1a}{" "}
            <span className="bg-linear-to-r from-teal via-blue to-violet bg-clip-text text-transparent">{t.hero.h1b}</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">{t.hero.sub}</p>

          <ul className="mt-6 space-y-2.5">
            {t.hero.points.map((p) => (
              <li key={p} className="flex items-start gap-3 font-medium text-ink/85">
                <Icon.CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green" />
                {p}
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#diagnostic"
              onClick={onStart}
              data-source="hero"
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-linear-to-r from-green via-emerald-500 to-teal px-7 py-4 text-base font-bold text-white shadow-[0_20px_40px_-16px_rgba(22,192,96,0.85)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_26px_50px_-16px_rgba(22,192,96,1)]"
            >
              <span aria-hidden className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative sm:whitespace-nowrap">{t.hero.cta1}</span>
              <Icon.ArrowRight className="relative h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            <a
              href="#courses"
              className="group inline-flex items-center justify-center gap-3 rounded-2xl border border-line bg-white px-6 py-4 text-base font-bold text-ink transition duration-300 hover:-translate-y-0.5 hover:border-violet/40 hover:shadow-[0_16px_36px_-20px_rgba(109,63,217,0.7)]"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-violet text-white transition-transform duration-300 group-hover:scale-110">
                <Icon.Play className="h-3.5 w-3.5 translate-x-px" />
              </span>
              <span className="sm:whitespace-nowrap">{t.hero.cta2}</span>
            </a>
          </div>

          <div className="mt-9 flex items-center gap-4">
            <div className="flex -space-x-3">
              {REVIEWS.slice(0, 4).map((r) => (
                <img key={r.img} src={`${base}img/${r.img}`} alt="" width="40" height="40" className="h-10 w-10 rounded-full border-2 border-white object-cover shadow" />
              ))}
            </div>
            <p className="text-sm text-muted">
              <b className="text-base text-ink">6&nbsp;480</b> {t.hero.trust}
            </p>
          </div>
        </div>

        {/* Демо-тест: отдельная карточка без фото на фоне */}
        <div className="relative mx-auto w-full max-w-lg animate-rise lg:max-w-[540px]" style={{ animationDelay: "0.12s" }}>
          <div aria-hidden className="absolute -inset-8 rounded-[48px] bg-linear-to-br from-teal/30 via-sky/20 to-violet/30 blur-3xl" />
          <p className="relative mb-3 flex items-start gap-2 text-sm font-semibold text-ink/75">
            <Icon.Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet" />
            {t.preview.lead}
          </p>
          <TestPreview t={t.preview} onStart={onStart} />
        </div>
      </div>
    </section>
  );
}
