"use client";

import { useEffect, useState } from "react";

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
    description: "Problemer med PC, skjerm, mus, tastatur og annet utstyr.",
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
    description: "Problemer med Wi-Fi, internett eller nettverkstilgang.",
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
    description: "Problemer med printere, utskrift og skanning.",
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
    description: "Innlogging, passord, kontoer og tilgang.",
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
    description: "Programmer, installasjoner, lisenser og oppdateringer.",
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
    description: "Har du et annet IT-relatert problem?",
    icon: "❓",
    subcategories: [
      "Annet IT-problem",
      "Utstyr",
      "Tilgang",
      "Jeg er usikker",
    ],
  },
];

function getStatusLabel(status: string) {
  switch (status) {
    case "not_started":
      return "Ny";
    case "in_progress":
      return "Pågår";
    case "completed":
      return "Ferdig";
    case "cancelled":
      return "Avbrutt";
    default:
      return status;
  }
}

function getStatusStyle(status: string) {
  switch (status) {
    case "not_started":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "in_progress":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "cancelled":
      return "bg-gray-100 text-gray-600 border-gray-200";

    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function getPriorityStyle(priority: string) {
  switch (priority) {
    case "høy":
      return "bg-red-50 text-red-700 border-red-200";

    case "medium":
      return "bg-orange-50 text-orange-700 border-orange-200";

    case "lav":
      return "bg-gray-100 text-gray-600 border-gray-200";

    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

export default function TicketingSystem() {
  const [tickets, setTickets] = useState<any[]>([]);

  const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null);

  const [selectedSubcategory, setSelectedSubcategory] = useState("");

  const [showTicketForm, setShowTicketForm] = useState(false);

  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("lav");
  const [dueDate, setDueDate] = useState("");

  const [statusMessage, setStatusMessage] = useState("");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/data?table=tasks");
      const result = await res.json();

      if (result.success) {
        setTickets(result.data || []);
      }
    } catch (err) {
      console.error("Feil ved henting av saker:", err);
    }
  };

  useEffect(() => {
    fetchTickets();
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
    if (!selectedCategory || !selectedSubcategory) return;

    setShowTicketForm(true);

    setTimeout(() => {
      document
        .getElementById("ticket-form")
        ?.scrollIntoView({ behavior: "smooth" });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCategory || !selectedSubcategory) {
      return;
    }

    setStatusMessage("Oppretter støttesak...");

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
        setStatusMessage(`Databasefeil: ${result.error}`);
        return;
      }

      setStatusMessage("Støttesaken ble opprettet!");

      await fetchTickets();

      setTimeout(() => {
        resetForm();
        setStatusMessage("");
      }, 1500);
    } catch (err) {
      console.error(err);
      setStatusMessage("En nettverksfeil oppstod.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">

      {/* MOBILE HEADER */}

      <header className="lg:hidden sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between px-5 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
              IT
            </div>

            <div>
              <p className="font-bold text-sm">
                IT Support
              </p>

              <p className="text-xs text-slate-500">
                Støttesystem
              </p>
            </div>

          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg border border-slate-200 p-2"
          >
            ☰
          </button>

        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-5 py-4 space-y-2">

            <button className="w-full rounded-lg bg-blue-50 px-4 py-3 text-left text-sm font-medium text-blue-700">
              Oversikt
            </button>

            <button className="w-full rounded-lg px-4 py-3 text-left text-sm text-slate-600 hover:bg-slate-50">
              Mine saker
            </button>

          </div>
        )}
      </header>


      <div className="flex min-h-screen">

        {/* SIDEBAR */}

        <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 flex-col border-r border-slate-200 bg-white">

          {/* LOGO / HEADER */}
          <div className="flex h-20 shrink-0 items-center gap-3 border-b border-slate-200 px-6">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
              IT
            </div>

            <div>
              <p className="font-bold text-slate-900">
                IT Support
              </p>

              <p className="text-xs text-slate-500">
                Støttesystem
              </p>
            </div>

          </div>


          {/* NAVIGATION */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">

            <button className="flex w-full items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-left text-sm font-semibold text-blue-700">
              <span>⌂</span>
              Oversikt
            </button>

            <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50">
              <span>📋</span>
              Mine saker
            </button>

            <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50">
              <span>❓</span>
              Hjelp
            </button>

          </nav>


          {/* ACCOUNT */}
          <div className="shrink-0 border-t border-slate-200 bg-white p-4">

            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold">
                G
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  Gjestebruker
                </p>

                <p className="text-xs text-slate-500">
                  Ikke innlogget
                </p>
              </div>

            </div>

          </div>

        </aside>


        {/* MAIN */}

        <main className="ml-64 flex-1">

          {/* DESKTOP TOP BAR */}

          <div className="hidden lg:flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8">

            <div>
              <p className="text-sm text-slate-500">
                IT Support
              </p>

              <p className="font-semibold">
                Oversikt
              </p>
            </div>

            <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50">
              Logg inn
            </button>

          </div>


          <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">

            {/* HERO */}

            <section className="mb-10">

              <div className="max-w-3xl">

                <p className="mb-2 text-sm font-semibold text-blue-600">
                  IT-SUPPORT
                </p>

                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Hva trenger du hjelp med?
                </h1>

                <p className="mt-3 text-base leading-7 text-slate-500">
                  Velg området som passer best til problemet ditt.
                  Vi hjelper deg med å finne riktig løsning.
                </p>

              </div>

            </section>


            {/* CATEGORY SELECTION */}

            {!selectedCategory && (

              <section>

                <div className="mb-4 flex items-center justify-between">

                  <h2 className="text-lg font-semibold">
                    Velg kategori
                  </h2>

                  <span className="text-sm text-slate-400">
                    {categories.length} kategorier
                  </span>

                </div>


                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

                  {categories.map((category) => (

                    <button
                      key={category.id}
                      onClick={() => openCategory(category)}
                      className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                    >

                      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl transition group-hover:bg-blue-100">
                        {category.icon}
                      </div>

                      <h3 className="text-base font-semibold text-slate-900">
                        {category.name}
                      </h3>

                      <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-500">
                        {category.description}
                      </p>

                      <div className="mt-5 flex items-center text-sm font-semibold text-blue-600">
                        Velg kategori
                        <span className="ml-2 transition group-hover:translate-x-1">
                          →
                        </span>
                      </div>

                    </button>

                  ))}

                </div>

              </section>

            )}


            {/* SUBCATEGORY */}

            {selectedCategory && !showTicketForm && (

              <section>

                <button
                  onClick={goBackToCategories}
                  className="mb-6 text-sm font-medium text-slate-500 hover:text-slate-900"
                >
                  ← Tilbake til kategorier
                </button>


                <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                  <div className="flex items-start gap-4">

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-3xl">
                      {selectedCategory.icon}
                    </div>

                    <div>

                      <p className="text-sm font-semibold text-blue-600">
                        KATEGORI
                      </p>

                      <h2 className="mt-1 text-2xl font-bold">
                        {selectedCategory.name}
                      </h2>

                      <p className="mt-2 text-sm text-slate-500">
                        {selectedCategory.description}
                      </p>

                    </div>

                  </div>

                </div>


                <h2 className="mb-4 text-lg font-semibold">
                  Hva gjelder problemet?
                </h2>


                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                  {selectedCategory.subcategories.map((subcategory) => (

                    <button
                      key={subcategory}
                      onClick={() =>
                        setSelectedSubcategory(subcategory)
                      }
                      className={`rounded-xl border bg-white p-4 text-left text-sm font-medium shadow-sm transition ${
                        selectedSubcategory === subcategory
                          ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-100"
                          : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                      }`}
                    >

                      <div className="flex items-center justify-between">

                        <span>
                          {subcategory}
                        </span>

                        {selectedSubcategory === subcategory && (
                          <span className="text-blue-600">
                            ✓
                          </span>
                        )}

                      </div>

                    </button>

                  ))}

                </div>


                <div className="mt-8 flex justify-end">

                  <button
                    disabled={!selectedSubcategory}
                    onClick={startTicket}
                    className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Fortsett →
                  </button>

                </div>

              </section>

            )}


            {/* TICKET FORM */}

            {selectedCategory && showTicketForm && (

              <section id="ticket-form">

                <button
                  onClick={() => setShowTicketForm(false)}
                  className="mb-6 text-sm font-medium text-slate-500 hover:text-slate-900"
                >
                  ← Tilbake
                </button>


                <div className="grid gap-8 lg:grid-cols-[1fr_320px]">

                  <form
                    onSubmit={handleSubmit}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
                  >

                    <div className="mb-8">

                      <p className="text-sm font-semibold text-blue-600">
                        NY STØTTESAK
                      </p>

                      <h2 className="mt-1 text-2xl font-bold">
                        Beskriv problemet
                      </h2>

                      <p className="mt-2 text-sm text-slate-500">
                        Jo mer informasjon du gir, desto lettere er det
                        for oss å hjelpe deg.
                      </p>

                    </div>


                    {/* SELECTED CATEGORY */}

                    <div className="mb-6 rounded-xl bg-slate-50 p-4">

                      <div className="flex items-center justify-between">

                        <div>

                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Kategori
                          </p>

                          <p className="mt-1 text-sm font-semibold">
                            {selectedCategory.name}
                          </p>

                        </div>

                        <div className="text-right">

                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Problem
                          </p>

                          <p className="mt-1 text-sm font-semibold">
                            {selectedSubcategory}
                          </p>

                        </div>

                      </div>

                    </div>


                    {/* DESCRIPTION */}

                    <div className="mb-6">

                      <label className="mb-2 block text-sm font-semibold">
                        Beskrivelse
                      </label>

                      <textarea
                        rows={7}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                        placeholder="Forklar hva som har skjedd, hva du har prøvd, og eventuelle feilmeldinger du har fått..."
                        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      />

                    </div>


                    {/* PRIORITY */}

                    <div className="mb-6">

                      <label className="mb-2 block text-sm font-semibold">
                        Hvor viktig er problemet?
                      </label>

                      <div className="grid gap-2 sm:grid-cols-3">

                        {[
                          {
                            value: "lav",
                            label: "Lav",
                            description: "Kan vente",
                          },
                          {
                            value: "medium",
                            label: "Medium",
                            description: "Bør løses snart",
                          },
                          {
                            value: "høy",
                            label: "Høy",
                            description: "Haster",
                          },
                        ].map((item) => (

                          <button
                            type="button"
                            key={item.value}
                            onClick={() => setPriority(item.value)}
                            className={`rounded-xl border p-3 text-left transition ${
                              priority === item.value
                                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                                : "border-slate-200 hover:bg-slate-50"
                            }`}
                          >

                            <p className="text-sm font-semibold">
                              {item.label}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {item.description}
                            </p>

                          </button>

                        ))}

                      </div>

                    </div>


                    {/* DUE DATE */}

                    <div className="mb-8">

                      <label className="mb-2 block text-sm font-semibold">
                        Frist
                        <span className="ml-2 font-normal text-slate-400">
                          Valgfritt
                        </span>
                      </label>

                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      />

                    </div>


                    {/* BUTTONS */}

                    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">

                      <button
                        type="button"
                        onClick={resetForm}
                        className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                      >
                        Avbryt
                      </button>

                      <button
                        type="submit"
                        className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                      >
                        Send inn støttesak
                      </button>

                    </div>


                    {statusMessage && (

                      <div className="mt-5 rounded-xl bg-blue-50 p-4 text-center text-sm font-medium text-blue-700">
                        {statusMessage}
                      </div>

                    )}

                  </form>


                  {/* SIDE INFORMATION */}

                  <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                    <h3 className="font-semibold">
                      Tips til beskrivelsen
                    </h3>

                    <ul className="mt-4 space-y-4 text-sm text-slate-500">

                      <li className="flex gap-3">
                        <span>✓</span>
                        <span>
                          Fortell hva som faktisk skjer.
                        </span>
                      </li>

                      <li className="flex gap-3">
                        <span>✓</span>
                        <span>
                          Oppgi eventuelle feilmeldinger.
                        </span>
                      </li>

                      <li className="flex gap-3">
                        <span>✓</span>
                        <span>
                          Fortell når problemet startet.
                        </span>
                      </li>

                      <li className="flex gap-3">
                        <span>✓</span>
                        <span>
                          Fortell hva du allerede har prøvd.
                        </span>
                      </li>

                    </ul>

                  </aside>

                </div>

              </section>

            )}


            {/* TICKETS */}

            {!selectedCategory && (

              <section className="mt-12">

                <div className="mb-4 flex items-center justify-between">

                  <div>

                    <h2 className="text-lg font-semibold">
                      Dine saker
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Oversikt over registrerte støttesaker.
                    </p>

                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {tickets.length} saker
                  </span>

                </div>


                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                  {tickets.length === 0 ? (

                    <div className="px-6 py-12 text-center">

                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
                        📋
                      </div>

                      <p className="font-semibold">
                        Ingen saker ennå
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Når du sender inn en støttesak vil den vises her.
                      </p>

                    </div>

                  ) : (

                    <div className="divide-y divide-slate-100">

                      {tickets.map((ticket, index) => (

                        <div
                          key={ticket.id || index}
                          className="p-5 transition hover:bg-slate-50"
                        >

                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                            <div className="min-w-0">

                              <div className="mb-2 flex flex-wrap items-center gap-2">

                                <span className="text-xs font-bold text-slate-400">
                                  #{ticket.id ?? index + 1}
                                </span>

                                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                                  {ticket.category}
                                </span>

                                {ticket.subcategory && (

                                  <span className="text-xs text-slate-400">
                                    / {ticket.subcategory}
                                  </span>

                                )}

                              </div>


                              <p className="line-clamp-2 text-sm font-medium text-slate-800">
                                {ticket.content}
                              </p>


                              <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-400">

                                <span>
                                  Opprettet{" "}
                                  {ticket.created_at
                                    ? new Date(
                                        ticket.created_at
                                      ).toLocaleDateString("nb-NO")
                                    : "Nylig"}
                                </span>

                                {ticket.due_date && (

                                  <span>
                                    Frist{" "}
                                    {new Date(
                                      ticket.due_date
                                    ).toLocaleDateString("nb-NO")}
                                  </span>

                                )}

                              </div>

                            </div>


                            <div className="flex shrink-0 items-center gap-2">

                              <span
                                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getPriorityStyle(
                                  ticket.priority
                                )}`}
                              >
                                {ticket.priority}
                              </span>

                              <span
                                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                                  ticket.status
                                )}`}
                              >
                                {getStatusLabel(ticket.status)}
                              </span>

                            </div>

                          </div>

                        </div>

                      ))}

                    </div>

                  )}

                </div>

              </section>

            )}

          </div>

        </main>

      </div>

    </div>
  );
}