import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icons.jsx";
import { REVIEWS } from "../data.js";
import { prefersReducedMotion } from "../hooks.js";

function ReviewCard({ r, lang, t }) {
  const [open, setOpen] = useState(false);
  return (
    <figure className="flex h-full flex-col rounded-3xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(30,22,56,0.05),0_24px_50px_-36px_rgba(30,22,56,0.45)] sm:p-7">
      <div className="flex items-center gap-4">
        <img src={r.photo} alt="" width="64" height="64" loading="lazy" className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-4 ring-teal-soft" />
        <figcaption className="min-w-0">
          <p className="font-bold text-ink">{r.name}</p>
          <p className="text-sm text-muted">{r.role[lang]}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
            <Icon.MapPin className="h-3.5 w-3.5 shrink-0 text-teal" /> {r.place[lang]}
          </p>
        </figcaption>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <span className="inline-flex rounded-full bg-green/10 px-3 py-1 text-xs font-bold text-green-dark">{r.tag[lang]}</span>
        {/* Балл поступления: добавьте score: { kk: "...", ru: "..." } в REVIEWS (src/data.js) */}
        {r.score && <span className="inline-flex rounded-full bg-violet-soft px-3 py-1 text-xs font-extrabold text-violet">{r.score[lang]}</span>}
      </div>
      <blockquote className="relative mt-4 flex-1" lang={lang}>
        <Icon.Quote className="absolute -top-1 -left-1 h-7 w-7 text-violet/15" />
        <p className={`relative pl-6 text-[15px] leading-relaxed text-ink/80 ${open ? "" : "line-clamp-5"}`}>{r.text[lang]}</p>
      </blockquote>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="text-sm font-bold text-blue hover:underline">
          {open ? t.less : t.more}
        </button>
        {t.translated && <span className="text-xs text-muted italic">{t.translated}</span>}
      </div>
    </figure>
  );
}

export default function Reviews({ t, lang, base }) {
  const r = t.reviews;
  const trackRef = useRef(null);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(REVIEWS.length);
  const paused = useRef(false);
  const items = REVIEWS.map((x) => ({ ...x, photo: `${base}img/${x.img}` }));

  const step = () => {
    const el = trackRef.current;
    const first = el?.children[0];
    return first ? first.getBoundingClientRect().width + 20 : 0;
  };
  const go = (i) => trackRef.current?.scrollTo({ left: i * step(), behavior: prefersReducedMotion() ? "auto" : "smooth" });

  useEffect(() => {
    const el = trackRef.current;
    const measure = () => {
      const perView = Math.max(1, Math.round(el.clientWidth / step()));
      setPages(Math.max(1, REVIEWS.length - perView + 1));
    };
    const onScroll = () => setPage(Math.round(el.scrollLeft / (step() || 1)));
    measure();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    const timer = prefersReducedMotion()
      ? null
      : setInterval(() => {
          if (paused.current || document.hidden) return;
          const current = Math.round(el.scrollLeft / (step() || 1));
          const perView = Math.max(1, Math.round(el.clientWidth / step()));
          go(current + 1 > REVIEWS.length - perView ? 0 : current + 1);
        }, 6000);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      clearInterval(timer);
    };
  }, []);

  return (
    <section id="reviews" aria-labelledby="reviews-h" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="reveal flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold tracking-[0.2em] text-teal uppercase">{r.kicker}</p>
            <h2 id="reviews-h" className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{r.h2}</h2>
            {r.note && <p className="mt-3 text-sm text-muted">{r.note}</p>}
          </div>
          <div className="flex gap-2">
            {[
              [r.prev, Icon.ChevronLeft, -1],
              [r.next, Icon.ChevronRight, 1],
            ].map(([label, Arrow, dir]) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                onClick={() => go(Math.min(Math.max(page + dir, 0), pages - 1))}
                className="grid h-12 w-12 place-items-center rounded-2xl border border-line bg-white text-ink transition hover:-translate-y-0.5 hover:border-teal hover:text-blue"
              >
                <Arrow className="h-5 w-5" />
              </button>
            ))}
          </div>
        </div>

        <div
          ref={trackRef}
          onPointerEnter={() => (paused.current = true)}
          onPointerLeave={() => (paused.current = false)}
          onFocus={() => (paused.current = true)}
          className="scrollbar-none reveal -mx-4 mt-10 flex snap-x snap-mandatory scroll-px-4 gap-5 overflow-x-auto scroll-smooth px-4 pb-4 sm:mx-0 sm:scroll-px-0 sm:px-0"
        >
          {items.map((item) => (
            <div key={item.name} className="w-[88%] shrink-0 snap-start sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]">
              <ReviewCard r={item} lang={lang} t={r} />
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center gap-2" aria-hidden>
          {Array.from({ length: pages }, (_, i) => (
            <span key={i} className={`h-2 rounded-full transition-all duration-300 ${i === Math.min(page, pages - 1) ? "w-7 bg-teal" : "w-2 bg-line"}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
