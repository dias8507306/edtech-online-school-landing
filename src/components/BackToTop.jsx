import { useEffect, useState } from "react";
import { Icon } from "./Icons.jsx";
import { scrollToTop } from "../hooks.js";

const R = 18;
const CIRCLE = 2 * Math.PI * R;

// Плавающая кнопка «Жоғарыға / Наверх»: появляется после 600px прокрутки, кольцо показывает, сколько страницы пройдено
export default function BackToTop({ label }) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setVisible(window.scrollY > 600);
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={label}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={`group fixed right-4 bottom-4 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-white/90 p-1.5 text-ink shadow-[0_18px_40px_-16px_rgba(30,22,56,0.55)] ring-1 ring-line backdrop-blur-md transition duration-300 hover:-translate-y-0.5 sm:right-6 sm:bottom-6 sm:pr-5 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <span className="relative grid h-11 w-11 place-items-center rounded-full bg-linear-to-br from-teal to-violet text-white">
        <svg viewBox="0 0 44 44" className="absolute -inset-[3px] h-[50px] w-[50px] -rotate-90" aria-hidden>
          <circle cx="22" cy="22" r={R} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" />
          <circle cx="22" cy="22" r={R} fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={CIRCLE} strokeDashoffset={CIRCLE * (1 - progress)} />
        </svg>
        <Icon.ArrowUp className="relative h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5" />
      </span>
      <span className="hidden text-sm font-bold sm:inline">{label}</span>
    </button>
  );
}
