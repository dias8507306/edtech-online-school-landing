import { useEffect, useState } from "react";
import { Icon } from "./Icons.jsx";
import { STATUS_COLORS, statusOf } from "../diagnostic/report.js";

const LETTERS = ["A", "B", "C", "D"];
const LIMIT_SECONDS = 15 * 60; // 15 минут на демо-тест (вопросы уровня НЗМ / БИЛ / ҰБТ)

const formatTime = (s) => [Math.floor(s / 60), s % 60].map((n) => String(n).padStart(2, "0")).join(":");

/**
 * Демо-тест в первом экране: выбор класса (3–11), 10 вопросов уровня своего класса, таймер 15 минут, в конце — результат.
 * Таймер запускается с первого ответа и останавливается на результате (раньше тест шёл по кругу бесконечно).
 * Смена класса начинает тест заново с вопросами этого класса. onStart — открыть полную бесплатную диагностику.
 */
export default function TestPreview({ t, onStart }) {
  const [gradeId, setGradeId] = useState(t.defaultGrade);
  const bank = t.grades.find((g) => g.id === gradeId) ?? t.grades[0];
  const questions = bank.questions;
  const total = questions.length;
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(LIMIT_SECONDS);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [timeUp, setTimeUp] = useState(false);

  useEffect(() => {
    if (!started || done) return undefined;
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [started, done]);

  useEffect(() => {
    if (started && !done && left === 0) {
      setTimeUp(true);
      setDone(true);
    }
  }, [left, started, done]);

  const q = questions[index];
  const number = index + 1;
  const answered = picked !== null;
  const isCorrect = answered && picked === q.c;
  const isLast = number === total;

  function pick(i) {
    if (answered || done) return;
    setStarted(true);
    setPicked(i);
    if (i === q.c) setScore((s) => s + 1);
  }

  function next() {
    if (isLast) {
      setDone(true);
      return;
    }
    setPicked(null);
    setIndex((i) => i + 1);
  }

  function restart() {
    setIndex(0);
    setPicked(null);
    setScore(0);
    setLeft(LIMIT_SECONDS);
    setStarted(false);
    setDone(false);
    setTimeUp(false);
  }

  function pickGrade(id) {
    if (id === gradeId) return;
    restart();
    setGradeId(id);
  }

  function optionClass(i) {
    if (!answered) return "border-line bg-white hover:-translate-y-0.5 hover:border-teal hover:shadow-[0_10px_24px_-16px_rgba(34,193,214,0.9)]";
    if (i === q.c) return "border-green bg-green/10 text-green-dark";
    if (i === picked) return "border-red-400 bg-red-50 text-red-600";
    return "border-line bg-white opacity-60";
  }

  const progress = done ? 100 : ((index + (answered ? 1 : 0)) / total) * 100;
  const percent = Math.round((score / total) * 100);
  const level = statusOf(percent);

  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      <div data-demo-test className="relative flex min-h-[500px] flex-col rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_40px_80px_-40px_rgba(30,22,56,0.55)] backdrop-blur-xl sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex rounded-full bg-violet-soft px-2.5 py-1 text-[11px] font-bold tracking-wide text-violet uppercase">{t.demo}</span>
            <p className="mt-1.5 truncate text-sm font-semibold text-ink/80">{bank.subject}</p>
          </div>
          <div className={`flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2 ${left <= 60 && started && !done ? "bg-red-600 text-white" : "bg-ink text-white"}`} title={t.timer}>
            {started && !done && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inset-0 animate-pulse-ring rounded-full bg-red-400" />
                <span className="relative h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>
            )}
            <Icon.Clock className="h-4 w-4 opacity-70" />
            <span className="font-mono text-sm font-semibold tabular-nums">{formatTime(left)}</span>
          </div>
        </div>

        {/* Выбор класса 3–11: у каждого класса свои 10 вопросов */}
        <div className="mt-4 flex items-center gap-2">
          <span className="shrink-0 text-xs font-bold text-muted">{t.gradeL}:</span>
          <div role="radiogroup" aria-label={t.gradeL} className="grid flex-1 grid-cols-9 gap-0.5 rounded-2xl bg-surface p-1 ring-1 ring-line sm:gap-1">
            {t.grades.map((g) => {
              const on = g.id === bank.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => pickGrade(g.id)}
                  className={`rounded-xl py-1.5 text-sm font-bold tabular-nums transition duration-300 ${
                    on ? "bg-white text-violet shadow-[0_6px_16px_-8px_rgba(109,63,217,0.6)] ring-1 ring-violet/20" : "text-ink/65 hover:text-ink"
                  }`}
                >
                  {g.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between text-xs font-semibold text-muted">
          <span>{done ? t.finished : `${t.question} ${number} / ${total}`}</span>
          <span className="text-green-dark">{t.score}: {score}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-linear-to-r from-teal via-sky to-violet bg-[length:200%_100%] animate-shimmer transition-[width] duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>

        {!done ? (
          <>
            <p className="mt-5 min-h-[3.5rem] text-lg font-bold leading-snug text-ink">{q.q}</p>

            <div className="mt-4 grid grid-cols-2 gap-3" role="group" aria-label={t.pick}>
              {q.a.map((answer, i) => (
                <button
                  key={`${index}-${answer}`}
                  type="button"
                  onClick={() => pick(i)}
                  disabled={answered}
                  className={`flex items-center gap-3 rounded-2xl border-2 px-3 py-3 text-left font-semibold transition-all duration-300 ${optionClass(i)}`}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-surface text-sm font-bold text-ink/70">{LETTERS[i]}</span>
                  {answer}
                </button>
              ))}
            </div>

            <div className="mt-auto flex min-h-11 items-center justify-between gap-3 pt-5">
              <p aria-live="polite" className={`text-sm font-semibold ${isCorrect ? "text-green-dark" : "text-red-600"}`}>
                {answered && (isCorrect ? t.correct : `${t.wrong} ${LETTERS[q.c]}`)}
              </p>
              <button
                type="button"
                onClick={next}
                className="group inline-flex shrink-0 items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-blue disabled:pointer-events-none disabled:opacity-40"
                disabled={!answered}
              >
                {isLast ? t.finish : t.next}
                <Icon.ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </>
        ) : (
          <div className="mt-6 flex flex-1 flex-col" aria-live="polite">
            <p className="text-sm font-semibold text-muted">{timeUp ? t.timeUp : t.resultTitle}</p>
            <div className="mt-2 flex items-end gap-3">
              <p className="text-5xl font-extrabold tracking-tight text-ink tabular-nums">
                {score}
                <span className="text-2xl text-muted"> / {total}</span>
              </p>
              <span className="mb-2 rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: STATUS_COLORS[level], color: level === "medium" ? "#1e1638" : "#fff" }}>
                {percent}% · {t.levels[level]}
              </span>
            </div>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-surface">
              <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${percent}%`, background: STATUS_COLORS[level] }} />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink/80">{t.advice[level]}</p>

            <div className="mt-auto flex flex-col gap-2.5 pt-6 sm:flex-row">
              <a
                href="#diagnostic"
                onClick={onStart}
                data-source="demo-result"
                className="group inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-green via-emerald-500 to-teal px-4 py-3 text-sm font-bold text-white shadow-[0_14px_30px_-14px_rgba(22,192,96,0.9)] transition hover:-translate-y-0.5"
              >
                {t.fullCta}
                <Icon.ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <button
                type="button"
                onClick={restart}
                className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-4 py-3 text-sm font-bold text-ink transition hover:-translate-y-0.5 hover:border-violet/40"
              >
                {t.restart}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
