"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "../components/ThemeToggle";
import NotificationBell from "../components/NotificationBell";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

const faqSections = [
  {
    title: "Kom i gang",
    description: "Det viktigste du trenger å vite om støttesaker.",
    questions: [
      {
        question: "Hvordan oppretter jeg en støttesak?",
        answer:
          "Gå til Oversikt og velg «Opprett støttesak». Beskriv problemet så tydelig som mulig, velg riktig kategori og prioritet, og send inn saken. Jo mer informasjon du gir, desto lettere er det for en ansatt å hjelpe deg.",
      },
      {
        question: "Hvor finner jeg sakene jeg har sendt inn?",
        answer:
          "Alle støttesaker du har opprettet finner du under «Mine saker» i menyen. Der kan du se status, tidspunkt og annen informasjon om hver sak.",
      },
      {
        question: "Kan jeg se hva som skjer med saken min?",
        answer:
          "Ja. Statusen på saken oppdateres etter hvert som den blir behandlet. Åpne saken under «Mine saker» for å se den nyeste informasjonen.",
      },
    ],
  },
  {
    title: "Status og prioritet",
    description: "Hva betyr de forskjellige statusene og prioritetene?",
    questions: [
      {
        question: "Hva betyr «Ny»?",
        answer:
          "Saken er sendt inn, men har ikke blitt behandlet ennå. Den venter på at en ansatt skal se på den.",
      },
      {
        question: "Hva betyr «Pågår»?",
        answer:
          "En ansatt har begynt å behandle saken. Det kan for eksempel bety at problemet undersøkes eller at det jobbes med en løsning.",
      },
      {
        question: "Hva betyr «Ferdig»?",
        answer:
          "Saken er ferdig behandlet. Problemet skal være løst, eller saken er avsluttet av en ansatt.",
      },
      {
        question: "Hva betyr «Avbrutt»?",
        answer:
          "Saken er avsluttet uten at den ble ferdig behandlet. Dette kan for eksempel skje dersom saken ikke lenger er aktuell.",
      },
      {
        question: "Når bør jeg velge høy prioritet?",
        answer:
          "Velg høy prioritet når problemet har stor betydning for arbeidet ditt eller hindrer deg i å gjøre jobben din. Ikke bruk høy prioritet bare fordi du ønsker raskere behandling.",
      },
    ],
  },
  {
    title: "Når noe ikke fungerer",
    description: "Hva gjør du hvis du står fast?",
    questions: [
      {
        question: "Jeg finner ikke saken min. Hva gjør jeg?",
        answer:
          "Kontroller først at du er logget inn på riktig konto og se under «Mine saker». Hvis saken fortsatt ikke vises, kan du opprette en ny støttesak og forklare hva som mangler.",
      },
      {
        question: "Jeg skrev feil informasjon i saken. Hva gjør jeg?",
        answer:
          "Hvis saken allerede er sendt inn, bør du ikke opprette mange nye saker om det samme problemet. Ta heller kontakt med IT-support på vanlig måte og oppgi saksnummeret slik at informasjonen kan korrigeres.",
      },
      {
        question: "Problemet mitt haster veldig. Hva gjør jeg?",
        answer:
          "Velg riktig prioritet når du oppretter saken, og forklar tydelig hvorfor problemet haster. Dersom systemet eller virksomhetens rutiner har en egen måte å håndtere kritiske problemer på, skal denne brukes.",
      },
    ],
  },
  {
    title: "Konto og innlogging",
    description: "Vanlige spørsmål om kontoen din.",
    questions: [
      {
        question: "Hvordan logger jeg ut?",
        answer:
          "På PC finner du kontoen din nederst i sidemenyen. Trykk på «Logg ut» for å avslutte økten.",
      },
      {
        question: "Kan andre se støttesakene mine?",
        answer:
          "«Mine saker» viser sakene som er knyttet til kontoen din. Ansatte og administratorer kan ha tilgang til saker som en del av arbeidet med å behandle dem.",
      },
    ],
  },
];

function StatusBadge({
  status,
}: {
  status: "new" | "started" | "completed" | "cancelled";
}) {
  const styles = {
    new: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    started:
      "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
    completed:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    cancelled:
      "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  };

  const labels = {
    new: "Ny",
    started: "Pågår",
    completed: "Ferdig",
    cancelled: "Avbrutt",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export default function HelpPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me");

        if (!response.ok) {
          router.push("/login");
          return;
        }

        const data = await response.json();
        const currentUser = data.user ?? data;

        if (currentUser.role === "employee") {
          router.push("/employee");
          return;
        }

        if (currentUser.role === "admin") {
          router.push("/admin");
          return;
        }

        setUser(currentUser);
      } catch (error) {
        console.error("Kunne ikke hente bruker:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [router]);

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Laster...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Desktop sidebar */}
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
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
                  >
                    <span>⌂</span>
                    Oversikt
                  </button>
      
      
                  <button
                    onClick={() => {
                      window.location.href = "/my-tickets";
                    }}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
                  >
                    <span>📋</span>
                    Mine saker
                  </button>
      
      
                  {/* Hjelp */}
      
                  <button
                    onClick={() => {
                      window.location.href = "/help";
                    }}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-left text-sm font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
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
      
                          window.location.href = "/login";
      
                        }}
                        className="mt-3 w-full cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Logg ut
                      </button>
      
                    </>
      
                  ) : (
      
                    <button
                      onClick={() => {
                        window.location.href = "/login";
                      }}
                      className="w-full cursor-pointer rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      Logg inn
                    </button>
      
                  )}
      
                </div>
      
              </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex h-16 items-center justify-between px-4">
            <Link
              href="/"
              className="text-sm font-medium text-slate-600 dark:text-slate-300"
            >
              ← Oversikt
            </Link>

            <div className="flex items-center gap-2">
              <NotificationBell />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {/* Page heading */}
          <div className="mb-8">
            <div className="mb-3 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
              Hjelpesenter
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Slik bruker du IT Support
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500 dark:text-slate-400">
              Her finner du svar på vanlige spørsmål om hvordan du oppretter,
              følger opp og bruker støttesaker.
            </p>
          </div>

          {/* Quick start */}
          <section className="mb-10">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Kom raskt i gang
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Det grunnleggende du trenger å vite.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                  1
                </div>

                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Opprett en sak
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Beskriv problemet, velg kategori og prioritet, og send inn
                  saken.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                  2
                </div>

                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Følg saken
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Gå til «Mine saker» for å se alle støttesakene du har
                  sendt inn.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                  3
                </div>

                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Se status
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Statusen forteller deg hvor langt saken har kommet i
                  behandlingen.
                </p>
              </div>
            </div>
          </section>

          {/* Status overview */}
          <section className="mb-10">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Hva betyr statusene?
              </h2>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                  <div className="sm:w-32">
                    <StatusBadge status="new" />
                  </div>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Saken er mottatt og venter på behandling.
                  </p>
                </div>

                <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                  <div className="sm:w-32">
                    <StatusBadge status="started" />
                  </div>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                    En ansatt har begynt å behandle saken.
                  </p>
                </div>

                <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                  <div className="sm:w-32">
                    <StatusBadge status="completed" />
                  </div>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Saken er ferdig behandlet.
                  </p>
                </div>

                <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                  <div className="sm:w-32">
                    <StatusBadge status="cancelled" />
                  </div>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Saken er avsluttet uten å bli ferdig behandlet.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Vanlige spørsmål
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Trykk på et spørsmål for å se svaret.
              </p>
            </div>

            <div className="space-y-8">
              {faqSections.map((section) => (
                <div key={section.title}>
                  <div className="mb-3">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {section.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {section.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {section.questions.map((item) => (
                      <details
                        key={item.question}
                        className="group rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-slate-800 marker:hidden dark:text-slate-100">
                          <span>{item.question}</span>

                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-transform group-open:rotate-45 dark:bg-slate-800 dark:text-slate-400">
                            +
                          </span>
                        </summary>

                        <div className="border-t border-slate-100 px-5 pb-5 pt-4 dark:border-slate-800">
                          <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                            {item.answer}
                          </p>
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Bottom CTA */}
          <section className="mt-10 rounded-2xl border border-blue-100 bg-blue-50 p-6 dark:border-blue-900/50 dark:bg-blue-950/30">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white">
                  Trenger du fortsatt hjelp?
                </h2>

                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Hvis du ikke finner svaret her, kan du opprette en
                  støttesak og beskrive hva du trenger hjelp med.
                </p>
              </div>

              <Link
                href="/"
                className="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Opprett støttesak
              </Link>
            </div>
          </section>

          {/* Small footer note */}
          <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
            Hjelpesiden er en veiledning for bruk av støttesystemet.
          </p>
        </div>
      </div>
    </main>
  );
}