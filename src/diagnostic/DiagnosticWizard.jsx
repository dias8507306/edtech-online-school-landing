// Окно «Тегін сынақ тест»: Формат → Пән → Бағыт → Тест → Толық аналитика
// Состояние сохраняется, пока страница открыта: закрыл окно и открыл снова — продолжаешь с того же места.
import { useEffect, useRef, useState } from "react";
import { Icon } from "../components/Icons.jsx";
import { fill, formatDuration, prefersReducedMotion, useDialog, useScrollLock } from "../hooks.js";
import { CATEGORIES, FORMATS, GRADE_OPTIONS, SUBJECTS, tr } from "./questions.js";
import { fetchQuestions, submitResult, track } from "./api.js";
import { buildReport } from "./report.js";
import Report from "./Report.jsx";

const LETTERS = ["A", "B", "C", "D"];
const STEP = { format: 0, subject: 1, category: 2, test: 3, report: 4 };
const EMPTY_CHOICE = { format: null, subject: null, category: null, grade: null };

function Stepper({ steps, current, label }) {
  return (
    <ol aria-label={label} className="flex items-center gap-1.5 sm:gap-2">
      {steps.map((name, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        return (
          <li
            key={name}
            aria-current={state === "current" ? "step" : undefined}
            className={`flex items-center gap-1.5 sm:gap-2 ${i < steps.length - 1 ? (state === "current" ? "min-w-fit flex-1" : "min-w-0 flex-1") : ""}`}
          >
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors duration-300 ${
                state === "done" ? "bg-teal text-white" : state === "current" ? "bg-linear-to-br from-teal to-violet text-white shadow-[0_6px_16px_-6px_rgba(109,63,217,0.8)]" : "bg-surface text-muted ring-1 ring-line"
              }`}
            >
              {state === "done" ? <Icon.Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className={`text-sm font-semibold ${state === "current" ? "shrink-0 whitespace-nowrap text-ink" : "hidden truncate text-muted md:inline"}`}>{name}</span>
            {i < steps.length - 1 && (
              <span aria-hidden className="h-0.5 min-w-3 flex-1 overflow-hidden rounded-full bg-line">
                <span className="block h-full bg-linear-to-r from-teal to-violet transition-[width] duration-500" style={{ width: i < current ? "100%" : "0%" }} />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

// Большая карточка выбора (формат, предмет, направление)
function ChoiceCard({ selected, onClick, icon: CardIcon, image, title, desc }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`group relative flex w-full items-center gap-4 rounded-3xl border-2 p-4 text-left transition duration-300 sm:p-5 ${
        selected
          ? "border-teal bg-teal-soft/60 shadow-[0_18px_40px_-26px_rgba(34,193,214,0.9)]"
          : "border-line bg-white hover:-translate-y-0.5 hover:border-teal/50 hover:shadow-[0_18px_40px_-28px_rgba(30,22,56,0.45)]"
      }`}
    >
      {image ? (
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white p-2 shadow-sm ring-1 ring-line">
          <img src={image} alt="" className="max-h-full max-w-full object-contain" />
        </span>
      ) : (
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-teal to-blue text-white shadow-[0_10px_22px_-12px_rgba(47,111,228,0.9)]">
          <CardIcon className="h-6 w-6" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-lg leading-tight font-extrabold text-ink">{title}</span>
        {desc && <span className="mt-1 block text-sm leading-snug text-muted">{desc}</span>}
      </span>
      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition ${selected ? "border-teal bg-teal text-white" : "border-line bg-white"}`}>
        {selected && <Icon.Check className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}

export default function DiagnosticWizard({ open, onClose, t, lang, base }) {
  const d = t.diag;
  const [step, setStep] = useState(STEP.format);
  const [choice, setChoice] = useState(EMPTY_CHOICE);
  const [questions, setQuestions] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [times, setTimes] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [report, setReport] = useState(null);
  const questionStart = useRef(0);
  const dialogRef = useRef(null);
  const headingRef = useRef(null);
  const bodyRef = useRef(null);
  const gradeRef = useRef(null);
  const timers = useRef([]);

  useScrollLock(open);
  useDialog(dialogRef, open, onClose);

  // Новый шаг или вопрос: прокрутка вверх и фокус на заголовок (удобно для клавиатуры и экранного диктора)
  useEffect(() => {
    if (!open) return;
    bodyRef.current?.scrollTo(0, 0);
    headingRef.current?.focus({ preventScroll: true });
  }, [open, step, index, questions]);

  // Секундомер идёт только во время теста и только пока окно открыто
  useEffect(() => {
    if (!open || step !== STEP.test || !questions?.length) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [open, step, questions]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Выбрали «3–10 сынып» — показываем выбор класса (прокручиваем только область окна)
  useEffect(() => {
    if (!open || choice.category !== "grades" || !gradeRef.current || !bodyRef.current) return;
    const body = bodyRef.current;
    const top = gradeRef.current.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop - 24;
    body.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [open, choice.category]);

  // Небольшая пауза перед автопереходом, чтобы было видно выбранную карточку
  const later = (fn) => timers.current.push(setTimeout(fn, prefersReducedMotion() ? 0 : 280));

  async function startTest(nextChoice) {
    setStep(STEP.test);
    setQuestions(null);
    setLoadError(false);
    setIndex(0);
    setPicked(null);
    setAnswers([]);
    setTimes([]);
    setElapsed(0);
    setReport(null);
    questionStart.current = 0;
    track("diag_test_start", { format: nextChoice.format, subject: nextChoice.subject, category: nextChoice.category, grade: nextChoice.grade });
    try {
      const list = await fetchQuestions({ ...nextChoice, lang });
      if (!list?.length) throw new Error("empty");
      setQuestions(list);
    } catch {
      setLoadError(true);
    }
  }

  function choose(key, value) {
    const next = { ...choice, [key]: value };
    if (key === "category" && value !== "grades") next.grade = null;
    setChoice(next);
    track(`diag_${key}`, { value });
    if (key === "format") later(() => setStep(STEP.subject));
    if (key === "subject") later(() => setStep(STEP.category));
    if ((key === "category" && value !== "grades") || key === "grade") later(() => startTest(next));
  }

  function nextQuestion(skip = false) {
    const answer = skip ? null : picked;
    const spent = Math.max(1, elapsed - questionStart.current);
    questionStart.current = elapsed;
    const nextAnswers = [...answers, answer];
    const nextTimes = [...times, spent];
    setAnswers(nextAnswers);
    setTimes(nextTimes);
    setPicked(null);
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      return;
    }
    const result = buildReport({ subjectId: choice.subject, questions, answers: nextAnswers, times: nextTimes });
    setReport(result);
    setStep(STEP.report);
    track("diag_complete", { subject: choice.subject, category: choice.category, percent: result.percent });
    submitResult({
      ...choice,
      lang,
      answers: result.items.map(({ id, answer: a, timeSec }) => ({ questionId: id, answer: a, timeSec })),
      percent: result.percent,
      topics: result.topics,
      finishedAt: new Date().toISOString(),
    });
  }

  // Клавиши 1–4 выбирают ответ
  function onKeyDown(e) {
    if (step !== STEP.test || !questions || e.altKey || e.ctrlKey || e.metaKey) return;
    const n = Number(e.key);
    if (n >= 1 && n <= 4) {
      e.preventDefault();
      setPicked(n - 1);
    }
  }

  if (!open) return null;

  const canNext =
    (step === STEP.format && choice.format) ||
    (step === STEP.subject && choice.subject) ||
    (step === STEP.category && choice.category && (choice.category !== "grades" || choice.grade));

  function goNext() {
    if (step === STEP.category) startTest(choice);
    else setStep(step + 1);
  }

  function goBack() {
    if (step === STEP.test) setStep(STEP.category);
    else if (step > 0) setStep(step - 1);
  }

  const subject = SUBJECTS.find((s) => s.id === choice.subject);
  const q = questions?.[index];
  const isLast = questions && index === questions.length - 1;
  const showAside = step < STEP.test;

  const headings = [
    [d.format.h, d.format.sub],
    [d.subject.h, d.subject.sub],
    [d.category.h, d.category.sub],
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-stretch justify-center bg-ink/70 backdrop-blur-sm sm:items-center sm:p-4" lang={lang}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="diag-title"
        onKeyDown={onKeyDown}
        className="relative flex h-full w-full max-w-5xl animate-rise flex-col overflow-hidden bg-white shadow-2xl sm:h-[min(780px,94vh)] sm:rounded-[28px]"
      >
        {/* Шапка окна */}
        <div className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-6">
          <img src={`${base}img/eduapp-logo.svg`} alt="EDUAPP" width="185" height="48" className="hidden h-7 w-auto sm:block" />
          <span aria-hidden className="hidden h-6 w-px bg-line sm:block" />
          <p id="diag-title" className="min-w-0 truncate font-bold text-ink">
            {d.title}
          </p>
          <button type="button" onClick={onClose} aria-label={d.close} className="ml-auto grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ink transition hover:bg-surface">
            <Icon.X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* Фото и «что получишь» — только на первых шагах и на широком экране */}
          {showAside && (
            <aside className="relative hidden w-[300px] shrink-0 overflow-hidden lg:block">
              <img src={`${base}img/photo-student-test.svg`} alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_30%]" />
              <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/55 to-ink/5" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <p className="text-lg font-extrabold">{d.asideTitle}</p>
                <ul className="mt-4 space-y-2.5">
                  {d.asidePoints.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-sm leading-snug text-white/90">
                      <Icon.CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                      {p}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-xs font-semibold text-white/65">{d.asideNote}</p>
              </div>
            </aside>
          )}

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="border-b border-line px-4 py-3 sm:px-6">
              <Stepper steps={d.steps} current={step} label={d.stepsLabel} />
            </div>

            <div ref={bodyRef} className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain bg-surface/60 px-4 py-6 sm:px-8 sm:py-8">
              {/* Шаги 1–3: выбор */}
              {step < STEP.test && (
                <div className="mx-auto max-w-2xl">
                  <h3 ref={headingRef} tabIndex={-1} className="text-2xl font-extrabold tracking-tight text-ink outline-none sm:text-3xl">
                    {headings[step][0]}
                  </h3>
                  <p className="mt-2 text-muted">{headings[step][1]}</p>

                  {step === STEP.format && (
                    <div className="mt-6 grid grid-cols-1 gap-4">
                      {FORMATS.map((f) => (
                        <ChoiceCard
                          key={f.id}
                          selected={choice.format === f.id}
                          onClick={() => choose("format", f.id)}
                          icon={Icon[f.icon]}
                          title={d.format.items[f.id].t}
                          desc={d.format.items[f.id].d}
                        />
                      ))}
                    </div>
                  )}

                  {step === STEP.subject && (
                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {SUBJECTS.map((s) => (
                        <ChoiceCard
                          key={s.id}
                          selected={choice.subject === s.id}
                          onClick={() => choose("subject", s.id)}
                          icon={Icon[s.icon]}
                          title={s.name[lang]}
                          desc={s.topics.map((tp) => tp.name[lang]).join(", ")}
                        />
                      ))}
                    </div>
                  )}

                  {step === STEP.category && (
                    <>
                      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {CATEGORIES.map((c) => (
                          <ChoiceCard
                            key={c.id}
                            selected={choice.category === c.id}
                            onClick={() => choose("category", c.id)}
                            icon={Icon.GraduationCap}
                            image={c.logo ? `${base}img/${c.logo}` : null}
                            title={d.category.items[c.id].t}
                            desc={d.category.items[c.id].d}
                          />
                        ))}
                      </div>
                      {choice.category === "grades" && (
                        <div ref={gradeRef} className="mt-6 rounded-3xl border border-line bg-white p-5">
                          <p id="grade-pick" className="text-sm font-bold text-ink">
                            {d.category.gradePick}
                          </p>
                          <div role="group" aria-labelledby="grade-pick" className="mt-3 flex flex-wrap gap-2.5">
                            {GRADE_OPTIONS.map((g) => (
                              <button
                                key={g}
                                type="button"
                                aria-pressed={choice.grade === g}
                                onClick={() => choose("grade", g)}
                                className={`inline-flex items-center gap-2 rounded-2xl border-2 px-4 py-2.5 font-bold transition ${
                                  choice.grade === g ? "border-teal bg-teal text-white" : "border-line bg-white text-ink hover:border-teal/60"
                                }`}
                              >
                                {g} <span className="text-sm font-semibold opacity-80">{d.category.grade}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Шаг 4: тест */}
              {step === STEP.test && (
                <div className="mx-auto max-w-2xl">
                  {loadError && (
                    <div className="rounded-3xl border border-line bg-white p-8 text-center">
                      <p ref={headingRef} tabIndex={-1} className="font-bold text-ink outline-none">
                        {d.test.error}
                      </p>
                      <button type="button" onClick={() => startTest(choice)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 font-bold text-white hover:bg-blue">
                        <Icon.RotateCcw className="h-4 w-4" /> {d.test.retry}
                      </button>
                    </div>
                  )}
                  {!loadError && !q && (
                    <p ref={headingRef} tabIndex={-1} className="py-16 text-center font-semibold text-muted outline-none" aria-live="polite">
                      {d.test.loading}
                    </p>
                  )}
                  {!loadError && q && (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-violet-soft px-3 py-1 text-xs font-bold text-violet">{subject?.name[lang]}</span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-ink/80 ring-1 ring-line">
                            {choice.category === "grades" ? fill(d.category.gradeName, { g: choice.grade }) : d.category.items[choice.category]?.t}
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-2 rounded-2xl bg-ink px-3 py-1.5 text-white" title={d.test.time}>
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-teal" />
                            <span className="relative h-2.5 w-2.5 rounded-full bg-teal" />
                          </span>
                          <Icon.Clock className="h-4 w-4 opacity-70" />
                          <span className="font-mono text-sm font-semibold tabular-nums">{formatDuration(elapsed)}</span>
                        </span>
                      </div>

                      <div className="mt-5 flex items-center justify-between text-xs font-semibold text-muted">
                        <span>
                          {d.test.question} {index + 1} / {questions.length}
                        </span>
                        <span>
                          {d.test.topic}: {subject?.topics.find((tp) => tp.id === q.topic)?.name[lang]}
                        </span>
                      </div>
                      <div
                        className="mt-2 h-2 overflow-hidden rounded-full bg-white ring-1 ring-line"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={questions.length}
                        aria-valuenow={index + 1}
                        aria-label={`${d.test.question} ${index + 1} / ${questions.length}`}
                      >
                        <div className="h-full rounded-full bg-linear-to-r from-teal via-sky to-violet transition-[width] duration-500" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
                      </div>

                      <div className="mt-6 rounded-3xl border border-line bg-white p-5 shadow-[0_24px_50px_-40px_rgba(30,22,56,0.6)] sm:p-7">
                        <h3 ref={headingRef} tabIndex={-1} id="diag-question" className="text-xl leading-snug font-bold text-ink outline-none sm:text-2xl">
                          {tr(q.q, lang)}
                        </h3>
                        <div role="radiogroup" aria-labelledby="diag-question" className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {tr(q.a, lang).map((answer, i) => {
                            const selected = picked === i;
                            return (
                              <button
                                key={answer}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                onClick={() => setPicked(i)}
                                className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left font-semibold transition duration-200 ${
                                  selected ? "border-blue bg-blue/5 text-ink shadow-[0_12px_26px_-18px_rgba(47,111,228,0.9)]" : "border-line bg-white text-ink hover:-translate-y-0.5 hover:border-teal"
                                }`}
                              >
                                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm font-bold transition ${selected ? "bg-blue text-white" : "bg-surface text-ink/70"}`}>
                                  {LETTERS[i]}
                                </span>
                                {answer}
                              </button>
                            );
                          })}
                        </div>
                        <p className="mt-5 text-xs text-muted">{d.test.hint}</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Шаг 5: аналитика */}
              {step === STEP.report && report && (
                <div className="mx-auto max-w-4xl">
                  <h3 ref={headingRef} tabIndex={-1} className="sr-only">
                    {d.report.h}
                  </h3>
                  <Report
                    report={report}
                    questions={questions}
                    choice={choice}
                    d={d}
                    lang={lang}
                    onRestart={() => startTest(choice)}
                    onOther={() => {
                      setChoice({ ...choice, subject: null });
                      setStep(STEP.subject);
                    }}
                    onLink={(cta) => track("diag_cta", { cta, subject: choice.subject, category: choice.category })}
                  />
                </div>
              )}
            </div>

            {/* Нижняя панель кнопок */}
            {step < STEP.report && (
              <div className="flex items-center gap-3 border-t border-line bg-white px-4 py-3 sm:px-6">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={step === STEP.format}
                  aria-label={d.back}
                  className="inline-flex h-11 items-center gap-2 rounded-xl px-3 font-semibold whitespace-nowrap text-ink/80 transition hover:bg-surface disabled:invisible"
                >
                  <Icon.ArrowLeft className="h-4 w-4" /> <span className={step === STEP.test ? "hidden sm:inline" : ""}>{d.back}</span>
                </button>
                <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
                  {step === STEP.test && q && (
                    <>
                      <button
                        type="button"
                        onClick={() => nextQuestion(true)}
                        className="inline-flex h-11 items-center rounded-xl px-3 font-semibold whitespace-nowrap text-muted transition hover:bg-surface hover:text-ink sm:px-4"
                      >
                        {d.test.skip}
                      </button>
                      <button
                        type="button"
                        onClick={() => nextQuestion(false)}
                        disabled={picked === null}
                        className="group inline-flex h-11 items-center gap-2 rounded-xl bg-linear-to-r from-green to-emerald-500 px-4 font-bold whitespace-nowrap text-white shadow-[0_12px_26px_-14px_rgba(22,192,96,0.95)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-40 disabled:shadow-none sm:px-5"
                      >
                        {isLast ? d.test.finish : d.test.next}
                        <Icon.ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </button>
                    </>
                  )}
                  {step < STEP.test && (
                    <button
                      type="button"
                      onClick={goNext}
                      disabled={!canNext}
                      className="group inline-flex h-11 items-center gap-2 rounded-xl bg-ink px-5 font-bold text-white transition hover:-translate-y-0.5 hover:bg-blue disabled:translate-y-0 disabled:opacity-35"
                    >
                      {d.next} <Icon.ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
