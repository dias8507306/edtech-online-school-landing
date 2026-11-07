import { useEffect, useRef, useState } from "react";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// true, когда элемент впервые попал в экран
export function useInView(threshold = 0.25) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// Счётчик: в HTML сразу финальное число (его видят поисковики), анимация с нуля — при появлении
export function useCountUp(target, start, duration = 1600) {
  const [value, setValue] = useState(target);
  useEffect(() => {
    if (!start || prefersReducedMotion()) return;
    let raf;
    const t0 = performance.now();
    setValue(0);
    const tick = (now) => {
      const p = Math.max(0, Math.min(1, (now - t0) / duration));
      setValue(Math.round(target * (1 - Math.pow(1 - p, 4))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target, duration]);
  return value;
}

// "{c} / {t} дұрыс" + { c: 6, t: 8 } → "6 / 8 дұрыс"
export const fill = (text, params = {}) => text.replace(/\{(\w+)\}/g, (_, key) => (key in params ? params[key] : `{${key}}`));

// 204 → "3:24"
export const formatDuration = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

// Плавная прокрутка в самый верх страницы
export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
}

// Обычный клик левой кнопкой (не Ctrl/Cmd+клик «открыть в новой вкладке»)
export const isPlainClick = (e) => !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button > 0);

// Блокирует прокрутку страницы, пока открыто окно или мобильное меню.
// Счётчик нужен, чтобы закрытие одного окна не разблокировало страницу под другим.
let scrollLocks = 0;
export function useScrollLock(active) {
  useEffect(() => {
    if (!active) return;
    scrollLocks += 1;
    document.documentElement.style.overflow = "hidden";
    return () => {
      scrollLocks -= 1;
      if (scrollLocks === 0) document.documentElement.style.overflow = "";
    };
  }, [active]);
}

// Модальное окно: Esc закрывает, Tab не выходит за пределы окна, после закрытия фокус возвращается на кнопку
export function useDialog(ref, open, onClose) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !ref.current) return;
      const items = [...ref.current.querySelectorAll('a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])')].filter(
        (el) => el.offsetParent !== null
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open, ref]);
}

// 7964 → «7 964» (неразрывный пробел, одинаково на сервере и в браузере)
export const formatNumber = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
