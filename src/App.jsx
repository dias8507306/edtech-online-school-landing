import { useCallback, useEffect, useRef, useState } from "react";
import { T } from "./i18n.js";
import { applyHead, langFromPath } from "./seo.js";
import { isPlainClick, scrollToTop } from "./hooks.js";
import { track } from "./diagnostic/api.js";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import Stats from "./components/Stats.jsx";
import Diagnostic from "./components/Diagnostic.jsx";
import Products from "./components/Products.jsx";
import Catalog from "./components/Catalog.jsx";
import Courses from "./components/Courses.jsx";
import Reviews from "./components/Reviews.jsx";
import CtaBand from "./components/CtaBand.jsx";
import Footer from "./components/Footer.jsx";
import BackToTop from "./components/BackToTop.jsx";
import TestsPage from "./components/TestsPage.jsx";
import RegisterPage from "./components/RegisterPage.jsx";
import { NavContext } from "./nav.js";
import { LINKS } from "./data.js";
import DiagnosticWizard from "./diagnostic/DiagnosticWizard.jsx";

// Страницы сайта и их папки: главная — "/", каталог тестов — "/catalog/" (у русской версии — "/ru/…").
// Папка не «tests», чтобы не пересекаться с разделом /Tests текущей платформы на том же домене.
export const PAGE_PATH = { home: "", catalog: "catalog/", register: "register/" };

/**
 * lang  — язык, с которым страница открылась: "kk" (/) или "ru" (/ru/)
 * base  — путь к корню сайта относительно страницы: "./" для /, "../" для /ru/, /catalog/, /register/, "../../" для /ru/catalog/, /ru/register/
 * page  — "home", "catalog" или "register"; tests — снимок каталога (только для страницы каталога)
 *
 * Язык переключается мгновенно (состояние React), без перезагрузки страницы.
 * На сервере адрес меняется на / или /ru/ (history.pushState), кнопка «Назад» в браузере тоже работает.
 */
export default function App({ lang: initialLang = "kk", base: initialBase = "./", page = "home", tests = null }) {
  const [lang, setLang] = useState(initialLang);
  const [base, setBase] = useState(initialBase);
  const [diagOpen, setDiagOpen] = useState(false);
  const langRef = useRef(initialLang);
  const rootRef = useRef(null); // абсолютный адрес корня сайта, считается один раз при загрузке
  const t = T[lang];

  // Адреса страниц. До запуска JS — относительные (как в готовом HTML), потом — абсолютные.
  // С диска (file://) папка сама не открывает index.html — дописываем его.
  const isFile = base.startsWith("file:");
  const pageHref = (p, l = lang) => base + (l === "ru" ? "ru/" : "") + PAGE_PATH[p] + (isFile ? "index.html" : "");
  const langHref = (l) => pageHref(page, l);
  const homeHref = pageHref("home");
  const catalogHref = pageHref("catalog");
  const nav = { register: pageHref("register"), login: LINKS.login };
  // Якоря главной (#diagnostic…) со страницы каталога ведут на главную
  const anchor = (id) => (page === "home" ? `#${id}` : `${homeHref}#${id}`);

  const changeLang = useCallback((next, push = true) => {
    if (next === langRef.current) return;
    langRef.current = next;
    setLang(next);
    applyHead(next, page);
    try {
      localStorage.setItem("zd-lang", next);
    } catch {
      // приватный режим — не страшно
    }
    if (push && rootRef.current && /^https?:$/.test(window.location.protocol)) {
      history.pushState({ lang: next }, "", rootRef.current + (next === "ru" ? "ru/" : "") + PAGE_PATH[page] + window.location.hash);
    }
  }, [page]);

  useEffect(() => {
    // Абсолютный путь к корню сайта: картинки не «ломаются», когда адрес меняется между / и /ru/
    rootRef.current = new URL(initialBase, window.location.href).href;
    setBase(rootRef.current);
    // Иконки вкладки тоже делаем абсолютными: после смены адреса / ↔ /ru/ относительный путь указывал бы не туда
    document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]').forEach((l) => l.setAttribute("href", l.href));
    if (/^https?:$/.test(window.location.protocol)) history.replaceState({ ...history.state, lang: initialLang }, "");

    // Кнопки «Назад / Вперёд» в браузере
    const onPop = (e) => {
      if (e.state?.lang) changeLang(e.state.lang, false);
      else if (/^https?:$/.test(window.location.protocol)) changeLang(langFromPath(window.location.pathname.replace(/(catalog|register)\/(index\.html)?$/, "")), false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [initialBase, initialLang, changeLang]);

  // Появление блоков при прокрутке (и для блоков, которые React добавит позже)
  useEffect(() => {
    const root = document.getElementById("root") ?? document.body;
    if (!("IntersectionObserver" in window)) {
      root.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    const observeAll = () => root.querySelectorAll(".reveal:not(.is-in)").forEach((el) => io.observe(el));
    observeAll();
    const mo = new MutationObserver(observeAll);
    mo.observe(root, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  // Логотип: на главной — плавно наверх, без перезагрузки и без «#якоря» в адресе; на каталоге — обычный переход на главную
  const goHome = useCallback((e) => {
    if (page !== "home" || !isPlainClick(e)) return;
    e.preventDefault();
    scrollToTop();
    if (window.location.hash && /^https?:$/.test(window.location.protocol)) history.replaceState(history.state, "", window.location.pathname + window.location.search);
  }, [page]);

  // «Тегін сынақ тест тапсыру» — открыть окно диагностики
  const openDiagnostic = useCallback((e) => {
    if (e && !isPlainClick(e)) return;
    e?.preventDefault();
    setDiagOpen(true);
    track("diag_open", { source: e?.currentTarget?.dataset?.source ?? "unknown" });
  }, []);
  const closeDiagnostic = useCallback(() => setDiagOpen(false), []);

  return (
    <NavContext.Provider value={nav}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:font-bold focus:shadow-lg"
      >
        {t.nav.skip}
      </a>
      <Header t={t} lang={lang} base={base} page={page} langHref={langHref} homeHref={homeHref} catalogHref={catalogHref} anchor={anchor} onLang={changeLang} onHome={goHome} />
      <main id="main" lang={lang}>
        {page === "catalog" ? (
          <TestsPage t={t} lang={lang} base={base} homeHref={homeHref} data={tests} onStart={openDiagnostic} />
        ) : page === "register" ? (
          <RegisterPage t={t} homeHref={homeHref} />
        ) : (
          <>
            <Hero t={t} base={base} onStart={openDiagnostic} />
            <Stats t={t} />
            <Diagnostic t={t} base={base} onStart={openDiagnostic} />
            <Products t={t} catalogHref={catalogHref} />
            <Catalog t={t} lang={lang} base={base} catalogHref={catalogHref} />
            <Courses t={t} base={base} />
            <Reviews t={t} lang={lang} base={base} />
            <CtaBand t={t} base={base} onStart={openDiagnostic} />
          </>
        )}
      </main>
      <Footer t={t} lang={lang} base={base} homeHref={homeHref} catalogHref={catalogHref} anchor={anchor} onHome={goHome} />
      <BackToTop label={t.nav.toTop} />
      <DiagnosticWizard open={diagOpen} onClose={closeDiagnostic} t={t} lang={lang} base={base} />
    </NavContext.Provider>
  );
}
