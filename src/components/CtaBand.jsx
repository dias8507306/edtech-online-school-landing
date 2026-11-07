import { Icon } from "./Icons.jsx";
import { LINKS } from "../data.js";
import { useNav } from "../nav.js";

export default function CtaBand({ t, base, onStart }) {
  const nav = useNav();
  return (
    <section aria-labelledby="cta-h" className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="reveal relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 overflow-hidden rounded-[32px] bg-linear-to-br from-violet via-blue to-teal px-6 py-12 text-white sm:px-12 sm:py-14 lg:grid-cols-[1.2fr_0.8fr]">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-20 h-72 w-72 animate-blob rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.28),transparent)]" />
          <div className="absolute -right-16 -bottom-28 h-80 w-80 animate-blob rounded-full bg-[radial-gradient(closest-side,rgba(22,192,96,0.45),transparent)]" style={{ animationDelay: "-7s" }} />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] bg-[size:22px_22px] [mask-image:radial-gradient(60%_80%_at_50%_50%,#000,transparent)]" />
        </div>

        <div className="relative text-center lg:text-left">
          <h2 id="cta-h" className="text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
            {t.cta.h2}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/85 lg:mx-0">{t.cta.text}</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <a
              href={nav.register}
              className="group inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 font-bold text-ink shadow-[0_20px_40px_-18px_rgba(18,14,36,0.6)] transition duration-300 hover:-translate-y-0.5"
            >
              {t.cta.btn} <Icon.ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#diagnostic"
              onClick={onStart}
              data-source="cta"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/40 bg-white/10 px-6 py-4 font-bold text-white backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white/20"
            >
              <Icon.BarChart className="h-5 w-5" /> {t.cta.diag}
            </a>
          </div>
          <a href={LINKS.login} className="mt-5 inline-block font-semibold text-white/90 underline-offset-4 hover:text-white hover:underline">
            {t.cta.login}
          </a>
        </div>

        <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
          <img
            src={`${base}img/photo-students-class.svg`}
            alt={t.cta.photoAlt}
            width="720"
            height="1024"
            loading="lazy"
            className="aspect-[16/11] w-full rotate-[1.5deg] rounded-[28px] object-cover object-[60%_48%] shadow-[0_30px_60px_-24px_rgba(18,14,36,0.7)] ring-4 ring-white/25 lg:aspect-[5/4]"
          />
        </div>
      </div>
    </section>
  );
}
