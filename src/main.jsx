import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.jsx";
import { applyHead, langFromPath } from "./seo.js";
import "./index.css";

const root = document.getElementById("root");
// Страница каталога помечена <html data-page="catalog">, снимок каталога — window.EA_TESTS (assets/tests-data.js)
const page = ["catalog", "register"].includes(document.documentElement.dataset.page) ? document.documentElement.dataset.page : "home";
const tests = page === "catalog" ? window.EA_TESTS ?? null : null;
const depth = (lang) => (lang === "ru" ? 1 : 0) + (page === "home" ? 0 : 1);
const baseFor = (lang) => "../".repeat(depth(lang)) || "./";

if (root.firstElementChild) {
  // Собранная страница: HTML уже есть (пререндер), React только «оживляет» его
  const lang = document.documentElement.lang === "ru" ? "ru" : "kk";
  hydrateRoot(root, <StrictMode><App lang={lang} base={baseFor(lang)} page={page} tests={tests} /></StrictMode>);
} else {
  // Режим разработки (npm run dev): русская версия — /ru/ или ?lang=ru (каталог в dev — после сборки)
  const inRuFolder = langFromPath(window.location.pathname) === "ru";
  const lang = inRuFolder || new URLSearchParams(window.location.search).get("lang") === "ru" ? "ru" : "kk";
  document.documentElement.classList.add("js");
  applyHead(lang);
  createRoot(root).render(<StrictMode><App lang={lang} base={inRuFolder ? "../" : "./"} /></StrictMode>);
}
