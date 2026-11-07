// Каталог сынақ тестов: правила фильтров и адреса. Сами данные (снимок eduapp.example.com, src/tests-data.json)
// сюда не импортируются: страница каталога получает их из assets/tests-data.js, а главная их вообще не грузит.

// Куда ведёт «Бастау» — страница теста на текущей платформе
export const TEST_URL = (id) => `https://eduapp.example.com/Test/Overview/${id}`;

export const CATALOG_PACKAGES = ["ubt", "nis", "bil", "rfmm", "grades"];

// Названия предметов: у казахских классов они на казахском, у русских — на русском. В интерфейсе показываем на языке сайта
const SUBJ_RU = {
  "Ағылшын тілі": "Английский язык",
  "Оқу сауаттылығы": "Грамотность чтения",
  "Қазақ әдебиеті": "Казахская литература",
  "Сандық сипаттамалар": "Числовые характеристики",
  "Орыс тілі": "Русский язык",
  "Қазақстан тарихы": "История Казахстана",
  "Қазақ тілі": "Казахский язык",
  "Дүниежүзі тарихы": "Всемирная история",
  "Адам және құқық": "Человек и право",
  "Математикалық сауаттылық": "Математическая грамотность",
};
const SUBJ_KK = Object.fromEntries(Object.entries(SUBJ_RU).map(([kk, ru]) => [ru, kk]));
export const subjectName = (name, lang) => (lang === "ru" ? SUBJ_RU[name] : SUBJ_KK[name]) || name;

// Тесты-заглушки вроде «1» или «тест» отбрасываем, пустые разделы — тоже
export function cleanCatalog(raw) {
  const data = JSON.parse(JSON.stringify(raw));
  for (const pk of Object.values(data.packages))
    for (const l of Object.values(pk)) {
      for (const s of l.sections) s.tests = s.tests.filter((x) => x.title.replace(/[\s\d.\-]/g, "").length >= 2);
      l.sections = l.sections.filter((s) => s.tests.length);
    }
  return data;
}

const norm = (s) => String(s).toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim();

export function matchTest(test, f) {
  if (f.subject && !test.subjects?.includes(f.subject)) return false;
  if (f.grade && test.grade !== f.grade) return false;
  if (f.q && !norm(`${test.title} ${test.desc || ""}`).includes(norm(f.q))) return false;
  return true;
}

export const countTests = (p) => (p ? p.sections.reduce((n, s) => n + s.tests.length, 0) : 0);

// «МАТЕМАТИКА+ФИЗИКА (+3 міндетті пән "ҰБТ-2025")» → { main: "МАТЕМАТИКА + ФИЗИКА", sub: "+3 міндетті пән «ҰБТ-2025»" }
// «НЗМ (математика 6 сынып)» → { main: "Математика 6 сынып", sub: "НЗМ" } — короткое начало менее информативно, чем скобки
export function splitTitle(title) {
  const m = String(title).match(/^(.*?)\s*\((.+)\)\s*$/);
  const tidy = (s) => s.replace(/\s*\+\s*/g, " + ").replace(/^\s*\+\s*/, "+").replace(/"([^"]*)"/g, "«$1»").replace(/\s+/g, " ").trim();
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  if (!m) return { main: tidy(title), sub: "" };
  if (m[1].trim().length <= 5) return { main: cap(tidy(m[2])), sub: tidy(m[1]) };
  return { main: tidy(m[1]), sub: tidy(m[2]) };
}

// Адрес состояния каталога: #kk/ubt, #kk/ubt/112 (открытый раздел), #kk/grades/g6 (фильтр по классу)
export function parseHash(hash) {
  const m = String(hash).match(/^#(kk|ru)\/(ubt|nis|bil|rfmm|grades)(?:\/(\d+))?(?:\/g(\d+))?$/);
  return m ? { cls: m[1], pk: m[2], section: m[3] ? +m[3] : null, grade: m[4] ? +m[4] : 0 } : null;
}
export const makeHash = (s) => `#${s.cls}/${s.pk}${s.section ? `/${s.section}` : ""}`;

// Склонение для русского: 1 тест, 2 теста, 5 тестов. В казахском форма одна
export function plural(n, forms) {
  if (!Array.isArray(forms)) return forms;
  const a = Math.abs(n) % 100, b = a % 10;
  return forms[a > 10 && a < 20 ? 2 : b > 1 && b < 5 ? 1 : b === 1 ? 0 : 2];
}
