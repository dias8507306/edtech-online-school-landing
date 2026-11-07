import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./Icons.jsx";
import { DIRECTIONS } from "../data.js";
import { fill, formatNumber, isPlainClick, prefersReducedMotion } from "../hooks.js";
import { CATALOG_PACKAGES, TEST_URL, countTests, makeHash, matchTest, parseHash, plural, splitTitle, subjectName } from "../testsCatalog.js";

const LOGOS = Object.fromEntries(DIRECTIONS.map((d) => [d.key, d.logo]));
const n = (num, forms) => `${formatNumber(num)} ${plural(num, forms)}`;

/**
 * Страница «Тесттер каталогы»: сыныптар (қазақ / орыс) → бағыт → бөлім → тесттер.
 * Фильтры (пән, сынып, іздеу) работают сразу, без кнопки «Іздеу». Состояние в адресе: #kk/ubt, #kk/ubt/112.
 * data — снимок каталога (одинаковый при пререндере и в браузере, иначе гидратация разойдётся).
 */
export default function TestsPage({ t, lang, base, homeHref, data, onStart }) {
  const s = t.testsPage;
  // Вкладка по умолчанию — первая, где у этих классов есть хотя бы 5 тестов (у русских классов в ЕНТ сейчас один тест).
  // Считается из тех же данных, что и при пререндере, поэтому HTML и React совпадают.
  const defaultPk = (cls) => CATALOG_PACKAGES.find((k) => countTests(data.packages[k]?.[cls]) >= 5) ?? "ubt";
  const [st, setSt] = useState({ cls: lang, pk: defaultPk(lang), section: null, subject: 0, grade: 0, q: "" });
  const clsChosen = useRef(false); // пока классы не выбраны вручную, они следуют за языком сайта
  const listRef = useRef(null);

  // Состояние из адреса (#kk/nis/45) — при открытии и по кнопкам «Назад / Вперёд»
  useEffect(() => {
    const fromHash = () => {
      const h = parseHash(window.location.hash);
      if (!h) return;
      clsChosen.current = true;
      setSt((prev) => {
        const same = h.cls === prev.cls && h.pk === prev.pk;
        return { ...prev, ...h, subject: same ? prev.subject : 0, grade: h.grade || (same ? prev.grade : 0), q: h.section ? "" : prev.q };
      });
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    window.addEventListener("popstate", fromHash);
    return () => {
      window.removeEventListener("hashchange", fromHash);
      window.removeEventListener("popstate", fromHash);
    };
  }, []);

  // Сменили язык сайта — классы следуют за ним, если их не выбирали вручную
  useEffect(() => {
    if (!clsChosen.current) setSt((prev) => (prev.cls === lang ? prev : { ...prev, cls: lang, pk: defaultPk(lang), section: null, subject: 0, grade: 0 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const pkg = data.packages[st.pk]?.[st.cls];
  const filters = { subject: st.subject, grade: st.grade, q: st.q };
  const filtered = Boolean(st.subject || st.grade || st.q);

  const view = useMemo(() => {
    if (!pkg) return { kind: "sections", items: [], total: 0 };
    if (st.section) {
      const sec = pkg.sections.find((x) => x.id === st.section);
      if (sec) {
        const tests = sec.tests.filter((x) => matchTest(x, filters));
        return { kind: "section", sec, tests, total: tests.length };
      }
    }
    if (st.q) {
      const tests = pkg.sections.flatMap((sec) => sec.tests.filter((x) => matchTest(x, filters)).map((x) => ({ ...x, sectionTitle: sec.title })));
      return { kind: "search", tests, total: tests.length };
    }
    const items = pkg.sections
      .map((sec) => {
        const list = sec.tests.filter((x) => matchTest(x, filters));
        return { sec, count: list.length, free: list.filter((x) => x.price === 0).length };
      })
      .filter((x) => x.count);
    return { kind: "sections", items, total: items.reduce((sum, x) => sum + x.count, 0) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pkg, st.section, st.subject, st.grade, st.q]);

  const totals = useMemo(() => {
    const all = Object.values(data.packages).flatMap((p) => Object.values(p));
    return { sections: all.reduce((sum, p) => sum + p.sections.length, 0), tests: all.reduce((sum, p) => sum + countTests(p), 0) };
  }, [data]);

  function update(patch, { hash = true, push = false } = {}) {
    const next = { ...st, ...patch };
    setSt(next);
    if (hash && /^https?:$|^file:$/.test(window.location.protocol)) {
      const h = makeHash(next);
      if (window.location.hash !== h) history[push ? "pushState" : "replaceState"](history.state, "", h);
    }
  }

  function scrollToList() {
    const el = listRef.current;
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 96;
    if (Math.abs(window.scrollY - y) > 40) window.scrollTo({ top: y, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }

  const pickCls = (cls) => { clsChosen.current = true; update({ cls, section: null, subject: 0, grade: 0, q: "" }); };
  const pickPk = (pk) => { clsChosen.current = true; update({ pk, section: null, subject: 0, grade: 0, q: "" }); };
  const openSection = (e, id) => {
    if (!isPlainClick(e)) return;
    e.preventDefault();
    clsChosen.current = true;
    update({ section: id, q: "" }, { push: true });
    requestAnimationFrame(scrollToList);
  };
  const back = (e) => {
    if (e && !isPlainClick(e)) return;
    e?.preventDefault();
    update({ section: null }, { push: false });
    requestAnimationFrame(scrollToList);
  };
  const reset = () => update({ subject: 0, grade: 0, q: "" }, { hash: false });

  const clsLabel = st.cls === "kk" ? s.clsKk : s.clsRu;
  // Подпись раздела не повторяем, если она совпадает с названием вкладки («НЗМ» во вкладке НЗМ)
  const subOf = (title) => { const sub = splitTitle(title).sub; return sub && sub.replace(/\s/g, "").toLowerCase() !== s.pk[st.pk].toLowerCase() ? sub : ""; };
  const subjects = pkg?.subjects ?? [];
  const grades = pkg?.grades ?? [];

  return (
    <>
      {/* Шапка страницы */}
      <section className="relative overflow-hidden pt-28 pb-10 sm:pb-14 lg:pt-36">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 -left-32 h-[480px] w-[480px] animate-blob rounded-full bg-[radial-gradient(closest-side,rgba(34,193,214,0.32),transparent)]" />
          <div className="absolute top-0 right-[-160px] h-[520px] w-[520px] animate-blob rounded-full bg-[radial-gradient(closest-side,rgba(109,63,217,0.25),transparent)]" style={{ animationDelay: "-6s" }} />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(30,22,56,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(30,22,56,0.05)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(70%_60%_at_50%_20%,#000,transparent)]" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <nav aria-label={s.crumbL} className="animate-rise text-sm font-semibold text-muted">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li><a href={homeHref} className="transition hover:text-blue">{s.crumbHome}</a></li>
              <li aria-hidden><Icon.ChevronRight className="h-4 w-4" /></li>
              <li aria-current="page" className="text-ink">{s.crumb}</li>
            </ol>
          </nav>
          <h1 className="mt-4 animate-rise text-4xl font-extrabold tracking-tight text-balance text-ink sm:text-5xl">
            {s.h1a} <span className="bg-linear-to-r from-teal via-blue to-violet bg-clip-text text-transparent">{s.h1b}</span>
          </h1>
          <p className="mt-4 max-w-2xl animate-rise text-lg leading-relaxed text-muted">{s.lead}</p>
          <ul className="mt-6 flex animate-rise flex-wrap gap-2.5 text-sm font-semibold text-ink/80">
            <li className="inline-flex items-center gap-2 rounded-full border border-line bg-white/80 px-3.5 py-2 shadow-sm"><Icon.BookOpen className="h-4 w-4 text-violet" /> {n(totals.sections, s.sectionForms)}</li>
            <li className="inline-flex items-center gap-2 rounded-full border border-line bg-white/80 px-3.5 py-2 shadow-sm"><Icon.ListChecks className="h-4 w-4 text-teal" /> {n(totals.tests, s.testForms)}</li>
            <li className="inline-flex items-center gap-2 rounded-full border border-line bg-white/80 px-3.5 py-2 shadow-sm"><Icon.Laptop className="h-4 w-4 text-green" /> {s.statOnline}</li>
          </ul>
        </div>
      </section>

      <section aria-labelledby="ts-h" className="pb-20 sm:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Панель выбора */}
          <div className="rounded-3xl border border-line bg-white p-4 shadow-[0_30px_60px_-44px_rgba(30,22,56,0.5)] sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div role="radiogroup" aria-label={s.cls} className="relative grid grid-cols-2 self-start rounded-2xl bg-surface p-1.5 ring-1 ring-line">
                <span
                  aria-hidden
                  className={`absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] rounded-xl bg-linear-to-r from-green to-emerald-500 shadow-[0_10px_24px_-12px_rgba(22,192,96,0.9)] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${st.cls === "ru" ? "translate-x-full" : "translate-x-0"}`}
                />
                {[["kk", s.clsKk], ["ru", s.clsRu]].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={st.cls === key}
                    onClick={() => pickCls(key)}
                    className={`relative z-10 px-4 py-2.5 text-sm font-bold whitespace-nowrap transition-colors duration-300 sm:px-6 ${st.cls === key ? "text-white" : "text-ink/70 hover:text-ink"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div role="search" className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] lg:min-w-[560px] lg:grid-cols-[1fr_200px_auto]">
                <label className="relative block">
                  <span className="sr-only">{s.searchL}</span>
                  <Icon.Search className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-muted" />
                  <input
                    type="search"
                    value={st.q}
                    onChange={(e) => update({ q: e.target.value, section: e.target.value.trim() ? null : st.section }, { hash: !!e.target.value.trim() && !!st.section })}
                    placeholder={s.searchPh}
                    autoComplete="off"
                    className="h-12 w-full rounded-2xl border border-line bg-surface pr-4 pl-11 text-[15px] font-medium text-ink transition outline-none placeholder:text-muted/80 focus:border-teal focus:bg-white focus:ring-4 focus:ring-teal/15"
                  />
                </label>
                <label className="block">
                  <span className="sr-only">{s.subjectL}</span>
                  <select
                    value={st.subject}
                    onChange={(e) => update({ subject: +e.target.value }, { hash: false })}
                    className="h-12 w-full cursor-pointer rounded-2xl border border-line bg-surface px-4 text-[15px] font-semibold text-ink transition outline-none focus:border-teal focus:bg-white focus:ring-4 focus:ring-teal/15"
                  >
                    <option value={0}>{s.allSubjects}</option>
                    {subjects.map((x) => (
                      <option key={x.id} value={x.id}>{subjectName(x.name, lang)}</option>
                    ))}
                  </select>
                </label>
                {grades.length > 0 && (
                  <label className="block">
                    <span className="sr-only">{s.gradeL}</span>
                    <select
                      value={st.grade}
                      onChange={(e) => update({ grade: +e.target.value }, { hash: false })}
                      className="h-12 w-full cursor-pointer rounded-2xl border border-line bg-surface px-4 text-[15px] font-semibold text-ink transition outline-none focus:border-teal focus:bg-white focus:ring-4 focus:ring-teal/15"
                    >
                      <option value={0}>{s.allGrades}</option>
                      {grades.map((g) => (
                        <option key={g} value={g}>{fill(s.gradeN, { n: g })}</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            </div>

            {/* Бағыттар */}
            <div role="tablist" aria-label={s.pkL} className="scrollbar-none -mx-4 mt-5 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
              {CATALOG_PACKAGES.map((k) => {
                const on = st.pk === k;
                const count = countTests(data.packages[k]?.[st.cls]);
                return (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => pickPk(k)}
                    className={`group inline-flex shrink-0 items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-[15px] font-bold transition duration-300 ${
                      on ? "border-ink bg-ink text-white shadow-[0_14px_30px_-16px_rgba(30,22,56,0.8)]" : "border-line bg-white text-ink hover:-translate-y-0.5 hover:border-teal"
                    }`}
                  >
                    <span className={`grid h-8 w-8 place-items-center rounded-xl ${on ? "bg-white" : "bg-surface"}`}>
                      {LOGOS[k] ? <img src={`${base}img/${LOGOS[k]}`} alt="" className="h-6 w-6 object-contain" loading="lazy" /> : <Icon.GraduationCap className="h-5 w-5 text-teal" />}
                    </span>
                    {s.pk[k]}
                    <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${on ? "bg-white/15 text-white" : "bg-surface text-muted"}`}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Результат */}
          <div ref={listRef} className="mt-10 scroll-mt-24" aria-live="polite">
            {view.kind === "section" ? (
              <>
                <a href={makeHash({ ...st, section: null })} onClick={back} className="inline-flex items-center gap-2 rounded-xl px-1 py-1 text-sm font-bold text-blue transition hover:-translate-x-0.5">
                  <Icon.ArrowLeft className="h-4 w-4" /> {s.back}
                </a>
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <SectionIcon sec={view.sec} base={base} big />
                  <div className="min-w-0">
                    <h2 id="ts-h" className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{splitTitle(view.sec.title).main}</h2>
                    <p className="mt-1 text-sm font-semibold text-muted">
                      {[subOf(view.sec.title), `${s.pk[st.pk]} · ${clsLabel}`, n(view.total, s.testForms)].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 id="ts-h" className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{view.kind === "search" ? s.results : `${s.pk[st.pk]} · ${clsLabel}`}</h2>
                  <p className="mt-1 text-sm font-semibold text-muted">
                    {view.kind === "sections" ? `${n(view.items.length, s.sectionForms)} · ${n(view.total, s.testForms)}` : n(view.total, s.testForms)}
                  </p>
                </div>
                {filtered && (
                  <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2 text-sm font-bold text-ink transition hover:border-red-300 hover:text-red-600">
                    <Icon.X className="h-4 w-4" /> {s.reset}
                  </button>
                )}
              </div>
            )}

            {view.kind === "sections" && view.items.length > 0 && (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {view.items.map(({ sec, count, free }) => {
                  const { main } = splitTitle(sec.title);
                  const sub = subOf(sec.title);
                  return (
                    <a
                      key={sec.id}
                      href={makeHash({ ...st, section: sec.id })}
                      onClick={(e) => openSection(e, sec.id)}
                      className="group flex items-center gap-4 rounded-3xl border border-line bg-white p-4 transition duration-300 hover:-translate-y-1 hover:border-teal/50 hover:shadow-[0_26px_50px_-30px_rgba(30,22,56,0.55)] sm:p-5"
                    >
                      <SectionIcon sec={sec} base={base} />
                      <span className="min-w-0 flex-1">
                        <span className="block leading-snug font-extrabold text-ink [overflow-wrap:anywhere]">{main}</span>
                        {sub && <span className="mt-1.5 inline-flex rounded-full bg-violet-soft px-2 py-0.5 text-[11px] font-bold text-violet">{sub}</span>}
                        <span className="mt-1.5 block text-sm font-semibold text-muted">
                          {n(count, s.testForms)}
                          {free > 0 && <span className="text-green-dark"> · {n(free, s.freeForms)}</span>}
                        </span>
                      </span>
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface text-ink transition duration-300 group-hover:bg-teal group-hover:text-white">
                        <Icon.ArrowRight className="h-5 w-5" />
                      </span>
                    </a>
                  );
                })}
              </div>
            )}

            {view.kind !== "sections" && view.tests.length > 0 && (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {view.tests.map((test) => (
                  <TestCard key={test.id} test={test} s={s} lang={lang} subjects={subjects} />
                ))}
              </div>
            )}

            {view.total === 0 && (
              <div className="mt-6 rounded-3xl border border-dashed border-line bg-surface p-10 text-center">
                <p className="font-semibold text-muted">{s.empty}</p>
                {filtered && (
                  <button type="button" onClick={reset} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue">
                    {s.reset}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Не знаешь, с чего начать */}
          <div className="mt-16 flex flex-col items-start justify-between gap-5 rounded-3xl bg-linear-to-r from-violet via-blue to-teal p-6 text-white shadow-[0_30px_60px_-30px_rgba(109,63,217,0.7)] sm:flex-row sm:items-center sm:p-8">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15"><Icon.Target className="h-6 w-6" /></span>
              <div>
                <p className="text-xl font-extrabold">{s.ctaT}</p>
                <p className="mt-1 text-white/85">{s.ctaD}</p>
              </div>
            </div>
            <a
              href={`${homeHref}#diagnostic`}
              onClick={onStart}
              data-source="catalog"
              className="group inline-flex shrink-0 items-center gap-2 rounded-2xl bg-white px-6 py-3.5 font-bold text-ink transition hover:-translate-y-0.5"
            >
              {s.ctaBtn} <Icon.ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionIcon({ sec, base, big = false }) {
  const size = big ? "h-16 w-16" : "h-14 w-14";
  return (
    <span className={`grid ${size} shrink-0 place-items-center overflow-hidden rounded-2xl bg-surface ring-1 ring-line`}>
      {sec.img ? (
        <img src={`${base}img/tests/${sec.img}`} alt="" width="56" height="56" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <Icon.BookOpen className="h-6 w-6 text-violet" />
      )}
    </span>
  );
}

function TestCard({ test, s, lang, subjects }) {
  const names = (test.subjects ?? []).map((id) => subjects.find((x) => x.id === id)).filter(Boolean).map((x) => subjectName(x.name, lang));
  // Описание прячем, если оно повторяет название («МАТЕМАТИКА+ФИЗИКА» при названии «МАТЕМАТИКА + ФИЗИКА ЖЕЛТОҚСАН»)
  const key = (x) => String(x || "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
  const sameDesc = !key(test.desc) || key(test.title).includes(key(test.desc));
  return (
    <article className="flex flex-col rounded-3xl border border-line bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-violet/30 hover:shadow-[0_26px_50px_-30px_rgba(109,63,217,0.5)] sm:p-6">
      {test.sectionTitle && <p className="text-xs font-bold tracking-wide text-violet uppercase">{splitTitle(test.sectionTitle).main}</p>}
      <h3 className={`${test.sectionTitle ? "mt-1.5" : ""} text-lg leading-snug font-extrabold text-ink [overflow-wrap:anywhere]`}>{test.title.replace(/\s*\+\s*/g, " + ")}</h3>
      {!sameDesc && <p className="mt-1 text-sm text-muted">{test.desc}</p>}
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-ink/75">
        {test.minutes && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5"><Icon.Clock className="h-3.5 w-3.5 text-teal" /> {test.minutes} {s.min}</span>
        )}
        {test.questions && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5"><Icon.Help className="h-3.5 w-3.5 text-violet" /> {test.questions} {s.q}</span>
        )}
        {test.grade && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5"><Icon.GraduationCap className="h-3.5 w-3.5 text-blue" /> {fill(s.gradeN, { n: test.grade })}</span>
        )}
      </div>
      {names.length > 0 && (
        <p className="mt-3 flex flex-wrap gap-1.5">
          {names.slice(0, 4).map((name) => (
            <span key={name} className="rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold text-muted">{name}</span>
          ))}
          {names.length > 4 && <span className="rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold text-muted">+{names.length - 4}</span>}
        </p>
      )}
      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <span className={`text-lg font-extrabold ${test.price === 0 ? "text-green-dark" : "text-ink"}`}>
          {test.price === 0 ? s.free : test.price ? `${formatNumber(test.price)} ₸` : ""}
        </span>
        <a href={TEST_URL(test.id)} className="group inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white transition duration-300 hover:bg-blue">
          {s.start} <Icon.ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>
    </article>
  );
}
