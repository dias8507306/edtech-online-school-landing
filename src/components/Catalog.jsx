import { useEffect, useState } from "react";
import { Icon } from "./Icons.jsx";
import Tilt from "./Tilt.jsx";
import { DIRECTIONS, GRADES, PACKAGES, TOP_TESTS_SNAPSHOT } from "../data.js";
import { formatNumber } from "../hooks.js";
import { TEST_URL } from "../testsCatalog.js";

// Ответ API /Tests/Tests_GetTopTests → карточка теста. Тестовые «заглушки» и прошедшие по дате тесты отбрасываем.
function mapTest(x, packageId) {
  if (!x?.Title || x.Title.trim().length < 6 || !x.Description || x.Description.trim().length < 6) return null;
  if (x.IsAccessibleByTime && x.AccessibleTo && Date.parse(x.AccessibleTo) < Date.now()) return null;
  const subjects = Array.isArray(x.Subjects) ? x.Subjects : x.Subjects ? [x.Subjects] : [];
  const questions = subjects.reduce((sum, s) => sum + (s?.QuestionsCount || 0), 0);
  return {
    id: x.Id,
    title: x.Title.trim(),
    desc: x.Description.trim(),
    minutes: x.DurationMinutes || null,
    questions: questions || null,
    price: x.Price ?? null,
    packageId,
    badge: null,
  };
}

async function loadTopTests(testLang, signal) {
  const pk = PACKAGES[testLang];
  const list = [];
  for (const packageId of [pk.ubt, pk.nis, pk.bil, pk.rfmm, pk.grades]) {
    const res = await fetch("/Tests/Tests_GetTopTests", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `packageId=${packageId}`,
      signal,
    });
    if (!res.ok) continue;
    const pkg = await res.json();
    for (const x of pkg?.Tests ?? []) {
      const test = mapTest(x, packageId);
      if (test) list.push(test);
    }
  }
  return list.map((test, i) => ({ ...test, badge: i === 0 ? "top" : null }));
}

function Badge({ type }) {
  if (type === "top")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-extrabold text-orange-600">
        <Icon.Flame className="h-3.5 w-3.5" /> TOP
      </span>
    );
  if (type === "new")
    return <span className="inline-flex rounded-full bg-teal-soft px-2.5 py-1 text-xs font-extrabold text-teal">NEW</span>;
  return null;
}

export default function Catalog({ t, lang, base, catalogHref }) {
  const c = t.catalog;
  const [testLang, setTestLang] = useState(lang === "ru" ? "ru" : "kk");
  const [tests, setTests] = useState(TOP_TESTS_SNAPSHOT);

  // Сменили язык сайта — язык тестов по умолчанию меняется вместе с ним
  useEffect(() => setTestLang(lang), [lang]);

  // На своём домене подтягиваем живые данные из того же API, что и текущий сайт
  useEffect(() => {
    if (!/(^|\.)eduapp\.example\.com$/.test(window.location.hostname)) return;
    const ctrl = new AbortController();
    Promise.all([loadTopTests("kk", ctrl.signal), loadTopTests("ru", ctrl.signal)])
      .then(([kk, ru]) => setTests({ kk: kk.length ? kk : TOP_TESTS_SNAPSHOT.kk, ru }))
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  const list = tests[testLang] ?? [];
  // Ссылки в каталог тестов сразу на нужную вкладку: #kk/ubt, #kk/grades/g6
  const toCatalog = (pk, grade) => `${catalogHref}#${testLang}/${pk}${grade ? `/g${grade}` : ""}`;

  return (
    <section id="catalog" aria-labelledby="catalog-h" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="reveal flex flex-col items-center text-center">
          <p className="text-sm font-bold tracking-[0.2em] text-green-dark uppercase">{c.kicker}</p>
          <h2 id="catalog-h" className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{c.h2}</h2>
          <p className="mt-4 max-w-2xl text-lg text-muted">{c.lead}</p>

          {/* Переключатель языка теста */}
          <div role="radiogroup" aria-label={c.langLabel} className="relative mt-8 grid grid-cols-2 rounded-2xl bg-surface p-1.5 ring-1 ring-line">
            <span
              aria-hidden
              className={`absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] rounded-xl bg-linear-to-r from-green to-emerald-500 shadow-[0_10px_24px_-12px_rgba(22,192,96,0.9)] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                testLang === "ru" ? "translate-x-full" : "translate-x-0"
              }`}
            />
            {[
              ["kk", c.langKz],
              ["ru", c.langRu],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={testLang === key}
                onClick={() => setTestLang(key)}
                className={`relative z-10 px-5 py-2.5 text-sm font-bold transition-colors duration-300 sm:px-8 ${testLang === key ? "text-white" : "text-ink/70 hover:text-ink"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Направления */}
        {/* на телефоне — по две карточки в ряд, чтобы блок не растягивался на несколько экранов */}
        <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {DIRECTIONS.map((d, i) => (
            <div key={d.key} className="reveal" style={{ transitionDelay: `${i * 0.06}s` }}>
              <Tilt
                as="a"
                href={toCatalog(d.key)}
                max={9}
                glow={d.glow}
                className="flex h-full flex-col rounded-3xl border border-line bg-surface p-4 hover:bg-white hover:shadow-[0_30px_60px_-34px_rgba(30,22,56,0.5)] sm:p-6"
              >
                <div className="relative z-10 flex items-start justify-between gap-2">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-line sm:h-16 sm:w-16 sm:p-2">
                    <img src={`${base}img/${d.logo}`} alt="" className="max-h-full max-w-full object-contain" loading="lazy" />
                  </span>
                  <Badge type={d.badge} />
                </div>
                <h3 className="relative z-10 mt-4 text-xl font-extrabold sm:mt-5 sm:text-2xl">{c.dirs[d.key].t}</h3>
                <p className="relative z-10 mt-1 text-xs leading-snug text-muted sm:text-sm">{c.dirs[d.key].d}</p>
                <span className="relative z-10 mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-bold text-blue sm:pt-5">
                  {c.open} <Icon.ArrowRight className="h-4 w-4" />
                </span>
              </Tilt>
            </div>
          ))}
        </div>

        {/* Классы */}
        <div className="reveal mt-10 rounded-3xl border border-line bg-surface p-5 sm:p-6">
          <p className="text-sm font-bold text-ink/80">{c.gradesTitle}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {GRADES.map((g) => (
              <a
                key={g}
                href={toCatalog("grades", g)}
                className="group inline-flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-2.5 font-bold text-ink transition duration-300 hover:-translate-y-0.5 hover:border-teal hover:text-blue hover:shadow-[0_12px_26px_-16px_rgba(34,193,214,0.9)]"
              >
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal-soft text-sm text-teal transition group-hover:bg-teal group-hover:text-white">{g}</span>
                {c.grade}
              </a>
            ))}
          </div>
        </div>

        {/* Популярные тесты */}
        <h3 className="reveal mt-14 text-2xl font-extrabold tracking-tight">{c.top}</h3>
        {list.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((test) => (
              <article
                key={test.id}
                className="group flex animate-rise flex-col rounded-3xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(30,22,56,0.04)] transition duration-300 hover:-translate-y-1 hover:border-violet/30 hover:shadow-[0_28px_56px_-32px_rgba(109,63,217,0.55)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-soft text-violet">
                    <Icon.ListChecks className="h-5 w-5" />
                  </span>
                  <Badge type={test.badge} />
                </div>
                <p className="mt-4 text-lg leading-snug font-bold">{test.title}</p>
                <p className="mt-1 text-sm text-muted">{test.desc}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-ink/75">
                  {test.minutes && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5">
                      <Icon.Clock className="h-3.5 w-3.5 text-teal" /> {test.minutes} {c.min}
                    </span>
                  )}
                  {test.questions && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5">
                      <Icon.Help className="h-3.5 w-3.5 text-violet" /> {test.questions} {c.q}
                    </span>
                  )}
                </div>
                <div className="mt-auto flex items-center justify-between pt-6">
                  <span className="text-lg font-extrabold text-green-dark">{test.price ? `${formatNumber(test.price)} ₸` : ""}</span>
                  <a
                    href={TEST_URL(test.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white transition duration-300 group-hover:bg-blue"
                  >
                    {c.start} <Icon.ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-6 animate-rise rounded-3xl border border-dashed border-line bg-surface p-8 text-center text-muted">{c.empty}</p>
        )}

        <div className="reveal mt-10 text-center">
          <a
            href={toCatalog("ubt")}
            className="group inline-flex items-center gap-2 rounded-2xl border border-line bg-white px-6 py-3.5 font-bold text-ink transition duration-300 hover:-translate-y-0.5 hover:border-green hover:text-green-dark"
          >
            {c.all} <Icon.ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  );
}
