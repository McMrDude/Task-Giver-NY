"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "../components/ThemeToggle";
import NotificationBell from "../components/NotificationBell";

// ====================================================
// TYPES
// ====================================================

type User = {
  id: string | number;
  name: string;
  email: string;
  role: string;
};

type Ticket = {
  id: number;

  sender_id: string | number | null;
  receiver_id: string | number | null;

  content: string;
  category: string;
  subcategory: string | null;

  status: string;
  priority: string;

  due_date: string | null;
  created_at: string;

  sender?: {
    id: string | number;
    name: string;
    email: string;
  } | null;
};


// ====================================================
// PAGE
// ====================================================

export default function CompletedTasksPage() {

  const router = useRouter();

  const [user, setUser] =
    useState<User | null>(null);

  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);


  // ==================================================
  // LOAD
  // ==================================================

  useEffect(() => {

    loadCompletedTasks();

  }, []);


  async function loadCompletedTasks() {

    try {

      // ----------------------------------------------
      // CHECK LOGIN
      // ----------------------------------------------

      const meResponse =
        await fetch("/api/auth/me");

      if (!meResponse.ok) {

        router.push("/login");

        return;

      }


      const me =
        await meResponse.json();


      if (
        !me.success ||
        !me.user
      ) {

        router.push("/login");

        return;

      }


      // ----------------------------------------------
      // CHECK ROLE
      // ----------------------------------------------

      if (me.user.role === "admin") {

        router.push("/admin");

        return;

      }


      if (me.user.role !== "employee") {

        router.push("/");

        return;

      }


      setUser(me.user);


      // ----------------------------------------------
      // LOAD TASKS
      // ----------------------------------------------

      const response =
        await fetch("/api/employee/tasks");

      const result =
        await response.json();


      if (
        !response.ok ||
        !result.success
      ) {

        setError(
          result.error ||
          "Kunne ikke hente fullførte saker."
        );

        return;

      }


      // ----------------------------------------------
      // ONLY COMPLETED TASKS
      // ----------------------------------------------

      const completed =
        (result.data || []).filter(
          (ticket: Ticket) =>
            ticket.status === "completed" ||
            ticket.status === "finished"
        );


      setTickets(completed);


    } catch (err) {

      console.error(err);

      setError(
        "Kunne ikke laste fullførte saker."
      );

    } finally {

      setLoading(false);

    }

  }


  // ==================================================
  // LOGOUT
  // ==================================================

  async function logout() {

    await fetch(
      "/api/auth/logout",
      {
        method: "POST",
      }
    );

    router.push("/login");

  }


  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {

    return (

      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">

        <div className="text-sm text-slate-500 dark:text-slate-400">

          Laster fullførte saker...

        </div>

      </main>

    );

  }


  // ==================================================
  // ERROR
  // ==================================================

  if (error) {

    return (

      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">

        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">

          {error}

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


            {/* ACTIVE TASKS */}

            <button
              onClick={() =>
                router.push("/my-tickets")
              }
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
            >

              <span>📋</span>

              Mine tildelte saker

            </button>


            {/* COMPLETED TASKS */}

            <button
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-left text-sm font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
            >

              <span>✓</span>

              Fullførte saker

            </button>


            {/* HELP */}

            <button
              onClick={() =>
                router.push("/help")
              }
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
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
            MOBILE HEADER
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
                className="cursor-pointer rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Åpne meny"
              >

                ☰

              </button>

            </div>


            {/* MOBILE MENU */}

            {mobileMenuOpen && (

              <div className="space-y-2 border-t border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">


                <button
                  onClick={() =>
                    router.push("/my-tickets")
                  }
                  className="w-full cursor-pointer rounded-lg px-4 py-3 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >

                  📋 Mine tildelte saker

                </button>


                <button
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="w-full cursor-pointer rounded-lg bg-blue-50 px-4 py-3 text-left text-sm font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                >

                  ✓ Fullførte saker

                </button>


                <button
                  onClick={() =>
                    router.push("/help")
                  }
                  className="w-full cursor-pointer rounded-lg px-4 py-3 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
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

                  Fullførte saker

                </h1>

                <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">

                  Her finner du saker du tidligere har fullført.

                </p>

              </div>


              <NotificationBell />

            </div>

          </header>


          {/* CONTENT */}

          <div className="space-y-8 p-5 lg:p-8">


            {/* ==================================================
                SUMMARY
            ================================================== */}

            <section>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

                <div className="flex items-center gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-50 text-xl text-green-600 dark:bg-green-950/40 dark:text-green-400">

                    ✓

                  </div>

                  <div>

                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">

                      Fullførte saker

                    </p>

                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">

                      {tickets.length}

                    </p>

                  </div>

                </div>

              </div>

            </section>


            {/* ==================================================
                TICKET LIST
            ================================================== */}

            <section>

              <div className="mb-5">

                <h2 className="text-lg font-bold text-slate-900 dark:text-white">

                  Sakshistorikk

                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                  Saker du har ferdigbehandlet.

                </p>

              </div>


              {tickets.length === 0 ? (

                <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">

                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl dark:bg-slate-800">

                    ✓

                  </div>

                  <p className="mt-4 font-semibold text-slate-700 dark:text-slate-200">

                    Ingen fullførte saker

                  </p>

                  <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">

                    Du har ikke fullført noen saker ennå.

                  </p>

                </div>

              ) : (

                <div className="space-y-4">

                  {tickets.map(ticket => (

                    <CompletedTicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onOpen={() =>
                        router.push(
                          `/tickets/${ticket.id}`
                        )
                      }
                    />

                  ))}

                </div>

              )}

            </section>

          </div>

        </section>

      </div>

    </main>

  );

}


// ====================================================
// COMPLETED TICKET CARD
// ====================================================

function CompletedTicketCard({
  ticket,
  onOpen,
}: {
  ticket: Ticket;
  onOpen: () => void;
}) {

  return (

    <article
      onClick={onOpen}
      className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 sm:p-6"
    >

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">


        {/* ID */}

        <div className="w-16 shrink-0">

          <p className="text-xs font-medium text-slate-400 dark:text-slate-500">

            SAK

          </p>

          <p className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">

            #{ticket.id}

          </p>

        </div>


        {/* CONTENT */}

        <div className="min-w-0 flex-1">

          {/* BADGES */}

          <div className="mb-3 flex flex-wrap items-center gap-2">

            <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">

              {ticket.category}

            </span>


            {ticket.subcategory && (

              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">

                {ticket.subcategory}

              </span>

            )}


            <PriorityBadge
              priority={ticket.priority}
            />


            <StatusBadge
              status={ticket.status}
            />

          </div>


          {/* DESCRIPTION */}

          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-800 dark:text-slate-200">

            {ticket.content}

          </p>


          {/* META */}

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400 dark:text-slate-500">

            <span>

              Opprettet{" "}

              {new Date(
                ticket.created_at
              ).toLocaleDateString(
                "nb-NO"
              )}

            </span>


            {ticket.sender && (

              <span>

                Fra:{" "}

                <span className="font-medium text-slate-500 dark:text-slate-300">

                  {ticket.sender.name}

                </span>

              </span>

            )}

          </div>

        </div>


        {/* OPEN */}

        <div className="shrink-0">

          <span className="text-sm font-semibold text-blue-600 transition group-hover:text-blue-700 dark:text-blue-400 dark:group-hover:text-blue-300">

            Åpne →

          </span>

        </div>

      </div>


      {/* FOOTER */}

      <div className="mt-5 flex flex-wrap gap-6 border-t border-slate-100 pt-4 dark:border-slate-800">


        <div>

          <p className="text-xs font-medium text-slate-400 dark:text-slate-500">

            Prioritet

          </p>

          <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">

            {getPriorityLabel(
              ticket.priority
            )}

          </p>

        </div>


        <div>

          <p className="text-xs font-medium text-slate-400 dark:text-slate-500">

            Frist

          </p>

          <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">

            {ticket.due_date
              ? new Date(
                  ticket.due_date
                ).toLocaleDateString(
                  "nb-NO"
                )
              : "Ingen frist"}

          </p>

        </div>


        <div>

          <p className="text-xs font-medium text-slate-400 dark:text-slate-500">

            Status

          </p>

          <p className="mt-1 text-sm font-medium text-green-600 dark:text-green-400">

            Ferdig

          </p>

        </div>

      </div>

    </article>

  );

}


// ====================================================
// PRIORITY BADGE
// ====================================================

function PriorityBadge({
  priority,
}: {
  priority: string;
}) {

  if (
    priority === "høy" ||
    priority === "high"
  ) {

    return (

      <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-950/50 dark:text-red-400">

        Høy

      </span>

    );

  }


  if (priority === "medium") {

    return (

      <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">

        Medium

      </span>

    );

  }


  return (

    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">

      Lav

    </span>

  );

}


// ====================================================
// PRIORITY LABEL
// ====================================================

function getPriorityLabel(
  priority: string
) {

  if (
    priority === "høy" ||
    priority === "high"
  ) {

    return "Høy";

  }

  if (priority === "medium") {

    return "Medium";

  }

  return "Lav";

}


// ====================================================
// STATUS BADGE
// ====================================================

function StatusBadge({
  status,
}: {
  status: string;
}) {

  return (

    <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950/50 dark:text-green-400">

      {status === "finished"
        ? "Ferdig"
        : "Ferdig"}

    </span>

  );

}