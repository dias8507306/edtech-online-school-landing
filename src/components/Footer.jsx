import { Icon } from "./Icons.jsx";
import { useNav } from "../nav.js";
import { CONTACTS, LINKS } from "../data.js";

const SOCIAL_ICONS = { instagram: Icon.Instagram, youtube: Icon.Youtube, facebook: Icon.Facebook };

export default function Footer({ t, lang, base, homeHref, catalogHref, anchor, onHome }) {
  const f = t.footer;
  const year = new Date().getFullYear();
  const navLinks = useNav();

  const nav = [
    [catalogHref, t.nav.tests],
    [anchor("diagnostic"), t.nav.diagnostic],
    [anchor("courses"), t.nav.courses],
    [anchor("reviews"), t.nav.reviews],
    [LINKS.login, t.nav.login],
    [navLinks.register, t.nav.register],
  ];
  // Направления ведут в каталог тестов сразу на нужную вкладку (#kk/ubt …)
  const tests = ["ubt", "nis", "bil", "rfmm"].map((k) => [`${catalogHref}#${lang}/${k}`, t.catalog.dirs[k].t + " — " + t.catalog.dirs[k].d]);

  return (
    <footer id="contacts" className="relative overflow-hidden bg-linear-to-b from-ink to-ink-2 text-white">
      <div aria-hidden className="pointer-events-none absolute -top-40 right-[-10%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(closest-side,rgba(109,63,217,0.35),transparent)]" />
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_1.1fr_1fr]">
        <div>
          <a href={homeHref} onClick={onHome} className="inline-flex rounded-2xl bg-white px-4 py-3 shadow-lg transition hover:scale-[1.02]" aria-label={t.nav.home}>
            <img src={`${base}img/eduapp-logo.svg`} alt="EDUAPP" width="185" height="48" className="h-9 w-auto" loading="lazy" />
          </a>
          <p className="mt-5 max-w-sm leading-relaxed text-white/70">{f.about}</p>
        </div>

        <nav aria-label={f.navTitle}>
          <p className="text-sm font-bold tracking-[0.16em] text-white/50 uppercase">{f.navTitle}</p>
          <ul className="mt-5 space-y-3">
            {nav.map(([href, label]) => (
              <li key={label}>
                <a href={href} className="text-white/80 transition hover:text-teal">{label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={f.testsTitle}>
          <p className="text-sm font-bold tracking-[0.16em] text-white/50 uppercase">{f.testsTitle}</p>
          <ul className="mt-5 space-y-3">
            {tests.map(([href, label]) => (
              <li key={label}>
                <a href={href} className="text-white/80 transition hover:text-teal">{label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="text-sm font-bold tracking-[0.16em] text-white/50 uppercase">{f.contactsTitle}</p>
          <address className="mt-5 space-y-3 not-italic">
            <p className="flex items-start gap-3 text-white/80">
              <Icon.MapPin className="mt-0.5 h-5 w-5 shrink-0 text-teal" /> {f.address}
            </p>
            <a href={`mailto:${CONTACTS.email}`} className="flex items-center gap-3 text-white/80 transition hover:text-teal">
              <Icon.Mail className="h-5 w-5 shrink-0 text-teal" /> {CONTACTS.email}
            </a>
          </address>
          <p className="mt-7 text-sm font-bold tracking-[0.16em] text-white/50 uppercase">{f.social}</p>
          <div className="mt-4 flex gap-3">
            {CONTACTS.socials.map((s) => {
              const SocialIcon = SOCIAL_ICONS[s.id];
              return (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener"
                  aria-label={`EduApp ${s.label}`}
                  className="grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-white/5 text-white/80 transition duration-300 hover:-translate-y-0.5 hover:border-teal hover:bg-teal/15 hover:text-white"
                >
                  <SocialIcon className="h-5 w-5" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-6 text-sm text-white/50 sm:px-6">
          © 2016–{year} EDUAPP. {f.rights}
        </p>
      </div>
    </footer>
  );
}
