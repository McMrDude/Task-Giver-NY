"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import ThemeToggle from "../../components/ThemeToggle";
import { supabase } from "../../supabaseClient";


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

  receiver?: {
    id: string | number;
    name: string;
    email: string;
  } | null;
};

type Message = {
  id: number;
  task_id: number;
  sender_id: string | number;
  content: string;
  created_at: string;

  sender?: {
    id: string | number;
    name: string;
    email: string;
    role: string;
  } | null;
};


// ====================================================
// PAGE
// ====================================================

export default function TicketDetailPage() {

  const router = useRouter();

  const params = useParams();

  const id = params.id;


  // --------------------------------------------------
  // STATE
  // --------------------------------------------------

  const [user, setUser] =
    useState<User | null>(null);

  const [ticket, setTicket] =
    useState<Ticket | null>(null);

  const [employees, setEmployees] =
    useState<User[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [updating, setUpdating] =
    useState(false);

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [messageText, setMessageText] =
    useState("");

  const [sendingMessage, setSendingMessage] =
    useState(false);

  const [messagesLoading, setMessagesLoading] =
    useState(true);


  // ==================================================
  // LOAD
  // ==================================================

  useEffect(() => {

    loadTicket();

  }, [id]);

useEffect(() => {

  if (!id) {
    return;
  }

  const channel = supabase
    .channel(`ticket-messages-${id}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "task_messages",
        filter: `task_id=eq.${id}`,
      },
      async (payload) => {

        console.log(
          "Realtime message received:",
          payload
        );

        const newMessage =
          payload.new as Message;


        // --------------------------------------------
        // PREVENT DUPLICATES
        // --------------------------------------------

        setMessages(currentMessages => {

          const alreadyExists =
            currentMessages.some(
              message =>
                message.id === newMessage.id
            );

          if (alreadyExists) {
            return currentMessages;
          }

          return [
            ...currentMessages,
            newMessage,
          ];

        });


        // --------------------------------------------
        // LOAD SENDER INFORMATION
        // --------------------------------------------

        try {

          const response =
            await fetch(
              `/api/tasks/${id}/messages`
            );

          const result =
            await response.json();

          if (
            response.ok &&
            result.success
          ) {

            const updatedMessages =
              result.data || [];

            setMessages(updatedMessages);

          }

        } catch (error) {

          console.error(
            "Could not load message sender:",
            error
          );

        }

      }
    )
    .subscribe((status) => {

      console.log(
        "Realtime subscription:",
        status
      );

    });


  return () => {

    supabase.removeChannel(
      channel
    );

  };

}, [id]);


  async function loadTicket() {

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


      setUser(me.user);


      // ----------------------------------------------
      // LOAD TICKET
      // ----------------------------------------------

      const response =
        await fetch(
          `/api/tasks/${id}`
        );


      const result =
        await response.json();


      if (
        !response.ok ||
        !result.success
      ) {

        setError(
          result.error ||
          "Kunne ikke hente saken."
        );

        return;

      }


      setTicket(result.data);

    // ----------------------------------------------
    // LOAD MESSAGES
    // ----------------------------------------------

    const messageResponse =
    await fetch(
        `/api/tasks/${id}/messages`
    );

    const messageResult =
    await messageResponse.json();

    if (
    messageResponse.ok &&
    messageResult.success
    ) {

    setMessages(
        messageResult.data || []
    );

    }
    setMessagesLoading(false);


      // ----------------------------------------------
      // LOAD EMPLOYEES FOR ADMIN
      // ----------------------------------------------

      if (
        me.user.role === "admin"
      ) {

        const employeeResponse =
          await fetch(
            "/api/admin/users"
          );


        if (
          employeeResponse.ok
        ) {

          const employeeResult =
            await employeeResponse.json();


          if (
            employeeResult.success
          ) {

            setEmployees(
              employeeResult.data || []
            );

          }

        }

      }

    } catch (error) {

      console.error(error);

      setError(
        "Kunne ikke laste saken."
      );

    } finally {

      setLoading(false);

    }

  }


  // ==================================================
  // UPDATE TICKET - ADMIN
  // ==================================================

  async function updateAdminTicket(
    changes: {
      status?: string;
      receiver_id?: string | null;
      priority?: string;
      due_date?: string | null;
    }
  ) {

    if (!ticket) {
      return;
    }


    setUpdating(true);


    try {

      const response =
        await fetch(
          "/api/admin/tasks",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              id: ticket.id,
              ...changes,
            }),
          }
        );


      const result =
        await response.json();


      if (
        !response.ok ||
        !result.success
      ) {

        alert(
          result.error ||
          "Kunne ikke oppdatere saken."
        );

        return;

      }


      // --------------------------------------------
      // UPDATE LOCAL TICKET
      // --------------------------------------------

      setTicket(current => {

        if (!current) {
          return current;
        }


        let receiver =
          current.receiver;


        if (
          "receiver_id" in changes
        ) {

          if (
            changes.receiver_id
          ) {

            const selectedEmployee =
              employees.find(
                employee =>
                  String(employee.id) ===
                  String(changes.receiver_id)
              );


            receiver =
              selectedEmployee
                ? {
                    id:
                      selectedEmployee.id,
                    name:
                      selectedEmployee.name,
                    email:
                      selectedEmployee.email,
                  }
                : null;

          } else {

            receiver = null;

          }

        }


        return {
          ...current,
          ...changes,
          receiver,
        };

      });


    } catch (error) {

      console.error(error);

      alert(
        "En nettverksfeil oppstod."
      );

    } finally {

      setUpdating(false);

    }

  }


  // ==================================================
  // UPDATE STATUS - EMPLOYEE
  // ==================================================

  async function updateEmployeeStatus(
    status: string
  ) {

    if (!ticket) {
      return;
    }


    setUpdating(true);


    try {

      const response =
        await fetch(
          "/api/employee/tasks",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              id: ticket.id,
              status,
            }),
          }
        );


      const result =
        await response.json();


      if (
        !response.ok ||
        !result.success
      ) {

        alert(
          result.error ||
          "Kunne ikke oppdatere saken."
        );

        return;

      }


      setTicket(current => {

        if (!current) {
          return current;
        }


        return {
          ...current,
          status,
        };

      });


    } catch (error) {

      console.error(error);

      alert(
        "En nettverksfeil oppstod."
      );

    } finally {

      setUpdating(false);

    }

  }

  // ==================================================
// SEND MESSAGE
// ==================================================

async function sendMessage() {

  const content =
    messageText.trim();

  if (
    !content ||
    sendingMessage
  ) {
    return;
  }


  setSendingMessage(true);


  try {

    const response =
      await fetch(
        `/api/tasks/${id}/messages`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            content,
          }),
        }
      );


    const result =
      await response.json();


    if (
      !response.ok ||
      !result.success
    ) {

      alert(
        result.error ||
        "Kunne ikke sende meldingen."
      );

      return;

    }


    // ----------------------------------------------
    // ADD MESSAGE TO SCREEN
    // ----------------------------------------------

    setMessages(current => [
      ...current,
      result.data,
    ]);


    // ----------------------------------------------
    // CLEAR INPUT
    // ----------------------------------------------

    setMessageText("");


  } catch (error) {

    console.error(error);

    alert(
      "En nettverksfeil oppstod."
    );

  } finally {

    setSendingMessage(false);

  }

}


  // ==================================================
  // BACK NAVIGATION
  // ==================================================

  function goBack() {

    if (
      user?.role === "admin"
    ) {

      router.push("/admin");

      return;

    }


    if (
      user?.role === "employee"
    ) {

      router.push("/employee");

      return;

    }


    router.push("/my-tickets");

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

          Laster sak...

        </div>

      </main>

    );

  }


  // ==================================================
  // ERROR
  // ==================================================

  if (
    error ||
    !ticket
  ) {

    return (

      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">

        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">

          {error ||
            "Saken ble ikke funnet."}

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

        <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:flex">


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


            {/* BACK */}

            <button
              onClick={goBack}
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
            >

              <span>←</span>

              {user?.role === "admin"
                ? "Tilbake til admin"
                : "Tilbake til mine saker"}

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
                className="cursor-pointer rounded-lg border border-slate-200 p-2 text-slate-600 dark:border-slate-700 dark:text-slate-300"
              >

                ☰

              </button>

            </div>


            {mobileMenuOpen && (

              <div className="space-y-2 border-t border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">


                <button
                  onClick={goBack}
                  className="w-full cursor-pointer rounded-lg px-4 py-3 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >

                  ←{" "}

                  {user?.role === "admin"
                    ? "Tilbake til admin"
                    : "Mine saker"}

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

          <header className="border-b border-slate-200 bg-white px-5 py-6 dark:border-slate-800 dark:bg-slate-900 lg:px-8">


            <button
              onClick={goBack}
              className="mb-4 cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >

              ←{" "}

              {user?.role === "admin"
                ? "Tilbake til admin"
                : "Tilbake til mine saker"}

            </button>


            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">

              {user?.role === "admin"
                ? "Administrasjon"
                : user?.role === "employee"
                ? "Ansattportal"
                : "Brukerportal"}

            </p>


            <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">

                  Sak #{ticket.id}

                </h1>


                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                  {ticket.category}

                  {ticket.subcategory &&
                    ` · ${ticket.subcategory}`}

                </p>

              </div>


              <StatusBadge
                status={ticket.status}
              />

            </div>

          </header>


          {/* CONTENT */}

          <div className="mx-auto max-w-5xl space-y-6 p-5 lg:p-8">


            {/* ==================================================
                DESCRIPTION
            ================================================== */}

            <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

              <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">

                <h2 className="font-semibold text-slate-900 dark:text-white">

                  Beskrivelse

                </h2>

              </div>


              <div className="p-5">

                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-200">

                  {ticket.content}

                </p>

              </div>

            </section>


            {/* ==================================================
                INFORMATION
            ================================================== */}

            <section className="grid grid-cols-1 gap-6 md:grid-cols-2">


              {/* GENERAL */}

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

                <h2 className="mb-5 font-semibold text-slate-900 dark:text-white">

                  Saksinformasjon

                </h2>


                <div className="space-y-4">

                  <InfoRow
                    label="Saksnummer"
                    value={`#${ticket.id}`}
                  />


                  <InfoRow
                    label="Kategori"
                    value={ticket.category}
                  />


                  <InfoRow
                    label="Underkategori"
                    value={
                      ticket.subcategory ||
                      "Ingen underkategori"
                    }
                  />


                  <InfoRow
                    label="Prioritet"
                    value={getPriorityLabel(
                      ticket.priority
                    )}
                  />


                  {user?.role !== "admin" && (

                    <InfoRow
                        label="Ansvarlig"
                        value={
                        ticket.receiver?.name ||
                        "Ikke tildelt ennå"
                        }
                    />

                )}

                </div>

              </div>


              {/* DATES */}

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

                <h2 className="mb-5 font-semibold text-slate-900 dark:text-white">

                  Tidspunkt

                </h2>


                <div className="space-y-4">

                  <InfoRow
                    label="Opprettet"
                    value={formatDate(
                      ticket.created_at
                    )}
                  />


                  <InfoRow
                    label="Frist"
                    value={
                      ticket.due_date
                        ? formatDate(
                            ticket.due_date
                          )
                        : "Ingen frist"
                    }
                  />

                </div>

              </div>

            </section>


            {/* ==================================================
                ADMIN CONTROLS
            ================================================== */}

            {user?.role === "admin" && (

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

                <div>

                  <h2 className="font-semibold text-slate-900 dark:text-white">

                    Administrasjon

                  </h2>


                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                    Administrer ansvarlig, status, prioritet og frist for denne saken.

                  </p>

                </div>


                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">


                  {/* ASSIGN EMPLOYEE */}

                  <div>

                    <label className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">

                      Ansvarlig ansatt

                    </label>


                    <select
                      value={
                        ticket.receiver_id
                          ? String(
                              ticket.receiver_id
                            )
                          : ""
                      }
                      disabled={updating}
                      onChange={e =>
                        updateAdminTicket({
                          receiver_id:
                            e.target.value ||
                            null,
                        })
                      }
                      className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
                    >

                      <option value="">
                        Ikke tildelt
                      </option>


                      {employees.map(
                        employee => (

                          <option
                            key={employee.id}
                            value={String(
                              employee.id
                            )}
                          >

                            {employee.name}

                          </option>

                        )
                      )}

                    </select>

                  </div>


                  {/* STATUS */}

                  <div>

                    <label className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">

                      Status

                    </label>


                    <select
                      value={ticket.status}
                      disabled={updating}
                      onChange={e =>
                        updateAdminTicket({
                          status:
                            e.target.value,
                        })
                      }
                      className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
                    >

                      <option value="not_started">
                        Ny
                      </option>


                      <option value="started">
                        Pågår
                      </option>


                      <option value="completed">
                        Ferdig
                      </option>


                      <option value="cancelled">
                        Avbrutt
                      </option>

                    </select>

                  </div>


                  {/* PRIORITY */}

                  <div>

                    <label className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">

                      Prioritet

                    </label>


                    <select
                      value={ticket.priority}
                      disabled={updating}
                      onChange={e =>
                        updateAdminTicket({
                          priority:
                            e.target.value,
                        })
                      }
                      className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
                    >

                      <option value="lav">
                        Lav
                      </option>


                      <option value="medium">
                        Medium
                      </option>


                      <option value="høy">
                        Høy
                      </option>

                    </select>

                  </div>


                  {/* DUE DATE */}

                  <div>

                    <label className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">

                      Frist

                    </label>


                    <input
                      type="date"
                      value={
                        ticket.due_date
                          ? ticket.due_date.slice(
                              0,
                              10
                            )
                          : ""
                      }
                      disabled={updating}
                      onChange={e =>
                        updateAdminTicket({
                          due_date:
                            e.target.value ||
                            null,
                        })
                      }
                      className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
                    />

                  </div>

                </div>


                {updating && (

                  <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">

                    Lagrer endring...

                  </p>

                )}

              </section>

            )}


            {/* ==================================================
                EMPLOYEE CONTROLS
            ================================================== */}

            {user?.role === "employee" && (

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

                <h2 className="font-semibold text-slate-900 dark:text-white">

                  Behandling

                </h2>


                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                  Oppdater statusen på saken mens du arbeider med den.

                </p>


                <div className="mt-5">

                  <label className="mb-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">

                    Status

                  </label>


                  <select
                    value={ticket.status}
                    disabled={updating}
                    onChange={e =>
                      updateEmployeeStatus(
                        e.target.value
                      )
                    }
                    className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
                  >

                    <option value="not_started">
                      Ny
                    </option>


                    <option value="started">
                      Pågår
                    </option>


                    <option value="completed">
                      Ferdig
                    </option>

                  </select>

                </div>

              </section>

            )}


            {/* ==================================================
    MESSAGES
================================================== */}

<section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

  {/* HEADER */}

  <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">

    <h2 className="font-semibold text-slate-900 dark:text-white">
      Samtale
    </h2>

    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
      Meldinger mellom deg og de som behandler saken.
    </p>

  </div>


  {/* MESSAGES */}

  <div className="space-y-4 p-5">

    {messagesLoading ? (

      <div className="py-6 text-center">

        <p className="text-sm text-slate-400 dark:text-slate-500">
          Laster meldinger...
        </p>

      </div>

    ) : messages.length === 0 ? (

      <div className="rounded-lg bg-slate-50 p-6 text-center dark:bg-slate-950">

        <p className="text-sm text-slate-400 dark:text-slate-500">
          Ingen meldinger ennå.
        </p>

      </div>

    ) : (

      messages.map(message => {

        const isOwnMessage =
          String(message.sender_id) ===
          String(user?.id);

        return (

          <div
            key={message.id}
            className={`flex ${
              isOwnMessage
                ? "justify-end"
                : "justify-start"
            }`}
          >

            <div
              className={`max-w-[85%] rounded-xl px-4 py-3 ${
                isOwnMessage
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
              }`}
            >

              {/* SENDER */}

              <div className="mb-1 flex items-center gap-2">

                <span
                  className={`text-xs font-semibold ${
                    isOwnMessage
                      ? "text-blue-100"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {message.sender?.name ||
                    "Ukjent bruker"}
                </span>

              </div>


              {/* CONTENT */}

              <p className="whitespace-pre-wrap text-sm leading-6">
                {message.content}
              </p>


              {/* DATE */}

              <p
                className={`mt-2 text-[11px] ${
                  isOwnMessage
                    ? "text-blue-200"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {new Date(
                  message.created_at
                ).toLocaleString(
                  "nb-NO",
                  {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              </p>

            </div>

          </div>

        );

      })

    )}

  </div>


  {/* MESSAGE INPUT */}

  <div className="border-t border-slate-100 p-5 dark:border-slate-800">

    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">

      <textarea
        value={messageText}
        onChange={e =>
          setMessageText(
            e.target.value
          )
        }
        onKeyDown={e => {

          if (
            e.key === "Enter" &&
            !e.shiftKey
          ) {

            e.preventDefault();

            sendMessage();

          }

        }}
        disabled={sendingMessage}
        placeholder="Skriv en melding..."
        rows={3}
        className="min-h-[80px] flex-1 resize-y rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-950"
      />


      <button
        type="button"
        onClick={sendMessage}
        disabled={
          sendingMessage ||
          !messageText.trim()
        }
        className="cursor-pointer rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {sendingMessage
          ? "Sender..."
          : "Send melding"}
      </button>

    </div>


    <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
      Enter sender meldingen. Shift + Enter lager en ny linje.
    </p>

  </div>

</section>


          </div>

        </section>

      </div>

    </main>

  );

}


// ====================================================
// INFO ROW
// ====================================================

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (

    <div className="flex items-start justify-between gap-4">

      <span className="text-sm text-slate-500 dark:text-slate-400">

        {label}

      </span>


      <span className="text-right text-sm font-medium text-slate-900 dark:text-slate-100">

        {value}

      </span>

    </div>

  );

}


// ====================================================
// DATE
// ====================================================

function formatDate(
  value: string
) {

  return new Date(
    value
  ).toLocaleDateString(
    "nb-NO",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );

}


// ====================================================
// PRIORITY
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


  if (
    priority === "medium"
  ) {

    return "Medium";

  }


  return "Lav";

}


// ====================================================
// STATUS
// ====================================================

function StatusBadge({
  status,
}: {
  status: string;
}) {

  if (
    status === "started" ||
    status === "pågår"
  ) {

    return (

      <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">

        Pågår

      </span>

    );

  }


  if (
    status === "completed" ||
    status === "finished"
  ) {

    return (

      <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950/50 dark:text-green-400">

        Ferdig

      </span>

    );

  }


  if (
    status === "cancelled"
  ) {

    return (

      <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-950/50 dark:text-red-400">

        Avbrutt

      </span>

    );

  }


  return (

    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">

      Ny

    </span>

  );

}