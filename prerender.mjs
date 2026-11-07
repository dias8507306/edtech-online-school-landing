// Шаг 3 сборки: создаёт готовые HTML-страницы:
//   dist/index.html (kk), dist/ru/index.html (ru) — главная;
//   dist/catalog/index.html, dist/ru/catalog/index.html — каталог сынақ тестов;
//   dist/register/index.html, dist/ru/register/index.html — регистрация.
// Поисковики получают весь текст сразу, без выполнения JavaScript.
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, "dist");
const template = await fs.readFile(path.join(dist, "index.html"), "utf8");
const { render, head, catalog, baseFor } = await import(pathToFileURL(path.join(root, "dist-ssr", "entry-server.js")).href);

// Бандл должен быть одним файлом без import/export — тогда его можно подключить обычным <script defer>.
// Оборачиваем код в функцию: переменные не попадают в глобальную область, режим strict как у модулей.
for (const file of await fs.readdir(path.join(dist, "assets"))) {
  if (!file.endsWith(".js") || file === "tests-data.js") continue;
  const jsPath = path.join(dist, "assets", file);
  const code = await fs.readFile(jsPath, "utf8");
  if (code.startsWith("(function(){")) continue;
  if (/(^|[;}\n])\s*(import\s*[{*\w"'`]|export\s*[{*])|\bimport\s*\(|import\.meta/.test(code)) {
    throw new Error(`${file}: найден import/export — бандл нельзя подключить через <script defer>`);
  }
  await fs.writeFile(jsPath, `(function(){"use strict";\n${code}\n})();\n`, "utf8");
}

// Снимок каталога для браузера (страница каталога; главная его не грузит)
const testsJs = `/* Каталог сынақ тестов (снимок ${catalog.source} от ${catalog.updated}) */\nwindow.EA_TESTS=${JSON.stringify(catalog)};\n`;
await fs.writeFile(path.join(dist, "assets", "tests-data.js"), testsJs, "utf8");
const testsVer = createHash("md5").update(testsJs).digest("hex").slice(0, 8);

// Обычный <script defer> вместо модуля и без crossorigin — так стили и скрипт грузятся и с диска (file://)
const fixAssets = (html) =>
  html
    .replace(/<script type="module" crossorigin src=/g, `<script defer onerror="document.documentElement.classList.remove('js')" src=`)
    .replace(/<link rel="stylesheet" crossorigin href=/g, '<link rel="stylesheet" href=');

const pages = [
  { lang: "kk", page: "home", out: "index.html" },
  { lang: "ru", page: "home", out: "ru/index.html" },
  { lang: "kk", page: "catalog", out: "catalog/index.html" },
  { lang: "ru", page: "catalog", out: "ru/catalog/index.html" },
  { lang: "kk", page: "register", out: "register/index.html" },
  { lang: "ru", page: "register", out: "ru/register/index.html" },
];

let stats = { sections: 0, tests: 0 };
for (const pk of Object.values(catalog.packages)) for (const l of Object.values(pk)) {
  stats.sections += l.sections.length;
  stats.tests += l.sections.reduce((n, s) => n + s.tests.length, 0);
}

for (const { lang, page, out } of pages) {
  const base = baseFor(lang, page);
  let html = fixAssets(template)
    .replace('<html lang="kk">', `<html lang="${lang}"${page === "home" ? "" : ` data-page="${page}"`}>`)
    .replace("<!--head-->", head(lang, page))
    .replace("<!--app-->", render(lang, page));
  // Страницы во вложенных папках — поправляем путь к стилям и скриптам
  html = html.replaceAll('"./assets/', `"${base}assets/`);
  // Каталогу нужен снимок тестов — подключаем его перед основным скриптом (defer сохраняет порядок)
  if (page === "catalog") html = html.replace("<script defer onerror=", `<script defer src="${base}assets/tests-data.js?v=${testsVer}"></script>\n    <script defer onerror=`);
  const file = path.join(dist, out);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, html, "utf8");
  console.log(`✓ ${path.relative(root, file)}  (${(html.length / 1024).toFixed(1)} KB)`);
}
console.log(`✓ dist/assets/tests-data.js  (${stats.tests} тест, ${stats.sections} бөлім, ${(testsJs.length / 1024).toFixed(0)} KB)`);

await fs.rm(path.join(root, "dist-ssr"), { recursive: true, force: true });
