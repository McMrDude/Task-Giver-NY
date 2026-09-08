"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "../../components/ThemeToggle";
import NotificationBell from "../../components/NotificationBell";

// ====================================================
// TYPES
// ====================================================

type User = {
  id: string | number;
  name: string;
  email: string;
  role: string;
};

// ====================================================
// HELP PAGE
// ====================================================

export default function HelpPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ==================================================
  // LOAD USER
  // ==================================================

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const response = await fetch("/api/auth/me");

      if (!response.ok) {
        router.push("/login");
        return;
      }

      const result = await response.json();

      if (!result.success || !result.user) {
        router.push("/login");
        return;
      }

      setUser(result.user);
    } catch (error) {
      console.error(error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  // ==================================================
  // LOGOUT
  // ==================================================

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error(error);
    }

    router.push("/login");
  }

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Laster hjelpesiden...
        </div>
      </main>
    );
  }

  // ==================================================
  // PAGE
  // ==================================================

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">

      <div className="flex min-h-screen">

        {/* ==================================================
            DESKTOP SIDEBAR
        ================================================== */}

        <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">

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

            {/* OVERVIEW */}

            {user?.role === "employee" && (
              <button
                onClick={() =>
                  router.push("/employee")
                }
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                <span>▦</span>
                Oversikt
              </button>
            )}

            {/* ASSIGNED TASKS */}

            {user?.role === "employee" && (
              <button
                onClick={() =>
                  router.push("/employee/tasks")
                }
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                <span>📋</span>
                Mine tildelte saker
              </button>
            )}

            {/* COMPLETED */}

            {user?.role === "employee" && (
              <button
                onClick={() =>
                  router.push("/completed-tasks")
                }
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                <span>✓</span>
                Fullførte saker
              </button>
            )}

            {/* HELP */}

            <button
              onClick={() => {}}
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-left text-sm font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
            >
              <span>❓</span>
              Hjelp
            </button>

          </nav>

          {/* THEME */}

          <div className="border-t border-slate-200 p-3 dark:border-slate-800">
            <ThemeToggle />
          </div>

          {/* ACCOUNT */}

          <div className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">

            {user && (
              <>
                <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-900">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-400">
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
                  className="mt-3 w-full cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Logg ut
                </button>
              </>
            )}

          </div>

        </aside>

        {/* ==================================================
            MOBILE
        ================================================== */}

        <div className="w-full lg:hidden">

          <header className="sticky top-0 z-50 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">

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
                    Ansattportal
                  </p>
                </div>

              </div>

              <button
                onClick={() =>
                  setMobileMenuOpen(
                    !mobileMenuOpen
                  )
                }
                className="cursor-pointer rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Åpne meny"
              >
                ☰
              </button>

            </div>

            {mobileMenuOpen && (
              <div className="space-y-2 border-t border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">

                <button
                  onClick={() =>
                    router.push("/employee")
                  }
                  className="w-full rounded-lg px-4 py-3 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  ▦ Oversikt
                </button>

                <button
                  onClick={() =>
                    router.push("/employee/tasks")
                  }
                  className="w-full rounded-lg px-4 py-3 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  📋 Mine tildelte saker
                </button>

                <button
                  onClick={() =>
                    router.push("/completed-tasks")
                  }
                  className="w-full rounded-lg px-4 py-3 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  ✓ Fullførte saker
                </button>

                <button
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="w-full rounded-lg bg-blue-50 px-4 py-3 text-left text-sm font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                >
                  ❓ Hjelp
                </button>

                <ThemeToggle />

              </div>
            )}

          </header>

        </div>

        {/* ==================================================
            MAIN
        ================================================== */}

        <section className="min-w-0 flex-1 lg:ml-64">

          {/* HEADER */}

          <header className="border-b border-slate-200 bg-white px-6 py-6 dark:border-slate-800 dark:bg-slate-900 lg:px-8">

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Ansattportal
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Hjelp
                </h1>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Informasjon om hvordan du bruker støttesystemet.
                </p>

              </div>

              <NotificationBell />

            </div>

          </header>

          {/* CONTENT */}

          <div className="space-y-8 p-5 lg:p-8">

            {/* ==================================================
                INTRO
            ================================================== */}

            <section className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900/60 dark:bg-blue-950/30">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xl text-white">
                  ?
                </div>

                <div>

                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Velkommen til hjelpesiden
                  </h2>

                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Her finner du en kort oversikt over hvordan
                    du behandler støttesaker, bruker statuser
                    og håndterer frister.
                  </p>

                </div>

              </div>

            </section>

            {/* ==================================================
                HOW IT WORKS
            ================================================== */}

            <section>

              <div className="mb-5">

                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Slik fungerer det
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  En enkel oversikt over arbeidsflyten.
                </p>

              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                <HelpStep
                  number="1"
                  title="Finn saken"
                  description="Gå til «Mine tildelte saker» for å se sakene som er tildelt til deg."
                />

                <HelpStep
                  number="2"
                  title="Behandle saken"
                  description="Åpne saken, les informasjonen fra brukeren og arbeid med problemet."
                />

                <HelpStep
                  number="3"
                  title="Oppdater status"
                  description="Endre status underveis slik at andre kan se hvor langt saken har kommet."
                />

              </div>

            </section>

            {/* ==================================================
                STATUSES
            ================================================== */}

            <section>

              <div className="mb-5">

                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Statuser
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Bruk riktig status for å holde sakene oppdatert.
                </p>

              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                <HelpInfoCard
                  icon="●"
                  title="Ny"
                  description="Saken er tildelt deg, men du har ikke startet behandlingen ennå."
                />

                <HelpInfoCard
                  icon="↻"
                  title="Pågår"
                  description="Du arbeider aktivt med saken."
                />

                <HelpInfoCard
                  icon="✓"
                  title="Ferdig"
                  description="Problemet er løst og saken er ferdigbehandlet."
                />

              </div>

            </section>

            {/* ==================================================
                PRIORITY
            ================================================== */}

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">

              <div className="mb-5">

                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Prioritet
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Prioriteten sier noe om hvor raskt en sak bør behandles.
                </p>

              </div>

              <div className="space-y-4">

                <PriorityRow
                  label="Høy"
                  description="Saken bør behandles så raskt som mulig. Den kan påvirke en viktig funksjon eller flere brukere."
                  className="bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                />

                <PriorityRow
                  label="Medium"
                  description="Saken bør behandles innen rimelig tid, men er ikke nødvendigvis kritisk."
                  className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                />

                <PriorityRow
                  label="Lav"
                  description="Saken haster normalt ikke og kan behandles når viktigere saker er håndtert."
                  className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                />

              </div>

            </section>

            {/* ==================================================
                DEADLINES
            ================================================== */}

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">

              <HelpLargeCard
                icon="⏱"
                title="Frister"
              >
                <p>
                  Hvis en sak har en registrert frist, bør du
                  prioritere arbeidet slik at saken blir ferdig
                  innen denne datoen.
                </p>

                <p>
                  Har du problemer med å rekke fristen, bør du
                  ta kontakt med ansvarlig person så tidlig som
                  mulig.
                </p>
              </HelpLargeCard>

              {/* ==================================================
                  CANNOT SOLVE
              ================================================== */}

              <HelpLargeCard
                icon="!"
                title="Hvis du ikke kan løse saken"
              >
                <p>
                  Ikke la en sak stå uten oppdatering dersom du
                  har problemer med å løse den.
                </p>

                <p>
                  Dokumenter hva du har forsøkt og informer
                  ansvarlig person dersom saken må håndteres
                  videre.
                </p>
              </HelpLargeCard>

            </section>

            {/* ==================================================
                FAQ
            ================================================== */}

            <section>

              <div className="mb-5">

                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Vanlige spørsmål
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Noen raske svar på vanlige spørsmål.
                </p>

              </div>

              <div className="space-y-3">

                <Faq
                  question="Hvor finner jeg sakene som er tildelt til meg?"
                  answer="Gå til «Mine tildelte saker» i sidemenyen. Der finner du alle aktive saker som er tildelt til deg."
                />

                <Faq
                  question="Når skal jeg sette en sak til «Pågår»?"
                  answer="Når du begynner å arbeide aktivt med saken, bør status endres fra «Ny» til «Pågår»."
                />

                <Faq
                  question="Når skal en sak settes til «Ferdig»?"
                  answer="Når problemet er løst og det ikke er mer arbeid som skal gjøres på saken."
                />

                <Faq
                  question="Kan jeg se gamle saker?"
                  answer="Ja. Ferdigbehandlede saker finner du under «Fullførte saker» i sidemenyen."
                />

                <Faq
                  question="Hva gjør jeg hvis jeg har fått en sak ved en feil?"
                  answer="Ikke ferdigstill saken bare for å få den bort. Ta kontakt med ansvarlig person slik at saken kan tildeles riktig person."
                />

              </div>

            </section>

            {/* ==================================================
                BACK TO DASHBOARD
            ================================================== */}

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Klar til å fortsette?
                  </p>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Gå tilbake til oversikten eller se sakene dine.
                  </p>

                </div>

                <div className="flex flex-col gap-2 sm:flex-row">

                  <button
                    onClick={() =>
                      router.push("/employee")
                    }
                    className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Til oversikten
                  </button>

                  <button
                    onClick={() =>
                      router.push("/employee/tasks")
                    }
                    className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Se mine saker
                  </button>

                </div>

              </div>

            </section>

          </div>

        </section>

      </div>

    </main>
  );
}

// ====================================================
// HELP STEP
// ====================================================

function HelpStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
        {number}
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        {description}
      </p>

    </div>
  );
}

// ====================================================
// HELP INFO CARD
// ====================================================

function HelpInfoCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

      <div className="flex items-center gap-3">

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {icon}
        </div>

        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          {title}
        </h3>

      </div>

      <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
        {description}
      </p>

    </div>
  );
}

// ====================================================
// PRIORITY ROW
// ====================================================

function PriorityRow({
  label,
  description,
  className,
}: {
  label: string;
  description: string;
  className: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

      <span
        className={`inline-flex w-fit rounded-md px-2.5 py-1 text-xs font-semibold ${className}`}
      >
        {label}
      </span>

      <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
        {description}
      </p>

    </div>
  );
}

// ====================================================
// LARGE HELP CARD
// ====================================================

function HelpLargeCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">

      <div className="flex items-center gap-3">

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {icon}
        </div>

        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          {title}
        </h2>

      </div>

      <div className="mt-4 space-y-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
        {children}
      </div>

    </section>
  );
}

// ====================================================
// FAQ
// ====================================================

function Faq({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <details className="group rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">

        <span className="text-sm font-semibold text-slate-900 dark:text-white">
          {question}
        </span>

        <span className="shrink-0 text-slate-400 transition group-open:rotate-45">
          +
        </span>

      </summary>

      <div className="border-t border-slate-100 px-5 pb-5 pt-4 text-sm leading-6 text-slate-500 dark:border-slate-800 dark:text-slate-400">
        {answer}
      </div>

    </details>
  );
}