// SEO-теги <head> для каждой языковой версии (title, description, hreflang, Open Graph, JSON-LD)
import { T } from "./i18n.js";
import { CONTACTS } from "./data.js";

const SITE_URL = "https://eduapp.example.com/";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function jsonLd(lang, url) {
  const t = T[lang];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "@id": SITE_URL + "#org",
        name: "EduApp",
        alternateName: ["EduApp ақыл-ой дамыту мектебі", "EduApp Online", "EduApp Tests"],
        url: SITE_URL,
        logo: SITE_URL + "img/eduapp-logo.svg",
        email: CONTACTS.email,
        address: { "@type": "PostalAddress", streetAddress: "ул. Примерная, 1", addressLocality: "Астана", addressCountry: "KZ" },
        areaServed: { "@type": "Country", name: "Kazakhstan" },
        sameAs: CONTACTS.socials.map((s) => s.url),
      },
      { "@type": "WebSite", "@id": SITE_URL + "#website", url: SITE_URL, name: "EduApp Tests & Online", inLanguage: ["kk", "ru"], publisher: { "@id": SITE_URL + "#org" } },
      {
        "@type": "WebPage",
        "@id": url + "#webpage",
        url,
        name: t.meta.title,
        description: t.meta.description,
        inLanguage: lang,
        isPartOf: { "@id": SITE_URL + "#website" },
        about: { "@id": SITE_URL + "#org" },
      },
      {
        "@type": "ItemList",
        name: t.catalog.h2,
        itemListElement: ["ubt", "nis", "bil", "rfmm"].map((k, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Course",
            name: `${t.catalog.dirs[k].t} — ${t.catalog.dirs[k].d}`,
            description: t.meta.description,
            inLanguage: lang,
            provider: { "@id": SITE_URL + "#org" },
          },
        })),
      },
    ],
  };
}

// Каталог тестов: CollectionPage + хлебные крошки
function catalogLd(lang, url) {
  const t = T[lang];
  const home = lang === "ru" ? SITE_URL + "ru/" : SITE_URL;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": url + "#webpage",
        url,
        name: t.testsPage.meta.title,
        description: t.testsPage.meta.description,
        inLanguage: lang,
        isPartOf: { "@id": SITE_URL + "#website" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t.testsPage.crumbHome, item: home },
          { "@type": "ListItem", position: 2, name: t.testsPage.crumb, item: url },
        ],
      },
    ],
  };
}

const PAGE_DIR = { home: "", catalog: "catalog/", register: "register/" };
const pageUrl = (lang, page) => SITE_URL + (lang === "ru" ? "ru/" : "") + PAGE_DIR[page];
const metaOf = (lang, page) => (page === "catalog" ? T[lang].testsPage.meta : page === "register" ? T[lang].registerPage.meta : T[lang].meta);

// "/ru/" или "/ru/index.html" → русская версия, всё остальное — казахская
export const langFromPath = (path) => (/\/ru(\/(index\.html)?)?$/.test(path) ? "ru" : "kk");

// Браузер: после мгновенной смены языка обновляем <html lang>, title, description, canonical и Open Graph
export function applyHead(lang, page = "home") {
  const meta = metaOf(lang, page);
  const url = pageUrl(lang, page);
  const set = (selector, attr, value) => document.querySelector(selector)?.setAttribute(attr, value);
  document.documentElement.lang = lang;
  document.title = meta.title;
  set('meta[name="description"]', "content", meta.description);
  set('link[rel="canonical"]', "href", url);
  set('meta[property="og:url"]', "content", url);
  set('meta[property="og:title"]', "content", meta.title);
  set('meta[property="og:description"]', "content", meta.description);
  set('meta[property="og:locale"]', "content", lang === "ru" ? "ru_RU" : "kk_KZ");
}

export function head(lang, page = "home") {
  const t = T[lang];
  const meta = metaOf(lang, page);
  const url = pageUrl(lang, page);
  const ld = JSON.stringify(page === "catalog" ? catalogLd(lang, url) : jsonLd(lang, url)).replace(/</g, "\\u003c");
  // Иконки вкладки — свои квадратные файлы рядом с сайтом (раньше стоял широкий логотип: в 16 px он не виден).
  // Путь относительный, чтобы иконка работала и на localhost, и с диска: / → "./", /ru/ и /catalog/ → "../", /ru/catalog/ → "../../"
  const rel = "../".repeat((lang === "ru" ? 1 : 0) + (page === "home" ? 0 : 1)) || "./";
  return `<title>${esc(meta.title)}</title>
    <meta name="description" content="${esc(meta.description)}" />
    <meta name="robots" content="${page === "register" ? "noindex, follow" : "index, follow, max-image-preview:large"}" />
    <link rel="canonical" href="${url}" />
    <link rel="alternate" hreflang="kk-KZ" href="${pageUrl("kk", page)}" />
    <link rel="alternate" hreflang="ru-KZ" href="${pageUrl("ru", page)}" />
    <link rel="alternate" hreflang="x-default" href="${pageUrl("kk", page)}" />
    <meta name="theme-color" content="#1e1638" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="EduApp Tests &amp; Online" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${esc(meta.title)}" />
    <meta property="og:description" content="${esc(meta.description)}" />
    <!-- TODO: картинка 1200×630 для превью в мессенджерах -->
    <meta property="og:image" content="${SITE_URL}og-image.jpg" />
    <meta property="og:locale" content="${lang === "ru" ? "ru_RU" : "kk_KZ"}" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" href="${rel}favicon.ico" sizes="any" />
    <link rel="icon" type="image/svg+xml" href="${rel}img/favicon.svg" />
    <link rel="apple-touch-icon" href="${rel}img/apple-touch-icon.png" />
    <script>document.documentElement.classList.add("js")</script>
    <script type="application/ld+json">${ld}</script>`;
}
