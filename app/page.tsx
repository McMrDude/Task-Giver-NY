"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "./components/ThemeToggle";
import NotificationBell from "./components/NotificationBell";

type Category = {
  id: string;
  name: string;
  description: string;
  icon: string;
  subcategories: string[];
};

const categories: Category[] = [
  {
    id: "pc",
    name: "PC-problemer",
    description:
      "Problemer med PC, skjerm, mus, tastatur og annet utstyr.",
    icon: "🖥️",
    subcategories: [
      "PC starter ikke",
      "PC er treg",
      "Skjermproblem",
      "Tastatur eller mus",
      "Lydproblem",
      "Annet PC-problem",
    ],
  },
  {
    id: "network",
    name: "Nettverk",
    description:
      "Problemer med Wi-Fi, internett eller nettverkstilgang.",
    icon: "🌐",
    subcategories: [
      "Wi-Fi fungerer ikke",
      "Internett er tregt",
      "Kan ikke koble til nettverk",
      "Nettverkstilgang",
      "Annet nettverksproblem",
    ],
  },
  {
    id: "printer",
    name: "Printer",
    description:
      "Problemer med printere, utskrift og skanning.",
    icon: "🖨️",
    subcategories: [
      "Printer fungerer ikke",
      "Kan ikke skrive ut",
      "Dårlig utskriftskvalitet",
      "Printer mangler",
      "Annet printerproblem",
    ],
  },
  {
    id: "account",
    name: "Konto og passord",
    description:
      "Innlogging, passord, kontoer og tilgang.",
    icon: "🔑",
    subcategories: [
      "Glemt passord",
      "Kan ikke logge inn",
      "Konto er låst",
      "Manglende tilgang",
      "Annet kontoproblem",
    ],
  },
  {
    id: "software",
    name: "Programvare",
    description:
      "Programmer, installasjoner, lisenser og oppdateringer.",
    icon: "📦",
    subcategories: [
      "Program fungerer ikke",
      "Trenger nytt program",
      "Installasjon",
      "Lisensproblem",
      "Programvareoppdatering",
      "Annet programvareproblem",
    ],
  },
  {
    id: "other",
    name: "Annet",
    description:
      "Har du et annet IT-relatert problem?",
    icon: "❓",
    subcategories: [
      "Annet IT-problem",
      "Utstyr",
      "Tilgang",
      "Jeg er usikker",
    ],
  },
];

export default function TicketingSystem() {
  const router = useRouter();
  const [user, setUser] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);

  const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null);

  const [selectedSubcategory, setSelectedSubcategory] =
    useState("");

  const [showTicketForm, setShowTicketForm] =
    useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("lav");
  const [dueDate, setDueDate] = useState("");
  const [images, setImages] =
    useState<File[]>([]);

  const [statusMessage, setStatusMessage] =
    useState("");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (!response.ok) {
          if (mounted) {
            setUser(null);
          }
          return;
        }

        const result = await response.json();

        if (mounted) {
          setUser(result.success ? result.user : null);
        }
      } catch (error) {
        console.error("Failed to load user:", error);

        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  function navigateMobile(path: string) {
    setMobileMenuOpen(false);
    router.push(path);
  }

  async function logout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      window.location.href = "/login";
    }
  }

  const openCategory = (category: Category) => {
    setSelectedCategory(category);
    setSelectedSubcategory("");
    setShowTicketForm(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const startTicket = () => {
    if (!selectedCategory || !selectedSubcategory) {
      return;
    }

    setShowTicketForm(true);

    setTimeout(() => {
      document
        .getElementById("ticket-form")
        ?.scrollIntoView({
          behavior: "smooth",
        });
    }, 50);
  };

  const goBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedSubcategory("");
    setShowTicketForm(false);
  };

  const resetForm = () => {
    setSelectedCategory(null);
    setSelectedSubcategory("");
    setShowTicketForm(false);

    setTitle("");
    setContent("");
    setPriority("lav");
    setDueDate("");
    setImages([]);
  };

const handleSubmit = async (
  e: React.FormEvent
) => {

  e.preventDefault();


  if (
    !selectedCategory ||
    !selectedSubcategory
  ) {
    return;
  }


  setStatusMessage(
    "Oppretter støttesak..."
  );


  try {

    const formData =
      new FormData();


    // ----------------------------------------------
    // TASK DATA
    // ----------------------------------------------
    const finalTitle =
      title.trim() || selectedSubcategory;

    formData.append(
      "title",
      finalTitle
    );

    formData.append(
      "content",
      content
    );

    formData.append(
      "category",
      selectedCategory.name
    );

    formData.append(
      "subcategory",
      selectedSubcategory
    );

    formData.append(
      "priority",
      priority
    );

    formData.append(
      "due_date",
      dueDate || ""
    );


    // ----------------------------------------------
    // IMAGES
    // ----------------------------------------------

    images.forEach(
      image => {

        formData.append(
          "images",
          image
        );

      }
    );


    // ----------------------------------------------
    // SEND
    // ----------------------------------------------

    const res =
      await fetch(
        "/api/tickets",
        {
          method: "POST",
          body: formData,
        }
      );


    const result =
      await res.json();


    if (
      !res.ok ||
      !result.success
    ) {

      setStatusMessage(
        `Feil: ${
          result.error ||
          "Kunne ikke opprette saken."
        }`
      );

      return;

    }


    // ----------------------------------------------
    // SUCCESS
    // ----------------------------------------------

    setStatusMessage(
      images.length > 0
        ? `Støttesaken ble opprettet med ${images.length} ${
            images.length === 1
              ? "bilde"
              : "bilder"
          }!`
        : "Støttesaken ble opprettet!"
    );


    setTimeout(() => {

      resetForm();

      setStatusMessage("");

    }, 1500);


  } catch (error) {

    console.error(error);

    setStatusMessage(
      "En nettverksfeil oppstod."
    );

  }

};

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900 dark:bg-slate-950 dark:text-slate-100">

      {/* =========================
          MOBILE HEADER
      ========================= */}
      <header className="sticky top-0 z-50 lg:hidden">
        <div className="border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/95">

          <div className="flex h-16 items-center justify-between px-4 sm:px-5">

            {/* Logo / Brand */}
            <button
              type="button"
              onClick={() => navigateMobile("/")}
              className="flex min-w-0 items-center gap-3 rounded-xl py-2 text-left focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              aria-label="Gå til oversikt"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm">
                IT
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                  IT Support
                </p>

                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  Støttesystem
                </p>
              </div>
            </button>


            {/* Right side controls */}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">

              {/* Notifications - only when logged in */}
              {!authLoading && user && (
                <div className="flex h-10 w-10 items-center justify-center">
                  <NotificationBell />
                </div>
              )}


              {/* Login / Logout */}
              {!authLoading && (
                <>
                  {user ? (
                    <button
                      type="button"
                      onClick={logout}
                      disabled={loggingOut}
                      aria-label="Logg ut"
                      title="Logg ut"
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <svg
                        className="h-4 w-4 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M10 17l5-5-5-5" />
                        <path d="M15 12H3" />
                        <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
                      </svg>

                      <span className="hidden sm:inline">
                        {loggingOut ? "Logger ut..." : "Logg ut"}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigateMobile("/login")}
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
                    >
                      <svg
                        className="h-4 w-4 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                        <path d="M10 17l5-5-5-5" />
                        <path d="M15 12H3" />
                      </svg>

                      <span>Logg inn</span>
                    </button>
                  )}
                </>
              )}


              {/* Menu button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
                aria-label={mobileMenuOpen ? "Lukk meny" : "Åpne meny"}
                aria-expanded={mobileMenuOpen}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.97] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {mobileMenuOpen ? (
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M6 6l12 12" />
                    <path d="M18 6L6 18" />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M4 6h16" />
                    <path d="M4 12h16" />
                    <path d="M4 18h16" />
                  </svg>
                )}
              </button>

            </div>
          </div>
        </div>


        {/* Mobile navigation overlay + menu */}
        {mobileMenuOpen && (
          <>
            {/* Background overlay */}
            <button
              type="button"
              aria-label="Lukk meny"
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-[2px]"
            />

            {/* Menu */}
            <div className="fixed inset-x-0 top-40 z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">

              <div className="mx-auto w-full max-w-2xl px-4 py-5 sm:px-5">

                {/* Navigation */}
                <div>
                  <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Navigasjon
                  </p>

                  <nav className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => navigateMobile("/")}
                      className="flex min-h-12 w-full items-center gap-3 rounded-xl bg-blue-50 px-4 text-left text-sm font-semibold text-blue-700 transition active:scale-[0.99] dark:bg-blue-950/40 dark:text-blue-300"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/60">
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path d="M3 10.5L12 3l9 7.5" />
                          <path d="M5 9.5V21h14V9.5" />
                          <path d="M9 21v-6h6v6" />
                        </svg>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p>Oversikt</p>
                        <p className="text-xs font-normal text-blue-600/70 dark:text-blue-300/70">
                          Startside
                        </p>
                      </div>

                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>


                    <button
                      type="button"
                      onClick={() => navigateMobile("/my-tickets")}
                      className="flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 active:scale-[0.99] dark:text-slate-200 dark:hover:bg-slate-900"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                          <path d="M8 8h8" />
                          <path d="M8 12h8" />
                          <path d="M8 16h5" />
                        </svg>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p>Mine saker</p>
                        <p className="text-xs font-normal text-slate-400 dark:text-slate-500">
                          Se dine saker
                        </p>
                      </div>

                      <svg
                        className="h-4 w-4 text-slate-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>


                    <button
                      type="button"
                      onClick={() => navigateMobile("/help")}
                      className="flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 active:scale-[0.99] dark:text-slate-200 dark:hover:bg-slate-900"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <circle cx="12" cy="12" r="9" />
                          <path d="M9.5 9a2.5 2.5 0 1 1 4.3 1.7c-.9.8-1.8 1.2-1.8 2.3" />
                          <path d="M12 16h.01" />
                        </svg>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p>Hjelp</p>
                        <p className="text-xs font-normal text-slate-400 dark:text-slate-500">
                          Få hjelp med IT
                        </p>
                      </div>

                      <svg
                        className="h-4 w-4 text-slate-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  </nav>
                </div>


                {/* Divider */}
                <div className="my-5 border-t border-slate-200 dark:border-slate-800" />


                {/* Account */}
                <div>
                  <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Konto
                  </p>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">

                    {authLoading ? (
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />

                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                          <div className="h-3 w-36 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                        </div>
                      </div>
                    ) : user ? (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-sm">
                            {user.name?.charAt(0)?.toUpperCase() || "U"}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                              {user.name}
                            </p>

                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                              {user.email}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={logout}
                          disabled={loggingOut}
                          className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                        >
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M10 17l5-5-5-5" />
                            <path d="M15 12H3" />
                            <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
                          </svg>

                          {loggingOut ? "Logger ut..." : "Logg ut"}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            <svg
                              className="h-5 w-5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            >
                              <circle cx="12" cy="8" r="3.5" />
                              <path d="M5 20c.8-3.3 3.2-5 7-5s6.2 1.7 7 5" />
                            </svg>
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              Ikke innlogget
                            </p>

                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Logg inn for å få tilgang til kontoen din
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => navigateMobile("/login")}
                          className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99]"
                        >
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                            <path d="M10 17l5-5-5-5" />
                            <path d="M15 12H3" />
                          </svg>

                          Logg inn
                        </button>
                      </>
                    )}
                  </div>
                </div>


                {/* Theme */}
                <div className="mt-4 flex min-h-12 items-center justify-between rounded-xl border border-slate-200 px-4 dark:border-slate-800">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Utseende
                    </p>

                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Bytt mellom lys og mørk modus
                    </p>
                  </div>

                  <ThemeToggle />
                </div>

              </div>
            </div>
          </>
        )}
      </header>

      <div className="flex min-h-screen">


        {/* SIDEBAR */}

        <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">

          {/* LOGO / HEADER */}

          <div className="flex h-20 shrink-0 items-center gap-3 border-b border-slate-200 px-6 dark:border-slate-800">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
              IT
            </div>

            <div>

              <p className="font-bold text-slate-900 dark:text-white">
                IT Support
              </p>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Støttesystem
              </p>

            </div>

          </div>


          {/* NAVIGATION */}

          <nav className="flex-1 space-y-1 overflow-y-auto p-4">

            {/* Oversikt */}

            <button
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-left text-sm font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
            >
              <span>⌂</span>
              Oversikt
            </button>


            <button
              onClick={() => {
                router.push("/my-tickets");
              }}
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              <span>📋</span>
              Mine saker
            </button>


            {/* Hjelp */}

            <button
              onClick={() => {
                router.push("/help");
              }}
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              <span>❓</span>
              Hjelp
            </button>

          </nav>


          {/* THEME TOGGLE */}

          <div className="border-t border-slate-200 p-3 dark:border-slate-800">

            <ThemeToggle />

          </div>


          {/* ACCOUNT */}

          <div className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">

            {user ? (

              <>

                <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-900">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                    {user.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">

                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {user.name}
                    </p>

                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {user.email}
                    </p>

                  </div>

                </div>


                {/* LOGOUT */}

                <button
                  onClick={async () => {

                    await fetch("/api/auth/logout", {
                      method: "POST",
                    });

                    router.push("/login");

                  }}
                  className="mt-3 w-full cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Logg ut
                </button>

              </>

            ) : (

              <button
                onClick={() => {
                  router.push("/login");
                }}
                className="w-full cursor-pointer rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Logg inn
              </button>

            )}

          </div>

        </aside>


        {/* MAIN */}

        <main className="ml-0 min-w-0 flex-1 lg:ml-64">


          {/* DESKTOP HEADER */}

          <header className="border-b border-slate-200 bg-white px-6 py-6 dark:border-slate-800 dark:bg-slate-900 lg:px-8">

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  IT Support
                </p>

                <p className="font-semibold text-slate-900 dark:text-white">
                  Oversikt
                </p>

              </div>

              {/* NOTIFICATIONS */}

              <NotificationBell />

            </div>

          </header>


          {/* CONTENT */}

          <div className="mx-auto max-w-7xl px-4 sm:px-5 py-6 sm:py-8 lg:px-8 lg:py-10">


            {/* HERO */}

            <section className="mb-10">

              <div className="max-w-3xl">

                <p className="mb-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
                  IT-SUPPORT
                </p>

                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                  Hva trenger du hjelp med?
                </h1>

                <p className="mt-3 text-base leading-7 text-slate-500 dark:text-slate-400">
                  Velg området som passer best
                  til problemet ditt. Vi hjelper
                  deg med å finne riktig løsning.
                </p>

              </div>

            </section>


            {/* CATEGORY SELECTION */}

            {!selectedCategory && (

              <section>

                <div className="mb-4 flex items-center justify-between">

                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Velg kategori
                  </h2>

                  <span className="text-sm text-slate-400 dark:text-slate-500">
                    {categories.length} kategorier
                  </span>

                </div>


                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

                  {categories.map(
                    (category) => (

                      <button
                        key={category.id}
                        onClick={() =>
                          openCategory(
                            category
                          )
                        }
                        className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700"
                      >

                        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl transition group-hover:bg-blue-100 dark:bg-blue-950/50 dark:group-hover:bg-blue-900/50">
                          {category.icon}
                        </div>

                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                          {category.name}
                        </h3>

                        <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-500 dark:text-slate-400">
                          {category.description}
                        </p>

                        <div className="mt-5 flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                          Velg kategori
                          <span className="ml-2 transition group-hover:translate-x-1">
                            →
                          </span>
                        </div>

                      </button>

                    )
                  )}

                </div>

              </section>

            )}


            {/* SUBCATEGORY */}

            {selectedCategory &&
              !showTicketForm && (

                <section>

                  <button
                    onClick={
                      goBackToCategories
                    }
                    className="mb-6 cursor-pointer text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    ← Tilbake til kategorier
                  </button>


                  <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">

                    <div className="flex items-start gap-4">

                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-3xl dark:bg-blue-950/50">
                        {selectedCategory.icon}
                      </div>

                      <div>

                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          KATEGORI
                        </p>

                        <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                          {selectedCategory.name}
                        </h2>

                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                          {
                            selectedCategory.description
                          }
                        </p>

                      </div>

                    </div>

                  </div>


                  <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                    Hva gjelder problemet?
                  </h2>


                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                    {selectedCategory.subcategories.map(
                      (subcategory) => (

                        <button
                          key={
                            subcategory
                          }
                          onClick={() =>
                            setSelectedSubcategory(
                              subcategory
                            )
                          }
                          className={`cursor-pointer rounded-xl border bg-white p-4 text-left text-sm font-medium shadow-sm transition dark:bg-slate-900 ${
                            selectedSubcategory ===
                            subcategory
                              ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-100 dark:bg-blue-950/50 dark:text-blue-400 dark:ring-blue-900"
                              : "border-slate-200 hover:border-blue-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                          }`}
                        >

                          <div className="flex items-center justify-between">

                            <span>
                              {
                                subcategory
                              }
                            </span>

                            {selectedSubcategory ===
                              subcategory && (
                              <span className="text-blue-600 dark:text-blue-400">
                                ✓
                              </span>
                            )}

                          </div>

                        </button>

                      )
                    )}

                  </div>


                  <div className="mt-8 flex justify-end">

                    <button
                      disabled={
                        !selectedSubcategory
                      }
                      onClick={startTicket}
                      className="cursor-pointer rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
                    >
                      Fortsett →
                    </button>

                  </div>

                </section>

              )}


            {/* TICKET FORM */}

            {selectedCategory &&
              showTicketForm && (

                <section id="ticket-form">

                  <button
                    onClick={() =>
                      setShowTicketForm(false)
                    }
                    className="mb-6 cursor-pointer text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    ← Tilbake
                  </button>


                  <div className="grid gap-8 lg:grid-cols-[1fr_320px]">


                    {/* FORM */}

                    <form
                      onSubmit={
                        handleSubmit
                      }
                      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
                    >

                      <div className="mb-8">

                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          NY STØTTESAK
                        </p>

                        <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                          Opprett støttesak
                        </h2>

                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                          Gi saken en kort tittel og beskriv problemet så detaljert som mulig.
                          Jo mer informasjon du gir, desto lettere er det for oss å hjelpe deg.
                        </p>

                      </div>


                      {/* CATEGORY */}

                      <div className="mb-6 rounded-xl bg-slate-50 p-4 dark:bg-slate-800">

                        <div className="flex items-center justify-between">

                          <div>

                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Kategori
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                              {
                                selectedCategory.name
                              }
                            </p>

                          </div>

                          <div className="text-right">

                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Problem
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                              {
                                selectedSubcategory
                              }
                            </p>

                          </div>

                        </div>

                      </div>


                      {/* TITLE */}

                      <div className="mb-6">

                        <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white">
                          Tittel
                        </label>

                        <input
                          type="text"
                          value={title}
                          onChange={(e) =>
                            setTitle(e.target.value)
                          }
                          maxLength={100}
                          placeholder="F.eks. PC-en starter ikke etter Windows-oppdatering"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-950"
                        />

                        <div className="mt-2 flex items-center justify-between gap-4">

                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Valgfritt. Hvis du ikke skriver en tittel, brukes problemtypen automatisk.
                          </p>

                          <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
                            {title.length}/100
                          </span>

                        </div>

                      </div>


                      {/* DESCRIPTION */}

                      <div className="mb-6">

                        <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white">
                          Beskrivelse
                        </label>

                        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                          Forklar problemet så detaljert som mulig. Fortell hva som har skjedd,
                          hva du har prøvd, og eventuelle feilmeldinger du har fått.
                        </p>

                        <textarea
                          rows={9}
                          value={content}
                          onChange={(e) =>
                            setContent(
                              e.target.value
                            )
                          }
                          required
                          placeholder="Forklar hva som har skjedd, hva du har prøvd, og eventuelle feilmeldinger du har fått..."
                          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-950"
                        />

                      </div>

                      {/* IMAGES */}

                      <div className="mb-6">

                        <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white">
                          Bilder

                          <span className="ml-2 font-normal text-slate-400">
                            Valgfritt
                          </span>
                        </label>


                        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                          Legg gjerne ved skjermbilder eller bilder
                          som viser problemet.
                        </p>


                        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-blue-600 dark:hover:bg-blue-950/20">

                          <div className="mb-2 text-2xl">
                            📷
                          </div>


                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Klikk for å velge bilder
                          </p>


                          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                            JPG, PNG, WEBP eller GIF · Maks 5 bilder
                          </p>


                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              const selected = Array.from(e.target.files || []);

                              if (selected.length === 0) {
                                return;
                              }

                              setImages((currentImages) => {
                                // How many more images are we allowed to add?
                                const remainingSlots = 5 - currentImages.length;

                                if (remainingSlots <= 0) {
                                  alert("Du har allerede valgt 5 bilder.");
                                  return currentImages;
                                }

                                // Only take as many new images as there are available slots
                                const newImages = selected.slice(0, remainingSlots);

                                if (selected.length > remainingSlots) {
                                  alert(
                                    `Du kan bare legge til ${remainingSlots} bilde${
                                      remainingSlots === 1 ? "" : "r"
                                    } til.`
                                  );
                                }

                                return [...currentImages, ...newImages];
                              });

                              // Reset the input so the same file can be selected again
                              e.target.value = "";
                            }}
                          />

                        </label>


                        {/* SELECTED IMAGES */}

                        {images.length > 0 && (

                          <div className="mt-4 space-y-2">

                            {images.map(
                              (file, index) => (

                                <div
                                  key={`${file.name}-${index}`}
                                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900"
                                >

                                  <div className="min-w-0">

                                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                                      {file.name}
                                    </p>

                                    <p className="text-xs text-slate-400">
                                      {(
                                        file.size /
                                        1024 /
                                        1024
                                      ).toFixed(2)}{" "}
                                      MB
                                    </p>

                                  </div>


                                  <button
                                    type="button"
                                    onClick={() => {

                                      setImages(
                                        current =>
                                          current.filter(
                                            (_, i) =>
                                              i !== index
                                          )
                                      );

                                    }}
                                    className="ml-4 cursor-pointer rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                                  >
                                    Fjern
                                  </button>

                                </div>

                              )
                            )}

                          </div>

                        )}

                      </div>

                      {/* PRIORITY */}

                      <div className="mb-6">

                        <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white">
                          Hvor viktig er problemet?
                        </label>

                        <div className="grid gap-2 sm:grid-cols-3">

                          {[
                            {
                              value: "lav",
                              label: "Lav",
                              description:
                                "Kan vente",
                            },
                            {
                              value:
                                "medium",
                              label:
                                "Medium",
                              description:
                                "Bør løses snart",
                            },
                            {
                              value: "høy",
                              label: "Høy",
                              description:
                                "Haster",
                            },
                          ].map(
                            (item) => (

                              <button
                                type="button"
                                key={
                                  item.value
                                }
                                onClick={() =>
                                  setPriority(
                                    item.value
                                  )
                                }
                                className={`cursor-pointer rounded-xl border p-3 text-left transition ${
                                  priority ===
                                  item.value
                                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100 dark:bg-blue-950/50 dark:ring-blue-900"
                                    : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                                }`}
                              >

                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                  {
                                    item.label
                                  }
                                </p>

                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  {
                                    item.description
                                  }
                                </p>

                              </button>

                            )
                          )}

                        </div>

                      </div>


                      {/* DUE DATE */}

                      <div className="mb-8">

                        <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white">
                          Frist

                          <span className="ml-2 font-normal text-slate-400">
                            Valgfritt
                          </span>
                        </label>

                        <input
                          type="date"
                          value={dueDate}
                          onChange={(e) =>
                            setDueDate(
                              e.target.value
                            )
                          }
                          className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
                        />

                      </div>


                      {/* BUTTONS */}

                      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 dark:border-slate-800 sm:flex-row sm:justify-end">

                        <button
                          type="button"
                          onClick={
                            resetForm
                          }
                          className="cursor-pointer rounded-xl px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          Avbryt
                        </button>

                        <button
                          type="submit"
                          className="cursor-pointer rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                        >
                          Send inn støttesak
                        </button>

                      </div>


                      {statusMessage && (

                        <div className="mt-5 rounded-xl bg-blue-50 p-4 text-center text-sm font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
                          {statusMessage}
                        </div>

                      )}

                    </form>


                    {/* SIDE INFORMATION */}

                    <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">

                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        Tips til beskrivelsen
                      </h3>

                      <ul className="mt-4 space-y-4 text-sm text-slate-500 dark:text-slate-400">

                        <li className="flex gap-3">
                          <span className="text-green-600 dark:text-green-400">
                            ✓
                          </span>

                          <span>
                            Fortell hva som
                            faktisk skjer.
                          </span>
                        </li>

                        <li className="flex gap-3">
                          <span className="text-green-600 dark:text-green-400">
                            ✓
                          </span>

                          <span>
                            Oppgi eventuelle
                            feilmeldinger.
                          </span>
                        </li>

                        <li className="flex gap-3">
                          <span className="text-green-600 dark:text-green-400">
                            ✓
                          </span>

                          <span>
                            Fortell når
                            problemet startet.
                          </span>
                        </li>

                        <li className="flex gap-3">
                          <span className="text-green-600 dark:text-green-400">
                            ✓
                          </span>

                          <span>
                            Fortell hva du
                            allerede har prøvd.
                          </span>
                        </li>

                      </ul>

                    </aside>

                  </div>

                </section>

              )}

          </div>

        </main>

      </div>

    </div>
  );
}