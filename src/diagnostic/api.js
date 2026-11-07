// Работа с сервером для диагностики.
// Сейчас бэкенда нет: вопросы берутся из questions.js, результат считается в браузере (report.js).
// Чтобы подключить API, укажите адрес в API_BASE и сделайте эндпоинты из ТОЛЫҚ-АНАЛИТИКА.md (раздел 6 «API»).
import { getLocalQuestions } from "./questions.js";

export const API_BASE = ""; // например: "https://eduapp.example.com/api"

/**
 * Вопросы для диагностики.
 * GET {API_BASE}/diagnostic/questions?subject=math&category=nis&grade=6&lang=kk
 * Ответ: { questions: [{ id, topic, q, a, c? }] }
 */
export async function fetchQuestions({ subject, category, grade, lang }, signal) {
  if (!API_BASE) return getLocalQuestions(subject);
  const params = new URLSearchParams({ subject, category, lang });
  if (grade) params.set("grade", grade);
  const res = await fetch(`${API_BASE}/diagnostic/questions?${params}`, { signal, credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.questions;
}

/**
 * Сохранить результат (для личного кабинета, CRM и статистики).
 * POST {API_BASE}/diagnostic/results  — тело: см. ТОЛЫҚ-АНАЛИТИКА.md
 */
export async function submitResult(payload) {
  if (!API_BASE) return { ok: true, saved: false };
  try {
    const res = await fetch(`${API_BASE}/diagnostic/results`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return { ok: res.ok, saved: res.ok };
  } catch {
    return { ok: false, saved: false };
  }
}

// События для Google Tag Manager / Яндекс Метрики. Если счётчика на странице нет — ничего не происходит.
export function track(event, params = {}) {
  if (typeof window !== "undefined" && Array.isArray(window.dataLayer)) window.dataLayer.push({ event, ...params });
}
