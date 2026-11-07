// Адреса «Тіркелу» / «Кіру» для всех блоков сайта. App подставляет сюда свою страницу регистрации (/register/),
// а без провайдера (например, в тестах) ссылки ведут на страницы текущей платформы.
import { createContext, useContext } from "react";
import { LINKS } from "./data.js";

export const NavContext = createContext({ register: LINKS.register, login: LINKS.login });
export const useNav = () => useContext(NavContext);
