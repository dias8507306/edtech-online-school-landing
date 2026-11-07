// Экран «Толық аналитика»: итог, плитки, результат по темам, структура ответов, рекомендации, таблица
import { useState } from "react";
import { Icon } from "../components/Icons.jsx";
import { LINKS } from "../data.js";
import { useNav } from "../nav.js";
import { fill, formatDuration } from "../hooks.js";
import { tr } from "./questions.js";
import { STATUS_COLORS, THRESHOLDS, buildRecommendations, categoryName, fullTestUrl, subjectById } from "./report.js";

const LETTERS = ["A", "B", "C", "D"];
const STATUS_ICONS = { strong: Icon.CheckCircle, medium: Icon.AlertTriangle, weak: Icon.XCircle, correct: Icon.CheckCircle, wrong: Icon.XCircle, skipped: Icon.MinusCircle };

// Статус: цветная иконка + подпись тёмным текстом (цвет никогда не один)
export function StatusChip({ status, label, className = "" }) {
  const StatusIcon = STATUS_ICONS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-xs font-bold whitespace-nowrap text-ink ${className}`}>
      <StatusIcon className="h-4 w-4 shrink-0" style={{ color: STATUS_COLORS[status] }} />
      {label}
    </span>
  );
}

function Tooltip({ children, left }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full z-20 mb-2 w-max max-w-[240px] -translate-x-1/2 rounded-lg bg-ink px-3 py-2 text-xs leading-snug font-semibold text-white shadow-xl"
      style={{ left: `${Math.min(84, Math.max(16, left))}%` }}
    >
      {children}
    </span>
  );
}

function Card({ title, note, icon: CardIcon, children, className = "" }) {
  return (
    <section className={`rounded-3xl border border-line bg-white p-5 sm:p-6 ${className}`}>
      {title && (
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h4 className="flex items-center gap-2 text-base font-extrabold text-ink">
            {CardIcon && <CardIcon className="h-5 w-5 text-violet" />}
            {title}
          </h4>
          {note && <p className="text-xs text-muted">{note}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

// Общий результат: крупное число + шкала с порогами 50% и 80%
function ScoreCard({ report, r }) {
  return (
    <Card className="flex flex-col">
      <p className="text-sm font-semibold text-muted">{r.score}</p>
      <p className="mt-1 text-6xl font-extrabold tracking-tight text-ink tabular-nums">{report.percent}%</p>
      <p className="mt-1 text-sm text-muted">{fill(r.correctOf, { c: report.correct, t: report.total })}</p>
      <StatusChip status={report.level} label={r.levels[report.level]} className="mt-4 self-start" />

      <div className="mt-6" aria-hidden>
        <div className="relative h-2.5 bg-surface">
          <div className="h-full rounded-r-[4px]" style={{ width: `${report.percent}%`, background: STATUS_COLORS[report.level] }} />
          {[THRESHOLDS.medium, THRESHOLDS.strong].map((v) => (
            <span key={v} className="absolute -top-1 -bottom-1 w-0.5 bg-ink/25" style={{ left: `${v}%` }} />
          ))}
        </div>
        <div className="relative mt-1.5 h-4 text-[11px] font-semibold text-muted tabular-nums">
          <span className="absolute left-0">0</span>
          {[THRESHOLDS.medium, THRESHOLDS.strong].map((v) => (
            <span key={v} className="absolute -translate-x-1/2" style={{ left: `${v}%` }}>{v}</span>
          ))}
          <span className="absolute right-0">100</span>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-ink/80">{r.levelText[report.level]}</p>

      {/* Сколько тем в каждом статусе */}
      <ul className="mt-auto grid grid-cols-3 gap-2 pt-6">
        {["strong", "medium", "weak"].map((s) => {
          const StatusIcon = STATUS_ICONS[s];
          return (
            <li key={s} className="rounded-2xl bg-surface px-3 py-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                <StatusIcon className="h-4 w-4 shrink-0" style={{ color: STATUS_COLORS[s] }} />
                {r.status[s]}
              </p>
              <p className="mt-1 text-2xl font-extrabold text-ink tabular-nums">{report.topics.filter((tp) => tp.status === s).length}</p>
              <p className="text-[11px] text-muted">{r.topicsWord}</p>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function Tile({ icon: TileIcon, iconColor, label, value, sub }) {
  return (
    <div className="rounded-3xl border border-line bg-white p-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-muted">
        <TileIcon className="h-4 w-4 shrink-0" style={{ color: iconColor }} />
        {label}
      </p>
      <p className="mt-2 text-3xl font-extrabold tracking-tight text-ink tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs leading-snug text-muted">{sub}</p>}
    </div>
  );
}

// Результат по темам: горизонтальные полосы 0–100%, цвет статуса + иконка + подпись, значение на конце полосы
function TopicBars({ report, subject, r, lang }) {
  const [active, setActive] = useState(null);
  return (
    <>
      <ul className="mb-5 flex flex-wrap gap-2" aria-label={r.thresholds}>
        {["strong", "medium", "weak"].map((s) => (
          <li key={s}>
            <StatusChip status={s} label={`${r.status[s]} · ${r.statusRange[s]}`} />
          </li>
        ))}
      </ul>
      <ul className="space-y-5">
        {report.topics.map((tp) => {
          const name = subject.topics.find((x) => x.id === tp.id).name[lang];
          const summary = `${name}: ${fill(r.tipCorrect, { c: tp.correct, t: tp.total })} · ${tp.percent}% · ${r.status[tp.status]}`;
          return (
            <li key={tp.id} className="relative" onMouseEnter={() => setActive(tp.id)} onMouseLeave={() => setActive(null)}>
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 text-sm font-semibold text-ink">{name}</span>
                <StatusChip status={tp.status} label={r.status[tp.status]} />
              </div>
              <div
                tabIndex={0}
                role="img"
                aria-label={summary}
                onFocus={() => setActive(tp.id)}
                onBlur={() => setActive(null)}
                className="relative mt-2 rounded-md py-1 pr-14 focus-visible:outline-2"
              >
                <div className="relative h-5 bg-surface">
                  {[THRESHOLDS.medium, THRESHOLDS.strong].map((v) => (
                    <span key={v} aria-hidden className="absolute inset-y-0 border-l border-dashed border-ink/20" style={{ left: `${v}%` }} />
                  ))}
                  <div className="relative h-full rounded-r-[4px] transition-[width] duration-700" style={{ width: `${tp.percent}%`, background: STATUS_COLORS[tp.status] }} />
                  <span className="absolute top-1/2 -translate-y-1/2 pl-2 text-sm font-bold text-ink tabular-nums" style={{ left: `${tp.percent}%` }}>
                    {tp.percent}%
                  </span>
                </div>
                {active === tp.id && <Tooltip left={tp.percent}>{summary}</Tooltip>}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

// Структура ответов: одна полоса «верно / неверно / пропущено» + легенда с числами
function AnswersBar({ report, r }) {
  const [active, setActive] = useState(null);
  const parts = [
    ["correct", report.correct],
    ["wrong", report.wrong],
    ["skipped", report.skipped],
  ];
  const pct = (n) => Math.round((n / report.total) * 100);
  return (
    <>
      <div className="relative flex h-5 gap-[2px]">
        {parts
          .filter(([, n]) => n > 0)
          .map(([key, n], i, arr) => {
            const label = `${r.legend[key]}: ${n} / ${report.total} (${pct(n)}%)`;
            return (
              <div
                key={key}
                tabIndex={0}
                role="img"
                aria-label={label}
                onMouseEnter={() => setActive(key)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(key)}
                onBlur={() => setActive(null)}
                className={`relative h-full focus-visible:outline-2 ${i === arr.length - 1 ? "rounded-r-[4px]" : ""}`}
                style={{ flexGrow: n, flexBasis: 0, background: STATUS_COLORS[key] }}
              >
                {active === key && <Tooltip left={50}>{label}</Tooltip>}
              </div>
            );
          })}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {parts.map(([key, n]) => {
          const LegendIcon = STATUS_ICONS[key];
          return (
            <li key={key} className="flex items-center gap-2 text-ink">
              <span aria-hidden className="h-3 w-3 rounded-[3px]" style={{ background: STATUS_COLORS[key] }} />
              <LegendIcon className="h-4 w-4" style={{ color: STATUS_COLORS[key] }} />
              <span className="font-semibold">{r.legend[key]}</span>
              <span className="text-muted tabular-nums">
                {n} · {pct(n)}%
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function TopicList({ title, items, empty, subject, r, lang, icon: ListIcon, iconColor }) {
  return (
    <Card>
      <h4 className="flex items-center gap-2 text-base font-extrabold text-ink">
        <ListIcon className="h-5 w-5" style={{ color: iconColor }} />
        {title}
      </h4>
      {items.length ? (
        <ul className="mt-4 space-y-2.5">
          {items.map((tp) => (
            <li key={tp.id} className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3">
              <span className="min-w-0 text-sm font-semibold text-ink">{subject.topics.find((x) => x.id === tp.id).name[lang]}</span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-bold text-ink tabular-nums">{tp.percent}%</span>
                <StatusChip status={tp.status} label={r.status[tp.status]} />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-2xl bg-surface px-4 py-3 text-sm text-muted">{empty}</p>
      )}
    </Card>
  );
}

function AnswersTable({ report, questions, subject, r, lang }) {
  const answerText = (q, i) => (i === null ? r.noAnswer : `${LETTERS[i]}. ${tr(q.a, lang)[i]}`);
  return (
    <details className="group rounded-3xl border border-line bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-3xl p-5 font-extrabold text-ink sm:p-6 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <Icon.Table className="h-5 w-5 text-violet" />
          {r.tableH}
        </span>
        <Icon.ChevronDown className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="overflow-x-auto px-5 pb-5 sm:px-6 sm:pb-6">
        <table className="w-full min-w-[680px] border-collapse text-left text-sm">
          <caption className="sr-only">{r.tableH}</caption>
          <thead>
            <tr className="border-b border-line text-xs tracking-wide text-muted uppercase">
              {[r.th.n, r.th.question, r.th.your, r.th.right, r.th.result, r.th.time].map((h) => (
                <th key={h} scope="col" className="px-2 py-2.5 font-bold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.items.map((item, i) => {
              const q = questions[i];
              return (
                <tr key={item.id} className="border-b border-line/70 align-top last:border-0">
                  <td className="px-2 py-3 font-bold text-ink tabular-nums">{i + 1}</td>
                  <td className="max-w-[260px] px-2 py-3">
                    <p className="text-ink">{tr(q.q, lang)}</p>
                    <p className="mt-1 text-xs text-muted">{subject.topics.find((x) => x.id === item.topic).name[lang]}</p>
                  </td>
                  <td className="px-2 py-3 text-ink">{answerText(q, item.answer)}</td>
                  <td className="px-2 py-3 font-semibold text-ink">{answerText(q, item.right)}</td>
                  <td className="px-2 py-3">
                    <StatusChip status={item.result} label={r.legend[item.result]} />
                  </td>
                  <td className="px-2 py-3 text-ink tabular-nums">
                    {item.timeSec} {r.sec}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export default function Report({ report, questions, choice, d, lang, onRestart, onOther, onLink }) {
  const nav = useNav();
  const r = d.report;
  const subject = subjectById(report.subjectId);
  const recs = buildRecommendations(report, choice, d, lang);
  const weakest = report.weaknesses[0];
  const chips = [d.format.items[choice.format]?.t, subject.name[lang], categoryName(choice, d)].filter(Boolean);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-bold tracking-[0.2em] text-teal uppercase">{r.kicker}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <span key={c} className="rounded-full bg-surface px-3 py-1 text-xs font-bold text-ink/80 ring-1 ring-line">
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <ScoreCard report={report} r={r} />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Tile
            icon={Icon.Target}
            iconColor="#6d3fd9"
            label={r.tiles.errors}
            value={`${report.errorPercent}%`}
            sub={fill(r.tiles.errorsSub, { n: report.wrong + report.skipped, t: report.total, w: report.wrong, s: report.skipped })}
          />
          <Tile icon={Icon.CheckCircle} iconColor={STATUS_COLORS.correct} label={r.tiles.correct} value={`${report.correct} / ${report.total}`} sub={`${report.percent}%`} />
          <Tile icon={Icon.Timer} iconColor="#2f6fe4" label={r.tiles.time} value={formatDuration(report.timeSec)} sub={fill(r.tiles.avg, { s: report.avgSec })} />
          <Tile
            icon={weakest ? Icon.AlertTriangle : Icon.Trophy}
            iconColor={weakest ? STATUS_COLORS[weakest.status] : STATUS_COLORS.strong}
            label={r.tiles.weakest}
            value={weakest ? `${weakest.percent}%` : "—"}
            sub={weakest ? subject.topics.find((x) => x.id === weakest.id).name[lang] : r.tiles.allStrong}
          />
          <Card title={r.answersH} className="sm:col-span-2">
            <AnswersBar report={report} r={r} />
          </Card>
        </div>
      </div>

      <Card title={r.topicsH} note={r.topicsNote} icon={Icon.BarChart}>
        <TopicBars report={report} subject={subject} r={r} lang={lang} />
      </Card>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <TopicList title={r.strengthsH} items={report.strengths} empty={r.noStrengths} subject={subject} r={r} lang={lang} icon={Icon.Trophy} iconColor={STATUS_COLORS.strong} />
        <TopicList title={r.weaknessesH} items={report.weaknesses} empty={r.noWeak} subject={subject} r={r} lang={lang} icon={Icon.Target} iconColor={STATUS_COLORS.weak} />
      </div>

      <Card title={r.recH} icon={Icon.Lightbulb}>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {recs.map((rec) => {
            const RecIcon = Icon[rec.icon];
            return (
              <li key={rec.id} className="flex gap-4 rounded-2xl bg-surface p-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-violet shadow-sm ring-1 ring-line">
                  <RecIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-bold text-ink">
                    {rec.title}
                    {rec.status && <StatusChip status={rec.status} label={r.status[rec.status]} />}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-ink/75">{rec.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <AnswersTable report={report} questions={questions} subject={subject} r={r} lang={lang} />

      <div className="rounded-3xl bg-linear-to-br from-ink to-ink-2 p-6 text-white sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a
            href={fullTestUrl(choice, lang)}
            onClick={() => onLink("full")}
            className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-green to-emerald-500 px-6 py-3.5 font-bold text-white shadow-[0_16px_32px_-16px_rgba(22,192,96,0.9)] transition hover:-translate-y-0.5"
          >
            {r.ctaFull} <Icon.ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
          <a
            href={nav.register}
            onClick={() => onLink("register")}
            className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3.5 font-bold text-ink transition hover:-translate-y-0.5"
          >
            {r.ctaRegister}
          </a>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          <button type="button" onClick={onRestart} className="inline-flex items-center gap-2 text-sm font-semibold text-white/85 hover:text-white">
            <Icon.RotateCcw className="h-4 w-4" /> {r.restart}
          </button>
          <button type="button" onClick={onOther} className="inline-flex items-center gap-2 text-sm font-semibold text-white/85 hover:text-white">
            <Icon.BookOpen className="h-4 w-4" /> {r.other}
          </button>
        </div>
        <p className="mt-5 text-xs leading-relaxed text-white/60">{r.disclaimer}</p>
      </div>
    </div>
  );
}
