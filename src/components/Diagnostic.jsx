import { Icon } from "./Icons.jsx";
import { STATUS_COLORS, statusOf } from "../diagnostic/report.js";
import { StatusChip } from "../diagnostic/Report.jsx";

// Блок «Тегін диагностика» на странице: 4 шага + кнопка, которая открывает окно теста
export default function Diagnostic({ t, onStart }) {
  const s = t.diagSection;
  const status = t.diag.report.status;
  const total = Math.round(s.sampleRows.reduce((sum, [, v]) => sum + v, 0) / s.sampleRows.length);
  const totalStatus = statusOf(total);

  return (
    <section id="diagnostic" aria-labelledby="diagnostic-h" className="relative overflow-hidden py-20 sm:py-24">
      <div aria-hidden className="pointer-events-none absolute top-1/3 -left-40 -z-10 h-[460px] w-[460px] rounded-full bg-[radial-gradient(closest-side,rgba(34,193,214,0.18),transparent)]" />
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
        {/* Пример аналитики: отдельная карточка-отчёт, без фото на фоне */}
        <div className="reveal relative order-2 mx-auto w-full max-w-md lg:order-1 lg:max-w-[500px]">
          <div aria-hidden className="absolute -inset-6 rounded-[44px] bg-linear-to-br from-teal/25 via-sky/15 to-violet/25 blur-3xl" />
          <div className="relative rounded-[28px] border border-line bg-white p-6 shadow-[0_40px_80px_-44px_rgba(30,22,56,0.55)] sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 font-extrabold text-ink">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-soft text-violet"><Icon.BarChart className="h-5 w-5" /></span>
                {s.sample}
              </p>
              <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-bold text-muted ring-1 ring-line">{s.sampleNote}</span>
            </div>

            <div className="mt-6 flex items-center gap-5 rounded-2xl bg-surface p-4">
              <div
                className="grid h-20 w-20 shrink-0 place-items-center rounded-full"
                style={{ background: `conic-gradient(${STATUS_COLORS[totalStatus]} ${total * 3.6}deg, #e6e3f1 0)` }}
                role="img"
                aria-label={`${s.sampleTotal}: ${total}%`}
              >
                <span className="grid h-[64px] w-[64px] place-items-center rounded-full bg-white text-lg font-extrabold text-ink tabular-nums">{total}%</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-muted">{s.sampleTotal}</p>
                <StatusChip status={totalStatus} label={status[totalStatus]} className="mt-1.5" />
              </div>
            </div>

            <ul className="mt-6 space-y-4">
              {s.sampleRows.map(([name, value, st]) => (
                <li key={name}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">{name}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-bold text-ink tabular-nums">{value}%</span>
                      <StatusChip status={st} label={status[st]} className="px-2! py-0.5! text-[11px]!" />
                    </span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface">
                    <div className="h-full rounded-full" style={{ width: `${value}%`, background: STATUS_COLORS[st] }} />
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-6 flex items-start gap-2.5 rounded-2xl border border-teal/25 bg-teal/5 p-3.5 text-sm leading-relaxed text-ink/85">
              <Icon.Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
              {s.sampleTip}
            </p>
          </div>
        </div>

        {/* Текст и шаги (на телефоне — первыми, перед примером аналитики) */}
        <div className="reveal order-1 lg:order-2">
          <p className="text-sm font-bold tracking-[0.2em] text-teal uppercase">{s.kicker}</p>
          <h2 id="diagnostic-h" className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
            {s.h2}
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">{s.lead}</p>

          <ol className="mt-8 space-y-4">
            {s.steps.map((step, i) => (
              <li key={step.t} className="flex gap-4 rounded-3xl border border-line bg-white p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-30px_rgba(30,22,56,0.5)] sm:p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-teal to-violet text-lg font-extrabold text-white shadow-[0_10px_22px_-12px_rgba(109,63,217,0.9)]">
                  {i + 1}
                </span>
                <div>
                  <p className="font-bold text-ink">{step.t}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted">{step.d}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <a
              href="#diagnostic"
              onClick={onStart}
              data-source="section"
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-linear-to-r from-green via-emerald-500 to-teal px-7 py-4 text-base font-bold text-white shadow-[0_20px_40px_-16px_rgba(22,192,96,0.85)] transition duration-300 hover:-translate-y-0.5"
            >
              <span aria-hidden className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative">{s.cta}</span>
              <Icon.ArrowRight className="relative h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            <p className="flex items-center gap-2 text-sm font-semibold text-muted">
              <Icon.Clock className="h-4 w-4 text-teal" /> {s.note}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
