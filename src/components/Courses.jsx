import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icons.jsx";
import { COURSE_VIDEOS, LINKS } from "../data.js";
import { useNav } from "../nav.js";

function VideoModal({ id, title, closeLabel, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[60] grid place-items-center bg-ink/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-4xl animate-rise" onClick={(e) => e.stopPropagation()}>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="absolute -top-12 right-0 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
        >
          <Icon.X className="h-5 w-5" />
        </button>
        <div className="aspect-video overflow-hidden rounded-2xl bg-black shadow-2xl">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}

export default function Courses({ t, base }) {
  const nav = useNav();
  const c = t.courses;
  const [active, setActive] = useState(null);

  return (
    <section id="courses" aria-labelledby="courses-h" className="py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div className="reveal">
          <p className="text-sm font-bold tracking-[0.2em] text-violet uppercase">{c.kicker}</p>
          <h2 id="courses-h" className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{c.h2}</h2>
          <ul className="mt-7 space-y-3.5">
            {c.points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-[15px] leading-relaxed text-ink/85">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-green/12 text-green-dark">
                  <Icon.Check className="h-4 w-4" />
                </span>
                {p}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href={LINKS.courses}
              className="group inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-violet to-blue px-6 py-3.5 font-bold text-white shadow-[0_18px_36px_-16px_rgba(109,63,217,0.85)] transition duration-300 hover:-translate-y-0.5"
            >
              {c.cta} <Icon.ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a href={nav.register} className="font-semibold text-green-dark underline-offset-4 hover:underline">
              {c.free}
            </a>
          </div>
          {c.note && <p className="mt-5 text-sm text-muted">{c.note}</p>}
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {COURSE_VIDEOS.map((v, i) => {
            const card = c.cards[i];
            return (
              <div key={v.youtube} className="reveal" style={{ transitionDelay: `${i * 0.07}s` }}>
                <button
                  type="button"
                  onClick={() => setActive({ id: v.youtube, title: card.title })}
                  className="group block w-full overflow-hidden rounded-3xl border border-line bg-white text-left shadow-[0_1px_2px_rgba(30,22,56,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(30,22,56,0.55)]"
                >
                  <span className="relative block aspect-[16/11] overflow-hidden bg-ink">
                    <img
                      src={`${base}img/${v.img}`}
                      alt={card.title}
                      width="262"
                      height="230"
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105 group-hover:blur-[2px] group-hover:brightness-75"
                    />
                    <span className="absolute inset-0 bg-linear-to-t from-ink/70 via-ink/10 to-transparent" />
                    <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-ink backdrop-blur">{card.tag}</span>
                    <span className="absolute inset-0 grid place-items-center">
                      <span className="relative grid h-14 w-14 place-items-center rounded-full bg-white text-violet shadow-xl transition duration-300 group-hover:scale-110">
                        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-white/70" />
                        <Icon.Play className="relative h-5 w-5 translate-x-0.5" />
                      </span>
                    </span>
                    {/* индикатор просмотра: заполняется при наведении */}
                    <span className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
                      <span className="block h-full w-[12%] bg-linear-to-r from-teal to-violet transition-[width] duration-[1600ms] ease-out group-hover:w-full" />
                    </span>
                  </span>
                  <span className="flex items-center justify-between gap-3 p-5">
                    <span className="font-bold leading-snug text-ink">{card.title}</span>
                    <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-violet">
                      <Icon.Play className="h-3.5 w-3.5" /> {c.watch}
                    </span>
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {active && <VideoModal id={active.id} title={active.title} closeLabel={c.close} onClose={() => setActive(null)} />}
    </section>
  );
}
