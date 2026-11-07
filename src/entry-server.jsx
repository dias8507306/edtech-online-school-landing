// Пререндер: превращает React-приложение в готовый HTML для каждой страницы и языка
import { renderToString } from "react-dom/server";
import App from "./App.jsx";
import rawTests from "./tests-data.json";
import { cleanCatalog } from "./testsCatalog.js";

export { head } from "./seo.js";

// Снимок каталога тестов: тот же объект попадает в HTML (пререндер) и в assets/tests-data.js (для браузера)
export const catalog = cleanCatalog(rawTests);

// base — путь к корню сайта от страницы: / → "./", /ru/, /catalog/, /register/ → "../", /ru/catalog/, /ru/register/ → "../../"
export const baseFor = (lang, page) => "../".repeat((lang === "ru" ? 1 : 0) + (page === "home" ? 0 : 1)) || "./";

export function render(lang, page = "home") {
  return renderToString(<App lang={lang} base={baseFor(lang, page)} page={page} tests={page === "catalog" ? catalog : null} />);
}
