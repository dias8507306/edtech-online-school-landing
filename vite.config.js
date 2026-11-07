import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// base: "./" — сайт работает и на сервере, и при открытии dist/index.html двойным кликом.
// Весь JavaScript собирается в один файл без import/export (modulePreload выключен),
// поэтому prerender.mjs подключает его обычным <script defer>: браузеры блокируют ES-модули на file://,
// из-за этого раньше «ломались» русский язык и навигация. CSS остаётся отдельным файлом.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  build: {
    modulePreload: false,
  },
});
