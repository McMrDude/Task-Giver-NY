"use client";

import { useEffect, useState } from "react";
import ThemeToggle from "./components/ThemeToggle";

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

  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("lav");
  const [dueDate, setDueDate] = useState("");

  const [statusMessage, setStatusMessage] =
    useState("");

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) {
          setUser(null);
          return;
        }

        const result = await res.json();

        if (result.success) {
          setUser(result.user);
        }
      })
      .catch(() => {
        setUser(null);
      });
  }, []);

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

    setContent("");
    setPriority("lav");
    setDueDate("");
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
      const res = await fetch("/api/data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          table: "tasks",

          insertData: {
            content,
            category: selectedCategory.name,
            subcategory: selectedSubcategory,
            priority,
            due_date: dueDate || null,
            status: "not_started",
          },
        }),
      });

      const result = await res.json();

      if (!result.success) {
        setStatusMessage(
          `Databasefeil: ${result.error}`
        );
        return;
      }

      setStatusMessage(
        "Støttesaken ble opprettet!"
      );

      setTimeout(() => {
        resetForm();
        setStatusMessage("");
      }, 1500);
    } catch (err) {
      console.error(err);

      setStatusMessage(
        "En nettverksfeil oppstod."
      );
    }
  };

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900 dark:bg-slate-950 dark:text-slate-100">

      {/* MOBILE HEADER */}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:hidden">

        <div className="flex items-center justify-between px-5 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
              IT
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                IT Support
              </p>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Støttesystem
              </p>
            </div>

          </div>

          <button
            onClick={() =>
              setMobileMenuOpen(
                !mobileMenuOpen
              )
            }
            className="cursor-pointer rounded-lg border border-slate-200 p-2 dark:border-slate-700"
          >
            ☰
          </button>

        </div>


        {mobileMenuOpen && (

          <div className="space-y-2 border-t border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">

            <button
              onClick={() =>
                setMobileMenuOpen(false)
              }
              className="w-full cursor-pointer rounded-lg bg-blue-50 px-4 py-3 text-left text-sm font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
            >
              Oversikt
            </button>

            <button
              onClick={() =>
                (window.location.href =
                  "/my-tickets")
              }
              className="w-full cursor-pointer rounded-lg px-4 py-3 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Mine saker
            </button>

            <button
              onClick={() =>
                (window.location.href =
                  "/help")
              }
              className="w-full cursor-pointer rounded-lg px-4 py-3 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Hjelp
            </button>

            <ThemeToggle />

          </div>

        )}

      </header>


      <div className="flex min-h-screen">


        {/* SIDEBAR */}

        <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex">


          {/* LOGO */}

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

            <button
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-left text-sm font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
            >
              <span>⌂</span>
              Oversikt
            </button>


            <button
              onClick={() =>
                (window.location.href =
                  "/my-tickets")
              }
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <span>📋</span>
              Mine saker
            </button>


            <button
              onClick={() =>
                (window.location.href =
                  "/help")
              }
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <span>❓</span>
              Hjelp
            </button>

          </nav>


          {/* BOTTOM AREA */}

          <div className="border-t border-slate-200 p-4 dark:border-slate-800">

            <div className="mb-3">
              <ThemeToggle />
            </div>


            {user ? (

              <div>

                <div className="mb-3 flex items-center gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {user.name
                      .charAt(0)
                      .toUpperCase()}
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
                  onClick={logout}
                  className="w-full cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Logg ut
                </button>

              </div>

            ) : (

              <button
                onClick={() =>
                  (window.location.href =
                    "/login")
                }
                className="w-full cursor-pointer rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Logg inn
              </button>

            )}

          </div>

        </aside>


        {/* MAIN */}

        <main className="min-w-0 flex-1 lg:ml-64">


          {/* DESKTOP HEADER */}

          <header className="hidden h-20 items-center border-b border-slate-200 bg-white px-8 dark:border-slate-800 dark:bg-slate-900 lg:flex">

            <div>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                IT Support
              </p>

              <p className="font-semibold text-slate-900 dark:text-white">
                Oversikt
              </p>

            </div>

          </header>


          {/* CONTENT */}

          <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">


            {/* HERO */}

            <section className="mb-10">

              <div className="max-w-3xl">

                <p className="mb-2 text-sm font-semibold text-blue-600">
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

                  <span className="text-sm text-slate-400">
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

                        <div className="mt-5 flex items-center text-sm font-semibold text-blue-600">
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

                        <p className="text-sm font-semibold text-blue-600">
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
                              ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-100 dark:bg-blue-950/50 dark:text-blue-400"
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
                              <span className="text-blue-600">
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
                      className="cursor-pointer rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
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

                        <p className="text-sm font-semibold text-blue-600">
                          NY STØTTESAK
                        </p>

                        <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                          Beskriv problemet
                        </h2>

                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                          Jo mer informasjon
                          du gir, desto lettere
                          er det for oss å
                          hjelpe deg.
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


                      {/* DESCRIPTION */}

                      <div className="mb-6">

                        <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white">
                          Beskrivelse
                        </label>

                        <textarea
                          rows={7}
                          value={content}
                          onChange={(e) =>
                            setContent(
                              e.target.value
                            )
                          }
                          required
                          placeholder="Forklar hva som har skjedd, hva du har prøvd, og eventuelle feilmeldinger du har fått..."
                          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
                        />

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
                                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100 dark:bg-blue-950/50"
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
                          className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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
                          <span>✓</span>

                          <span>
                            Fortell hva som
                            faktisk skjer.
                          </span>
                        </li>

                        <li className="flex gap-3">
                          <span>✓</span>

                          <span>
                            Oppgi eventuelle
                            feilmeldinger.
                          </span>
                        </li>

                        <li className="flex gap-3">
                          <span>✓</span>

                          <span>
                            Fortell når
                            problemet startet.
                          </span>
                        </li>

                        <li className="flex gap-3">
                          <span>✓</span>

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