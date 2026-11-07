import { useId, useRef, useState } from "react";
import { Icon } from "./Icons.jsx";
import { AUTH_API, LINKS } from "../data.js";
import { fill } from "../hooks.js";

// +7 (700) 000-00-00 ← любые цифры; на сервер уходит «+77000000000» (формат, который ждёт платформа)
const phoneDigits = (v) => {
  let d = String(v).replace(/\D/g, "");
  if (d.startsWith("8")) d = "7" + d.slice(1);
  if (d && !d.startsWith("7")) d = "7" + d;
  return d.slice(0, 11);
};
const formatPhone = (v) => {
  const d = phoneDigits(v);
  if (!d) return "";
  const p = d.slice(1);
  let out = "+7";
  if (p.length) out += " (" + p.slice(0, 3);
  if (p.length >= 3) out += ")";
  if (p.length > 3) out += " " + p.slice(3, 6);
  if (p.length > 6) out += "-" + p.slice(6, 8);
  if (p.length > 8) out += "-" + p.slice(8, 10);
  return out;
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE = /^[\p{L}\s'’-]+$/u;
const FIELD_KEYS = ["FirstName", "LastName", "Email", "MobileNumber", "Password", "PasswordConfirm"];

/**
 * Страница «Тіркелу» (/register/). Отправляет те же данные и в тот же сервис, что старая страница платформы
 * (POST /Account/Register), но: проверяет поля сразу, маска телефона, показ пароля, ошибки — под полем и на языке сайта,
 * кнопка блокируется на время отправки, email не попадает в адрес страницы (успех показывается здесь же).
 */
export default function RegisterPage({ t, homeHref }) {
  const r = t.registerPage;
  const uid = useId();
  const [mode, setMode] = useState("email"); // email | mobile
  const [v, setV] = useState({ FirstName: "", LastName: "", Email: "", MobileNumber: "", Password: "", PasswordConfirm: "" });
  const [touched, setTouched] = useState({});
  const [serverErr, setServerErr] = useState({}); // ошибки полей от сервера
  const [alert, setAlert] = useState(null); // { kind: "error" | "info", text }
  const [showPass, setShowPass] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(null); // email после успешной регистрации
  const formRef = useRef(null);

  const mobile = mode === "mobile";
  const visible = ["FirstName", "LastName", mobile ? "MobileNumber" : "Email", "Password", "PasswordConfirm"];

  function validate(key, vals = v) {
    const val = String(vals[key] ?? "").trim();
    if (!val) return r.errRequired;
    if ((key === "FirstName" || key === "LastName") && !NAME_RE.test(val)) return r.errName;
    if (key === "Email" && !EMAIL_RE.test(val)) return r.errEmail;
    if (key === "MobileNumber" && phoneDigits(val).length !== 11) return r.errPhone;
    if (key === "Password" && vals.Password.length < 6) return r.errPassShort;
    if (key === "PasswordConfirm" && vals.PasswordConfirm !== vals.Password) return r.errPassMismatch;
    return "";
  }
  const errorOf = (key) => serverErr[key] || (touched[key] ? validate(key) : "");

  function change(key, raw) {
    const value = key === "MobileNumber" ? formatPhone(raw) : raw;
    setV((prev) => ({ ...prev, [key]: value }));
    setServerErr((prev) => ({ ...prev, [key]: "" }));
    setAlert(null);
  }

  async function submit(e) {
    e.preventDefault();
    if (sending) return;
    const all = Object.fromEntries(visible.map((k) => [k, true]));
    setTouched(all);
    const firstBad = visible.find((k) => validate(k));
    if (firstBad) {
      formRef.current?.querySelector(`[name="${firstBad}"]`)?.focus();
      return;
    }
    // Тот же формат, что у старой страницы ($.post с объектом model)
    const model = {
      FirstName: v.FirstName.trim(),
      LastName: v.LastName.trim(),
      RegisterWithMobile: mobile,
      MobileNumber: mobile ? "+" + phoneDigits(v.MobileNumber) : "",
      Email: mobile ? "" : v.Email.trim(),
      Password: v.Password,
      PasswordConfirm: v.PasswordConfirm,
    };
    const body = new URLSearchParams();
    for (const [k, val] of Object.entries(model)) body.append(`model[${k}]`, String(val));

    setSending(true);
    setAlert(null);
    let data = null;
    try {
      const res = await fetch(AUTH_API.register, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "X-Requested-With": "XMLHttpRequest" },
        body,
        credentials: "same-origin",
      });
      try {
        data = await res.json();
      } catch {
        data = null;
      }
    } catch {
      setSending(false);
      setAlert({ kind: "error", text: r.errNetwork });
      return;
    }
    setSending(false);

    if (!data) {
      // Не наш домен (например, предпросмотр на localhost) или сервер не ответил
      const onPlatform = /(^|\.)eduapp\.example\.com$/.test(window.location.hostname);
      setAlert({ kind: onPlatform ? "error" : "info", text: onPlatform ? r.errNoServer : r.previewNote });
      return;
    }
    if (data.Success) {
      if (mobile) window.location.href = AUTH_API.activation;
      else setDone(model.Email);
      return;
    }
    // Ошибки сервера: по полям — под полем, остальные — общим сообщением
    const fieldErr = {};
    const general = [...(data.Errors ?? [])];
    for (const me of data.ModelErrors ?? []) {
      const key = String(me.Item1 ?? "").split(/[.[\]]/).filter(Boolean).pop();
      if (FIELD_KEYS.includes(key) && visible.includes(key)) fieldErr[key] = me.Item2;
      else if (me.Item2) general.push(me.Item2);
    }
    setServerErr(fieldErr);
    if (general.length) setAlert({ kind: "error", text: general.join(" ") });
    else if (!Object.keys(fieldErr).length) setAlert({ kind: "error", text: r.errNoServer });
  }

  const field = (key, { label, type = "text", icon: FieldIcon, autoComplete, placeholder, inputMode, hint }) => {
    const id = `${uid}-${key}`;
    const err = errorOf(key);
    const isPass = key === "Password" || key === "PasswordConfirm";
    return (
      <div key={key}>
        <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">{label}</label>
        <div className="relative">
          <FieldIcon className={`pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 ${err ? "text-red-500" : "text-muted"}`} />
          <input
            id={id}
            name={key}
            type={isPass ? (showPass ? "text" : "password") : type}
            value={v[key]}
            onChange={(e) => change(key, e.target.value)}
            onBlur={() => setTouched((p) => ({ ...p, [key]: true }))}
            autoComplete={autoComplete}
            inputMode={inputMode}
            placeholder={placeholder}
            aria-invalid={err ? "true" : undefined}
            aria-describedby={err ? `${id}-err` : hint ? `${id}-hint` : undefined}
            className={`h-12 w-full rounded-2xl border bg-white pr-12 pl-11 text-[15px] font-medium text-ink transition outline-none placeholder:text-muted/70 focus:ring-4 ${
              err ? "border-red-400 focus:border-red-500 focus:ring-red-100" : "border-line focus:border-teal focus:ring-teal/15"
            }`}
          />
          {key === "Password" && (
            <button
              type="button"
              onClick={() => setShowPass((s) => !s)}
              aria-label={showPass ? r.hide : r.show}
              aria-pressed={showPass}
              className="absolute top-1/2 right-2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-muted transition hover:bg-surface hover:text-ink"
            >
              {showPass ? <Icon.EyeOff className="h-5 w-5" /> : <Icon.Eye className="h-5 w-5" />}
            </button>
          )}
          {!err && touched[key] && !validate(key) && key !== "Password" && (
            <Icon.CheckCircle className="pointer-events-none absolute top-1/2 right-3.5 h-5 w-5 -translate-y-1/2 text-green" />
          )}
        </div>
        {err ? (
          <p id={`${id}-err`} role="alert" className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-red-600">
            <Icon.AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {err}
          </p>
        ) : (
          hint && <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">{hint}</p>
        )}
      </div>
    );
  };

  return (
    <section className="relative overflow-hidden pt-28 pb-20 lg:pt-36 lg:pb-28">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-32 h-[480px] w-[480px] animate-blob rounded-full bg-[radial-gradient(closest-side,rgba(34,193,214,0.3),transparent)]" />
        <div className="absolute top-10 right-[-160px] h-[520px] w-[520px] animate-blob rounded-full bg-[radial-gradient(closest-side,rgba(109,63,217,0.24),transparent)]" style={{ animationDelay: "-6s" }} />
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
        {/* Зачем регистрироваться */}
        <aside className="order-2 rounded-3xl bg-linear-to-br from-violet via-blue to-teal p-7 text-white shadow-[0_30px_60px_-30px_rgba(109,63,217,0.7)] sm:p-9 lg:order-1 lg:sticky lg:top-28">
          <p className="text-sm font-bold tracking-[0.18em] text-white/75 uppercase">{r.sideKicker}</p>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{r.sideT}</h2>
          <ul className="mt-6 space-y-4">
            {r.benefits.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/20"><Icon.Check className="h-4 w-4" /></span>
                <span className="leading-relaxed text-white/95">{b}</span>
              </li>
            ))}
          </ul>
          <p className="mt-7 flex items-center gap-2 rounded-2xl bg-white/12 px-4 py-3 text-sm font-semibold text-white/90">
            <Icon.ShieldCheck className="h-5 w-5 shrink-0" /> {r.sideNote}
          </p>
        </aside>

        {/* Форма */}
        <div className="order-1 rounded-3xl border border-line bg-white p-6 shadow-[0_40px_80px_-44px_rgba(30,22,56,0.5)] sm:p-9 lg:order-2">
          <nav aria-label={r.crumbL} className="text-sm font-semibold text-muted">
            <a href={homeHref} className="transition hover:text-blue">{r.crumbHome}</a>
            <Icon.ChevronRight className="mx-1 inline h-4 w-4 align-[-3px]" />
            <span className="text-ink">{r.h1}</span>
          </nav>

          {done ? (
            <div className="py-6 text-center" aria-live="polite">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green/15 text-green-dark"><Icon.CheckCircle className="h-9 w-9" /></span>
              <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{r.successT}</h1>
              <p className="mx-auto mt-3 max-w-md leading-relaxed text-ink/80">{fill(r.successD, { email: done })}</p>
              <p className="mt-2 text-sm text-muted">{r.successHint}</p>
              <a href={LINKS.login} className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-green via-emerald-500 to-teal px-6 py-3.5 font-bold text-white shadow-[0_16px_32px_-16px_rgba(22,192,96,0.9)] transition hover:-translate-y-0.5">
                {r.successBtn} <Icon.ArrowRight className="h-5 w-5" />
              </a>
            </div>
          ) : (
            <>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{r.h1}</h1>
              <p className="mt-2 text-muted">{r.sub}</p>

              <div role="radiogroup" aria-label={r.modeL} className="relative mt-6 grid grid-cols-2 rounded-2xl bg-surface p-1.5 ring-1 ring-line">
                <span
                  aria-hidden
                  className={`absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] rounded-xl bg-white shadow-[0_6px_16px_-8px_rgba(30,22,56,0.35)] ring-1 ring-line transition-transform duration-300 ${mobile ? "translate-x-full" : "translate-x-0"}`}
                />
                {[["email", r.byEmail, Icon.Mail], ["mobile", r.byPhone, Icon.Phone]].map(([key, label, ModeIcon]) => (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={mode === key}
                    onClick={() => { setMode(key); setServerErr({}); setAlert(null); }}
                    className={`relative z-10 inline-flex items-center justify-center gap-2 py-2.5 text-sm font-bold transition-colors ${mode === key ? "text-ink" : "text-ink/55 hover:text-ink"}`}
                  >
                    <ModeIcon className="h-4 w-4" /> {label}
                  </button>
                ))}
              </div>

              <form ref={formRef} onSubmit={submit} noValidate className="mt-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {field("FirstName", { label: r.firstName, icon: Icon.User, autoComplete: "given-name", placeholder: r.firstNamePh })}
                  {field("LastName", { label: r.lastName, icon: Icon.User, autoComplete: "family-name", placeholder: r.lastNamePh })}
                </div>
                {mobile
                  ? field("MobileNumber", { label: r.phone, type: "tel", icon: Icon.Phone, autoComplete: "tel", inputMode: "tel", placeholder: "+7 (___) ___-__-__", hint: r.phoneHint })
                  : field("Email", { label: r.email, type: "email", icon: Icon.Mail, autoComplete: "email", inputMode: "email", placeholder: "name@example.com", hint: r.emailHint })}
                {field("Password", { label: r.password, icon: Icon.Lock, autoComplete: "new-password", placeholder: "••••••", hint: r.passHint })}
                {field("PasswordConfirm", { label: r.confirm, icon: Icon.Lock, autoComplete: "new-password", placeholder: "••••••" })}

                {alert && (
                  <p role="alert" className={`flex items-start gap-2 rounded-2xl border p-3.5 text-sm font-medium ${alert.kind === "info" ? "border-blue/25 bg-blue/5 text-ink" : "border-red-200 bg-red-50 text-red-700"}`}>
                    {alert.kind === "info" ? <Icon.Help className="mt-0.5 h-4 w-4 shrink-0 text-blue" /> : <Icon.AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
                    {alert.text}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="group relative inline-flex h-13 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-linear-to-r from-green via-emerald-500 to-teal py-3.5 text-base font-bold text-white shadow-[0_20px_40px_-16px_rgba(22,192,96,0.85)] transition duration-300 hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-80"
                >
                  {sending ? <Icon.Loader className="h-5 w-5 animate-spin" /> : null}
                  {sending ? r.sending : r.submit}
                  {!sending && <Icon.ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-muted">
                {r.haveAccount}{" "}
                <a href={LINKS.login} className="font-bold text-blue underline-offset-4 hover:underline">{r.login}</a>
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
