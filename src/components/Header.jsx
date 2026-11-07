import { useEffect, useState } from "react";
import { Icon } from "./Icons.jsx";
import { useNav } from "../nav.js";
import { LINKS } from "../data.js";
import { isPlainClick, useScrollLock } from "../hooks.js";

const LANGS = [
  ["kk", "KZ", "Қазақша"],
  ["ru", "RU", "Русский"],
];

// Переключатель KZ | RU: обе кнопки видны, активная подсвечена.
// Это настоящие ссылки на / и /ru/ (их видят поисковики), но обычный клик меняет язык мгновенно, без перезагрузки.
function LangToggle({ label, lang, langHref, onPick }) {
  return (
    <div role="group" aria-label={label} className="relative grid grid-cols-2 rounded-xl bg-surface p-1 ring-1 ring-line">
      <span
        aria-hidden
        className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-[0_4px_12px_-4px_rgba(30,22,56,0.3)] ring-1 ring-line transition-transform duration-300 ${
          lang === "ru" ? "translate-x-full" : "translate-x-0"
        }`}
      />
      {LANGS.map(([code, short, full]) => (
        <a
          key={code}
          href={langHref(code)}
          hrefLang={code}
          lang={code}
          aria-label={full}
          aria-current={lang === code ? "true" : undefined}
          onClick={(e) => onPick(e, code)}
          className={`relative z-10 grid h-8 min-w-10 place-items-center px-2.5 text-sm font-bold transition-colors ${lang === code ? "text-blue" : "text-ink/55 hover:text-ink"}`}
        >
          {short}
        </a>
      ))}
    </div>
  );
}

/**
 * Шапка закреплена сверху (fixed, z-50) и всегда доступна при прокрутке.
 * langHref(l)  — адрес языковой версии (для поисковиков и «открыть в новой вкладке»)
 * onLang(l)    — мгновенное переключение языка без перезагрузки
 * onHome(e)    — клик по логотипу: плавно наверх (на главной)
 * homeHref / catalogHref — адреса главной и каталога тестов; anchor(id) — якорь главной (#diagnostic) с любой страницы
 */
export default function Header({ t, lang, base, page = "home", langHref, homeHref, catalogHref, anchor, onLang, onHome }) {
  const nav = useNav();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useScrollLock(open);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    // Если окно растянули до десктопа, мобильное меню закрываем (иначе прокрутка осталась бы заблокированной)
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onWide = (e) => e.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onWide);
    return () => {
      window.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onWide);
    };
  }, [open]);

  // «Тесттер» ведёт на страницу каталога, остальные пункты — к блокам главной
  const links = [
    [catalogHref, t.nav.tests, page === "catalog"],
    [anchor("diagnostic"), t.nav.diagnostic],
    [anchor("courses"), t.nav.courses],
    [anchor("reviews"), t.nav.reviews],
    ["#contacts", t.nav.contacts],
  ];

  function switchLang(e, next) {
    if (!isPlainClick(e)) return;
    e.preventDefault();
    setOpen(false);
    onLang(next);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* Стеклянный фон отдельным слоем: если поставить backdrop-blur на сам header,
          мобильное меню (position: fixed) будет считать высоту от шапки и «схлопнется» */}
      <div
        aria-hidden
        className={`absolute inset-0 -z-10 backdrop-blur-md transition-[background-color,box-shadow] duration-300 ${
          scrolled || open ? "bg-white/85 shadow-[0_12px_40px_-24px_rgba(30,22,56,0.45)]" : "bg-white/55"
        }`}
      />
      <div className="mx-auto flex h-18 max-w-7xl items-center gap-4 px-4 sm:px-6 xl:gap-6">
        <a
          href={homeHref}
          onClick={(e) => {
            setOpen(false);
            onHome(e);
          }}
          aria-label={t.nav.home}
          className="shrink-0 transition-transform duration-300 hover:scale-[1.03]"
        >
          <img src={`${base}img/eduapp-logo.svg`} alt="EDUAPP" width="185" height="48" className="h-9 w-auto sm:h-10" />
        </a>

        <nav className="ml-auto hidden lg:block" aria-label={t.nav.menu}>
          <ul className="flex items-center gap-5 text-[15px] font-medium text-ink/80 xl:gap-7">
            {links.map(([href, label, current]) => (
              <li key={label}>
                <a href={href} aria-current={current ? "page" : undefined} className={`group relative py-2 whitespace-nowrap transition-colors hover:text-blue ${current ? "text-blue" : ""}`}>
                  {label}
                  <span className={`absolute inset-x-0 -bottom-0.5 h-0.5 origin-left rounded-full bg-linear-to-r from-teal to-violet transition-transform duration-300 group-hover:scale-x-100 ${current ? "scale-x-100" : "scale-x-0"}`} />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <LangToggle label={t.nav.langGroup} lang={lang} langHref={langHref} onPick={switchLang} />
          <a href={LINKS.login} className="hidden h-10 items-center rounded-xl px-3 text-sm font-semibold whitespace-nowrap text-ink/80 transition hover:bg-surface hover:text-blue sm:inline-flex">
            {t.nav.login}
          </a>
          <a
            href={nav.register}
            className="hidden h-10 items-center rounded-xl bg-linear-to-r from-green to-emerald-500 px-4 text-sm font-bold whitespace-nowrap text-white shadow-[0_10px_24px_-12px_rgba(22,192,96,0.9)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-12px_rgba(22,192,96,1)] sm:inline-flex"
          >
            {t.nav.register}
          </a>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={t.nav.menu}
            className="grid h-10 w-10 place-items-center rounded-xl text-ink transition hover:bg-surface lg:hidden"
          >
            {open ? <Icon.X className="h-6 w-6" /> : <Icon.Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Мобильное меню */}
      <div
        id="mobile-menu"
        className={`fixed inset-x-0 top-18 bottom-0 overflow-y-auto bg-white px-4 pb-8 transition-all duration-300 lg:hidden ${
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
        }`}
      >
        <nav className="flex flex-col" aria-label={t.nav.menu}>
          {links.map(([href, label, current]) => (
            <a key={label} href={href} aria-current={current ? "page" : undefined} onClick={() => setOpen(false)} className={`border-b border-line py-4 text-xl font-semibold ${current ? "text-blue" : "text-ink"}`}>
              {label}
            </a>
          ))}
        </nav>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <a href={LINKS.login} className="flex h-12 items-center justify-center rounded-xl border border-line font-semibold">
            {t.nav.login}
          </a>
          <a href={nav.register} className="flex h-12 items-center justify-center rounded-xl bg-linear-to-r from-green to-emerald-500 font-bold text-white">
            {t.nav.register}
          </a>
        </div>
      </div>
    </header>
  );
}
