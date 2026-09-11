"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "../components/ThemeToggle";
import NotificationBell from "../components/NotificationBell";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Ticket = {
  id: number;
  sender_id: string;
  receiver_id: string | null;

  content: string;
  category: string;
  subcategory: string;

  status: string;
  priority: string;

  due_date: string | null;
  created_at: string;
};

export default function MyTicketsPage() {

  const router = useRouter();

  const [user, setUser] =
    useState<User | null>(null);

  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ------------------------------------------------
  // LOAD
  // ------------------------------------------------

  useEffect(() => {
    loadPage();
  }, []);


  async function loadPage() {

    try {

      // --------------------------------------------
      // Get logged-in user
      // --------------------------------------------

      const meResponse =
        await fetch("/api/auth/me");

      if (!meResponse.ok) {
        router.push("/login");
        return;
      }

      const me =
        await meResponse.json();

      if (!me.success || !me.user) {
        router.push("/login");
        return;
      }

      setUser(me.user);


      // --------------------------------------------
      // Employees should use employee dashboard
      // --------------------------------------------

      if (me.user.role === "employee") {
        router.push("/employee");
        return;
      }


      // --------------------------------------------
      // Admin should use admin dashboard
      // --------------------------------------------

      if (me.user.role === "admin") {
        router.push("/admin");
        return;
      }


      // --------------------------------------------
      // Load user's tickets
      // --------------------------------------------

      const response =
        await fetch("/api/my-tickets");

      const result =
        await response.json();

      if (!response.ok || !result.success) {

        setError(
          result.error ||
          "Kunne ikke hente dine saker."
        );

        return;
      }

      setTickets(
        result.data || []
      );

    } catch (error) {

      console.error(error);

      setError(
        "Kunne ikke laste siden."
      );

    } finally {

      setLoading(false);

    }

  }


  const openTickets = tickets.filter(
    ticket =>
      ticket.status !== "completed" &&
      ticket.status !== "cancelled"
  );

  const closedTickets = tickets.filter(
    ticket =>
      ticket.status === "completed" ||
      ticket.status === "cancelled"
  );


  // ------------------------------------------------
  // LOGOUT
  // ------------------------------------------------

  async function logout() {

    await fetch(
      "/api/auth/logout",
      {
        method: "POST",
      }
    );

    router.push("/login");
  }


  // ------------------------------------------------
  // LOADING
  // ------------------------------------------------

  if (loading) {

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">

        <p className="text-sm text-slate-500 dark:text-slate-400">
          Laster dine saker...
        </p>

      </main>
    );

  }


  // ------------------------------------------------
  // PAGE
  // ------------------------------------------------

  return (

    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">

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
                      onClick={() => router.push("/")}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
                    >
                      <span>⌂</span>
                      Oversikt
                    </button>
        
        
                    <button
                      onClick={() => {
                        router.push("/my-tickets");
                      }}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-left text-sm font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
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


        {/* ==========================================
            MAIN
        ========================================== */}

        <section className="min-w-0 flex-1 lg:pl-64">


          {/* MOBILE HEADER */}

          <header className="border-b border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:hidden">

            <div className="flex items-center justify-between">

              <button
                onClick={() => router.push("/")}
                className="cursor-pointer text-sm font-medium text-blue-600"
              >
                ← Oversikt
              </button>

              <ThemeToggle />

            </div>

          </header>


          {/* DESKTOP HEADER */}

          <header className="border-b border-slate-200 bg-white px-6 py-6 dark:border-slate-800 dark:bg-slate-900 lg:px-8">

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Mine saker
                </p>

                <h1 className="mt-1 text-2xl font-bold">
                  Mine støttesaker
                </h1>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Her finner du støttesakene du har sendt inn.
                </p>

              </div>

              <NotificationBell />

            </div>

          </header>


          {/* CONTENT */}

          <div className="p-6 lg:p-8">

            {error && (

              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
                {error}
              </div>

            )}


            {tickets.length === 0 ? (

  <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">

    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl dark:bg-slate-800">
      📋
    </div>

    <h2 className="mt-4 font-semibold">
      Du har ingen støttesaker
    </h2>

    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
      Når du sender inn en sak vil den vises her.
    </p>

    <button
      onClick={() => router.push("/")}
      className="mt-5 cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
    >
      Opprett støttesak
    </button>

  </div>

) : (

  <div className="space-y-10">


    {/* ==========================================
        OPEN TICKETS
    ========================================== */}

    {openTickets.length > 0 && (

      <section>

        <div className="mb-4">

          <div className="flex items-center justify-between gap-3">

            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Åpne saker
            </h2>

            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
              {openTickets.length}
            </span>

          </div>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Saker som fortsatt behandles.
          </p>

        </div>


        <div className="space-y-3">

          {openTickets.map(ticket => (

            <TicketCard
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

      </section>

    )}


    {/* ==========================================
        CLOSED TICKETS
    ========================================== */}

    {closedTickets.length > 0 && (

      <section>

        <div className="mb-4">

          <div className="flex items-center justify-between gap-3">

            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Avsluttede saker
            </h2>

            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {closedTickets.length}
            </span>

          </div>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Saker som er ferdig behandlet eller avsluttet.
          </p>

        </div>


        <div className="space-y-3">

          {closedTickets.map(ticket => (

            <TicketCard
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

      </section>

    )}

  </div>

)}

          </div>

        </section>

      </div>

    </main>

  );
}


// ==================================================
// TICKET CARD
// ==================================================

function TicketCard({
  ticket,
  onOpen,
}: {
  ticket: Ticket;
  onOpen: () => void;
}) {

  return (

    <button
      type="button"
      onClick={onOpen}
      className="
        group
        w-full
        cursor-pointer
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-5
        text-left
        shadow-sm
        transition
        hover:border-blue-300
        hover:shadow-md
        dark:border-slate-800
        dark:bg-slate-900
        dark:hover:border-blue-800
        sm:p-6
      "
    >

      <div className="flex flex-col gap-5">


        {/* ==========================================
            TOP ROW
        ========================================== */}

        <div className="flex items-start justify-between gap-4">

          {/* LEFT */}

          <div className="min-w-0">

            <div className="flex flex-wrap items-center gap-2">

              {/* TICKET ID */}

              <span className="font-mono text-base font-bold text-slate-500 dark:text-slate-400">

                #{ticket.id}

              </span>


              {/* CATEGORY */}

              <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">

                {ticket.category}

              </span>


              {/* SUBCATEGORY */}

              {ticket.subcategory && (

                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">

                  {ticket.subcategory}

                </span>

              )}

            </div>

          </div>


          {/* STATUS */}

          <StatusBadge
            status={ticket.status}
          />

        </div>


        {/* ==========================================
            TICKET TITLE / DESCRIPTION
        ========================================== */}

        <div>

          <p className="text-base font-semibold leading-6 text-slate-900 dark:text-white sm:text-lg sm:leading-7">

            {ticket.content}

          </p>

        </div>


        {/* ==========================================
            BOTTOM INFORMATION
        ========================================== */}

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">


          {/* DATES */}

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-slate-400">

            <span>

              Opprettet{" "}

              <span className="font-medium text-slate-700 dark:text-slate-300">

                {new Date(
                  ticket.created_at
                ).toLocaleDateString(
                  "nb-NO"
                )}

              </span>

            </span>


            {ticket.due_date && (

              <span>

                Frist{" "}

                <span className="font-medium text-slate-700 dark:text-slate-300">

                  {new Date(
                    ticket.due_date
                  ).toLocaleDateString(
                    "nb-NO"
                  )}

                </span>

              </span>

            )}

          </div>


          {/* OPEN INDICATOR */}

          <span className="text-sm font-semibold text-blue-600 transition group-hover:translate-x-0.5 dark:text-blue-400">

            Se sak →

          </span>

        </div>

      </div>

    </button>

  );

}


// ==================================================
// STATUS
// ==================================================

function StatusBadge({
  status,
}: {
  status: string;
}) {

  if (status === "started") {

    return (

      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">

        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />

        Pågår

      </span>

    );

  }


  if (status === "completed") {

    return (

      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 dark:bg-green-950/50 dark:text-green-400">

        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />

        Ferdig

      </span>

    );

  }


  if (status === "cancelled") {

    return (

      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 dark:bg-red-950/50 dark:text-red-400">

        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />

        Avbrutt

      </span>

    );

  }


  return (

    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">

      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />

      Ny

    </span>

  );

}