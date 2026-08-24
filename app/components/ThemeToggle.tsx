"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setDark(false);
    }
  }, []);

  function toggleTheme() {
    const newDark = !dark;

    setDark(newDark);

    if (newDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }

  return (
    <button
      onClick={toggleTheme}
      className="
        flex w-full cursor-pointer items-center justify-between
        rounded-lg px-3 py-2.5 text-sm
        text-slate-600 transition hover:bg-slate-100
        dark:text-slate-300 dark:hover:bg-slate-800
      "
    >
      <span className="flex items-center gap-3">
        <span>{dark ? "🌙" : "☀️"}</span>

        {dark ? "Mørkt tema" : "Lyst tema"}
      </span>

      <span
        className={`relative h-5 w-9 rounded-full transition ${
          dark ? "bg-blue-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
            dark ? "left-4" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}