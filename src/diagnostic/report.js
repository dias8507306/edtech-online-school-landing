// Подсчёт результатов диагностики и правила рекомендаций.
// Чистые функции без React: их легко проверить и при желании перенести на сервер.
import { CATEGORIES, SUBJECTS } from "./questions.js";
import { LINKS, PACKAGES } from "../data.js";
import { fill } from "../hooks.js";

// Пороги статуса темы и общего уровня, в процентах
export const THRESHOLDS = { strong: 80, medium: 50 };
export const statusOf = (percent) => (percent >= THRESHOLDS.strong ? "strong" : percent >= THRESHOLDS.medium ? "medium" : "weak");

// Цвета статусов. Цвет никогда не используется один: рядом всегда иконка и подпись
export const STATUS_COLORS = {
  strong: "#0ca30c",
  medium: "#fab219",
  weak: "#d03b3b",
  correct: "#0ca30c",
  wrong: "#d03b3b",
  skipped: "#94a3b8",
};

export const subjectById = (id) => SUBJECTS.find((s) => s.id === id);

/**
 * answers[i] — индекс выбранного ответа или null («Білмеймін» / пропуск)
 * times[i]   — секунды, потраченные на вопрос
 */
export function buildReport({ subjectId, questions, answers, times }) {
  const subject = subjectById(subjectId);
  const items = questions.map((q, i) => {
    const answer = answers[i] ?? null;
    const result = answer === null ? "skipped" : answer === q.c ? "correct" : "wrong";
    return { id: q.id, topic: q.topic, answer, right: q.c, result, timeSec: times[i] ?? 0 };
  });

  const count = (result) => items.filter((x) => x.result === result).length;
  const total = items.length;
  const correct = count("correct");
  const wrong = count("wrong");
  const skipped = count("skipped");
  const timeSec = items.reduce((sum, x) => sum + x.timeSec, 0);
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

  const topics = subject.topics
    .map((topic) => {
      const own = items.filter((x) => x.topic === topic.id);
      const ok = own.filter((x) => x.result === "correct").length;
      const percent = own.length ? Math.round((ok / own.length) * 100) : 0;
      return { id: topic.id, correct: ok, total: own.length, percent, status: statusOf(percent) };
    })
    .filter((t) => t.total > 0);

  const percent = pct(correct);
  return {
    subjectId,
    total,
    correct,
    wrong,
    skipped,
    percent,
    errorPercent: pct(wrong + skipped), // доля нерешённых: ошибки + пропуски
    timeSec,
    avgSec: total ? Math.round(timeSec / total) : 0,
    level: statusOf(percent),
    topics,
    strengths: topics.filter((t) => t.status === "strong"),
    weaknesses: topics.filter((t) => t.status !== "strong").sort((a, b) => a.percent - b.percent),
    items,
  };
}

// Ссылка на полный пробный тест выбранного направления на eduapp.example.com
export function fullTestUrl(choice, lang) {
  const pk = PACKAGES[lang];
  const category = CATEGORIES.find((c) => c.id === choice.category);
  if (!category) return LINKS.tests(pk.ubt);
  return category.id === "grades" ? LINKS.tests(pk.grades, choice.grade) : LINKS.tests(pk[category.pkg]);
}

// Название направления для текста: «НЗМ», «ҰБТ», «6-сынып»…
export function categoryName(choice, d) {
  if (choice.category === "grades") return fill(d.category.gradeName, { g: choice.grade });
  return d.category.items[choice.category]?.t ?? "";
}

/**
 * Правила рекомендаций (по порядку):
 * 1) до 3 самых слабых тем — совет по каждой;
 * 2) формат обучения (оффлайн / онлайн);
 * 3) общий уровень + направление (следующий шаг);
 * 4) пропущенные вопросы;
 * 5) темп: слишком быстро с ошибками или слишком медленно.
 */
export function buildRecommendations(report, choice, d, lang) {
  const rec = d.rec;
  const subject = subjectById(report.subjectId);
  const list = [];

  for (const t of report.weaknesses.slice(0, 3)) {
    const topic = subject.topics.find((x) => x.id === t.id);
    list.push({ id: `topic-${t.id}`, icon: "Target", status: t.status, title: topic.name[lang], text: topic.tip[lang] });
  }

  const format = rec[choice.format] ?? rec.online;
  list.push({ id: "format", icon: choice.format === "offline" ? "School" : "Laptop", title: format.t, text: format.d });

  const level = rec.level[report.level];
  list.push({ id: "level", icon: "Trophy", title: level.t, text: fill(level.d, { cat: categoryName(choice, d) }) });

  if (report.skipped > 0) list.push({ id: "skipped", icon: "MinusCircle", title: rec.skipped.t, text: fill(rec.skipped.d, { n: report.skipped }) });

  if (report.avgSec > 0 && report.avgSec < 12 && report.wrong >= 2) {
    list.push({ id: "speed", icon: "Timer", title: rec.speed.fast.t, text: fill(rec.speed.fast.d, { s: report.avgSec }) });
  } else if (report.avgSec > 90) {
    list.push({ id: "speed", icon: "Timer", title: rec.speed.slow.t, text: fill(rec.speed.slow.d, { s: report.avgSec }) });
  }

  return list;
}
