import { useRef } from "react";
import { prefersReducedMotion } from "../hooks.js";

/**
 * Карточка с 3D-наклоном к курсору и светящейся кромкой (класс .glow-edge в index.css).
 * <Tilt max={8} glow="#22c1d6" className="...">...</Tilt>
 */
export default function Tilt({ as: Tag = "div", max = 8, glow, className = "", style, children, ...rest }) {
  const ref = useRef(null);

  function onPointerMove(e) {
    if (e.pointerType === "touch") return;
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
    if (!prefersReducedMotion()) {
      el.style.transform = `perspective(1000px) rotateX(${((0.5 - y) * max).toFixed(2)}deg) rotateY(${((x - 0.5) * max).toFixed(2)}deg) translateY(-4px)`;
    }
  }

  function onPointerLeave() {
    ref.current.style.transform = "";
  }

  return (
    <Tag
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={glow ? { "--glow": glow, ...style } : style}
      className={`glow-edge transition-[transform,box-shadow] duration-300 ease-out will-change-transform ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
