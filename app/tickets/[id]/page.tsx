"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import ThemeToggle from "../../components/ThemeToggle";
import { supabase } from "../../supabaseClient";


// ====================================================
// TYPES
// ====================================================

type Attachment = {
  id: number;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  url: string;
};

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

  title: string | null;
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

  attachments: Attachment[];
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

  const messagesContainerRef =
    useRef<HTMLDivElement | null>(null);

  const [loggingOut, setLoggingOut] = useState(false);

  // ==================================================
  // LOAD
  // ==================================================

  useEffect(() => {

  if (messagesLoading) {
    return;
  }

  requestAnimationFrame(() => {

    scrollMessagesToBottom("smooth");

  });

}, [messages, messagesLoading]);

  useEffect(() => {

    loadTicket();

  }, [id]);


// ==================================================
// CHAT PRESENCE
// Tell server that this task is currently being viewed
// ==================================================

useEffect(() => {

  if (!id) {
    return;
  }


  const updatePresence = () => {

    fetch(
      `/api/tasks/${id}/messages/presence`,
      {
        method: "POST",
      }
    ).catch(error => {

      console.error(
        "Could not update chat presence:",
        error
      );

    });

  };


  // Tell server immediately
  updatePresence();


  // Keep presence alive
  const interval =
    setInterval(
      updatePresence,
      10000
    );


  return () => {

    clearInterval(interval);


    // Tell server we left the chat
    fetch(
      `/api/tasks/${id}/messages/presence`,
      {
        method: "DELETE",
        keepalive: true,
      }
    ).catch(() => {});

  };

}, [id]);


useEffect(() => {

  if (!id) {
    return;
  }

  console.log(
    "Creating Realtime subscription for ticket:",
    id
  );

  const channel = supabase
    .channel(`ticket-messages-${id}`)
    .on(
      "broadcast",
      {
        event: "new-message",
      },
      async (payload) => {

        console.log(
          "🔥 REALTIME MESSAGE RECEIVED:",
          payload
        );


        // --------------------------------------------
        // RELOAD MESSAGES
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

            setMessages(
              result.data || []
            );

          }

        } catch (error) {

          console.error(
            "Could not reload messages:",
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

    console.log(
      "Removing Realtime subscription"
    );

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
// SCROLL CHAT TO BOTTOM
// ==================================================

function scrollMessagesToBottom(
  behavior: ScrollBehavior = "smooth"
) {
  const container =
    messagesContainerRef.current;

  if (!container) {
    return;
  }

  container.scrollTo({
    top: container.scrollHeight,
    behavior,
  });
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

      router.push("/admin/tickets");

      return;

    }


    if (
      user?.role === "employee"
    ) {

      router.push("/employee/tasks");

      return;

    }


    router.push("/my-tickets");

  }


  // ==================================================
  // LOGOUT
  // ==================================================

  async function logout() {
    try {
      setLoggingOut(true);

      await fetch("/api/auth/logout", {
        method: "POST",
      });

      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
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
    <main className="min-h-screen w-full overflow-x-hidden bg-[#f5f7fb] text-slate-900 dark:bg-slate-950 dark:text-slate-100">

      {/* =====================================================
          MOBILE HEADER
          Only visible on phones/tablets
      ===================================================== */}
      <header className="sticky top-0 z-50 lg:hidden">
        <div className="border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/95">

          <div className="flex h-16 items-center gap-3 px-4 sm:px-5">

            {/* BACK BUTTON */}
            <button
              type="button"
              onClick={goBack}
              aria-label="Gå tilbake"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.97] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
            </button>


            {/* PAGE TITLE */}
            <div className="min-w-0 flex-1">

              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                IT Support
              </p>

              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                Sak #{ticket.id}
              </p>

            </div>


            {/* THEME */}
            <div className="shrink-0">
              <ThemeToggle />
            </div>

          </div>

        </div>
      </header>


      {/* =====================================================
          DESKTOP / PAGE LAYOUT
      ===================================================== */}
      <div className="flex min-h-screen w-full">

        {/* ===================================================
            DESKTOP SIDEBAR
            Hidden completely below lg
        =================================================== */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:flex">

          {/* LOGO */}

          <div className="border-b border-slate-200 p-5 dark:border-slate-800">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
                IT
              </div>

              <div>

                <p className="font-bold text-slate-900 dark:text-white">
                  IT Support
                </p>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Administrasjon
                </p>

              </div>

            </div>

          </div>


          {/* NAVIGATION */}

          <nav className="flex-1 space-y-1 overflow-y-auto p-3">

            {user?.role=="admin"} && (

              {/* DASHBOARD */}

              <button
                onClick={() =>
                  router.push("/admin")
                }
                className="w-full cursor-pointer rounded-lg bg-blue-50 px-3 py-2.5 text-left text-sm font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
              >
                Dashboard
              </button>


              {/* ADMIN SECTION */}

              <div className="px-3 pb-2 pt-6">

                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Admin
                </p>

              </div>


              {/* ALL TICKETS */}

              <button
                onClick={() =>
                  router.push("/admin/tickets")
                }
                className="w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Alle saker
              </button>


              {/* EMPLOYEES */}

              <button
                onClick={() =>
                  router.push("/admin/employees")
                }
                className="w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Ansatte
              </button>
            
            )


            {user?.role=="employee"} && (

              {/* OVERVIEW */}

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/employee"
                  )
                }
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-left text-sm font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
              >
                <span>▦</span>
                Oversikt
              </button>

              {/* ASSIGNED TICKETS */}

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/employee/tasks"
                  )
                }
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                <span>📋</span>
                Mine tildelte saker
              </button>

              {/* COMPLETED TICKETS */}

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/completed-tasks"
                  )
                }
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                <span>✓</span>
                Fullførte saker
              </button>

              {/* HELP */}

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/employee/help"
                  )
                }
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                <span>❓</span>
                Hjelp
              </button>

            )


            {user?.role=="user"} && (

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

            )

          </nav>


          {/* THEME */}

          <div className="border-t border-slate-200 p-3 dark:border-slate-800">
            <ThemeToggle />
          </div>


          {/* ACCOUNT */}

          <div className="border-t border-slate-200 p-4 dark:border-slate-800">

            <div className="mb-3 flex items-center gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                {user?.name
                  ?.charAt(0)
                  .toUpperCase()}
              </div>

              <div className="min-w-0">

                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {user?.name}
                </p>

                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {user?.role=="admin" ? "Administrator" : user?.email}
                </p>

              </div>

            </div>


            {/* LOGOUT */}

            <button
              onClick={logout}
              disabled={loggingOut}
              className="w-full cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {loggingOut
                ? "Logger ut..."
                : "Logg ut"}
            </button>

          </div>

        </aside>


        {/* ==================================================
            MAIN
        ================================================== */}

        <section className="min-w-0 flex-1 lg:ml-64">


          {/* HEADER */}

          <header className="border-b border-slate-200 bg-white px-4 py-5 dark:border-slate-800 dark:bg-slate-900 sm:px-5 sm:py-6 lg:px-8">

            <div className="mx-auto max-w-5xl">

              {/* BACK LINK - desktop */}
              <button
                type="button"
                onClick={goBack}
                className="mb-4 hidden cursor-pointer items-center gap-2 text-sm font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400 lg:inline-flex"
              >
                ←

                {user?.role === "admin"
                  ? "Tilbake til saker"
                  : "Tilbake til mine saker"}
              </button>


              {/* CONTEXT */}
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {user?.role === "admin"
                  ? "Administrasjon"
                  : user?.role === "employee"
                  ? "Ansattportal"
                  : "Brukerportal"}
              </p>


              {/* TITLE + STATUS */}
              <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="min-w-0">

                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                    Sak #{ticket.id}
                  </h1>

                  <p className="mt-1.5 break-words text-sm leading-5 text-slate-500 dark:text-slate-400">
                    {ticket.category}

                    {ticket.subcategory &&
                      ` · ${ticket.subcategory}`}
                  </p>

                </div>


                <div className="shrink-0 self-start sm:self-auto">
                  <StatusBadge
                    status={ticket.status}
                    createdAt={ticket.created_at}
                    receiverId={ticket.receiver_id}
                  />
                </div>

              </div>

            </div>

          </header>


          {/* CONTENT */}

          <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-5 sm:space-y-6 sm:px-5 sm:py-6 lg:p-8">


            {/* ==================================================
                DESCRIPTION
            ================================================== */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

              {/* TICKET TITLE */}

              <div className="px-4 py-5 sm:px-5 sm:py-6">

                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Problem
                </p>

                <h2 className="break-words text-xl font-bold leading-tight text-slate-900 dark:text-white sm:text-2xl">
                  {ticket.title || "IT-problem"}
                </h2>

              </div>


              {/* DESCRIPTION */}

              <div className="border-t border-slate-100 dark:border-slate-800">

                <div className="px-4 py-4 sm:px-5">

                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Beskrivelse
                  </h3>

                </div>


                <div className="px-4 pb-5 sm:px-5 sm:pb-6">

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-950/60 sm:px-5 sm:py-5">

                    <p className="break-words whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-200">
                      {ticket.content}
                    </p>

                  </div>

                </div>

              </div>


              {/* ATTACHMENTS */}

              {ticket.attachments.length > 0 && (

                <div className="border-t border-slate-100 dark:border-slate-800">

                  <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5">

                    <div className="flex min-w-0 items-center gap-2">

                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm dark:bg-slate-800">
                        📎
                      </span>

                      <div className="min-w-0">

                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                          Vedlegg
                        </h3>

                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Bilder lagt ved saken
                        </p>

                      </div>

                    </div>


                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {ticket.attachments.length}
                    </span>

                  </div>


                  <div className="grid grid-cols-2 gap-3 px-4 pb-5 sm:grid-cols-3 sm:px-5 sm:pb-6">

                    {ticket.attachments.map((attachment) => (

                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative aspect-square min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 transition active:scale-[0.98] dark:border-slate-700 dark:bg-slate-950 sm:aspect-[4/3]"
                      >

                        <img
                          src={attachment.url}
                          alt={attachment.file_name}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />


                        <div className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-2">

                          <p className="truncate text-[11px] font-medium text-white">
                            {attachment.file_name}
                          </p>

                        </div>

                      </a>

                    ))}

                  </div>

                </div>

              )}

            </section>


            {/* ==================================================
                INFORMATION
            ================================================== */}

            <section className="grid grid-cols-1 gap-6 md:grid-cols-2">


              {/* GENERAL */}

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">

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

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">

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


                <div className="mt-6 grid p-4 grid-cols-1 gap-4 md:grid-cols-2 sm:p-5">


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
                      className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
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
                      className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
                    >

                      <option value="not_started">
                        Ikke startet
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
                      className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
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
                      className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950 [color-scheme:light] dark:[color-scheme:dark]"
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
                    className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-blue-950"
                  >

                    <option value="not_started">
                      Ikke startet
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

<section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

  {/* ==================================================
      HEADER
  ================================================== */}

  <div className="border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-5 sm:py-5">

    <div className="flex items-start gap-3">

      <div>

        <h2 className="font-semibold text-slate-900 dark:text-white">
          Samtale
        </h2>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Meldinger mellom deg og de som behandler saken.
        </p>

      </div>


      {/* MESSAGE COUNT */}

      <div className="ml-auto shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        {messages.length}
      </div>

    </div>

  </div>


  {/* ==================================================
      SCROLLABLE MESSAGE AREA
  ================================================== */}

  <div
    ref={messagesContainerRef}
    className="chat-scrollbar h-[min(60vh,500px)] min-h-[320px] overflow-y-auto overscroll-contain px-3 py-4 sm:px-5"
  >

    {messagesLoading ? (

      <div className="flex min-h-[280px] items-center justify-center">

        <div className="text-center">

          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">

            <span className="text-lg">
              💬
            </span>

          </div>

          <p className="text-sm text-slate-400 dark:text-slate-500">
            Laster meldinger...
          </p>

        </div>

      </div>

    ) : messages.length === 0 ? (

      <div className="flex min-h-[280px] items-center justify-center px-4">

        <div className="max-w-xs text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl dark:bg-slate-800">
            💬
          </div>

          <p className="mt-4 font-medium text-slate-700 dark:text-slate-200">
            Ingen meldinger ennå
          </p>

          <p className="mt-1 text-sm leading-6 text-slate-400 dark:text-slate-500">
            Start samtalen ved å sende en melding nedenfor.
          </p>

        </div>

      </div>

    ) : (

      <div className="space-y-4">

        {messages.map(message => {

          const isOwnMessage =
            String(message.sender_id) ===
            String(user?.id);

          return (

            <div
              key={message.id}
              className={`flex min-w-0 ${
                isOwnMessage
                  ? "justify-end"
                  : "justify-start"
              }`}
            >

              <div
                className={`flex min-w-0 max-w-[92%] gap-2 sm:max-w-[75%] ${
                  isOwnMessage
                    ? "flex-row-reverse"
                    : "flex-row"
                }`}
              >

                {/* AVATAR */}

                <div
                  className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    isOwnMessage
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >

                  {(
                    message.sender?.name ||
                    "?"
                  )
                    .charAt(0)
                    .toUpperCase()}

                </div>


                {/* MESSAGE CONTENT */}

                <div className="min-w-0 max-w-full">

                  {/* SENDER */}

                  <div
                    className={`mb-1 flex items-center gap-2 ${
                      isOwnMessage
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >

                    <span className="max-w-full truncate text-xs font-semibold text-slate-600 dark:text-slate-300">

                      {message.sender?.name ||
                        "Ukjent bruker"}

                    </span>

                  </div>


                  {/* BUBBLE */}

                  <div
                    className={`max-w-full overflow-hidden rounded-2xl px-3.5 py-3 sm:px-4 ${
                      isOwnMessage
                        ? "rounded-tr-md bg-blue-600 text-white"
                        : "rounded-tl-md bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                    }`}
                  >

                    <p className="break-words whitespace-pre-wrap text-sm leading-6">
                      {message.content}
                    </p>

                  </div>


                  {/* DATE */}

                  <p
                    className={`mt-1.5 text-[10px] text-slate-400 dark:text-slate-500 ${
                      isOwnMessage
                        ? "text-right"
                        : "text-left"
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

            </div>

          );

        })}

      </div>

    )}

  </div>


  {/* ==================================================
      MESSAGE INPUT
  ================================================== */}

  <div className="border-t border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/50 sm:p-5">

    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end sm:gap-3">

      {/* TEXT INPUT */}

      <div className="min-w-0 flex-1">

        <textarea
          value={messageText}
          onChange={e =>
            setMessageText(e.target.value)
          }
          onKeyDown={e => {

            /*
            * Keep Enter behavior on desktop.
            * On phones, users can use the keyboard's
            * normal return/new-line behavior.
            */

            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              window.innerWidth >= 640
            ) {

              e.preventDefault();

              sendMessage();

            }

          }}
          disabled={sendingMessage}
          placeholder="Skriv en melding..."
          rows={3}
          className="min-h-[76px] w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-950 sm:min-h-[60px] sm:text-sm"
        />

        <p className="mt-1.5 hidden text-xs text-slate-400 dark:text-slate-500 sm:block">
          Enter sender · Shift + Enter for ny linje
        </p>

      </div>


      {/* SEND */}

      <button
        type="button"
        onClick={sendMessage}
        disabled={
          sendingMessage ||
          !messageText.trim()
        }
        className="flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-blue-950 sm:h-[60px] sm:w-auto"
      >

        {sendingMessage ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="3"
                className="opacity-25"
              />

              <path
                d="M21 12a9 9 0 0 0-9-9"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>

            Sender...

          </>
        ) : (

          <>
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 2L11 13" />
              <path d="M22 2l-7 20-4-9-9-4z" />
            </svg>

            Send melding
          </>

        )}

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

    <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-start gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-slate-800">

      <span className="min-w-0 break-words text-sm text-slate-500 dark:text-slate-400">
        {label}
      </span>

      <span className="min-w-0 break-words text-right text-sm font-medium text-slate-900 dark:text-slate-100">
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
// STATUS BADGE
// ====================================================

function StatusBadge({
  status,
  createdAt,
  receiverId,
}: {
  status: string;
  createdAt: string;
  receiverId?: string | number | null;
}) {
  // --------------------------------------------------
  // CANCELLED
  // --------------------------------------------------

  if (status === "cancelled") {
    return (
      <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-950/50 dark:text-red-400">
        Avbrutt
      </span>
    );
  }

  // --------------------------------------------------
  // COMPLETED
  // --------------------------------------------------

  if (status === "completed") {
    return (
      <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950/50 dark:text-green-400">
        Ferdig
      </span>
    );
  }

  // --------------------------------------------------
  // STARTED
  // --------------------------------------------------

  if (status === "started") {
    return (
      <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
        Pågår
      </span>
    );
  }

  // --------------------------------------------------
  // NOT STARTED
  // --------------------------------------------------

  if (status === "not_started") {
    const created = new Date(createdAt);
    const now = new Date();

    const isCreatedToday =
      created.getFullYear() === now.getFullYear() &&
      created.getMonth() === now.getMonth() &&
      created.getDate() === now.getDate();

    // A ticket that has not been assigned is shown
    // as "Ikke tildelt" once it is no longer new.
    if (!receiverId && !isCreatedToday) {
      return (
        <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
          Ikke tildelt
        </span>
      );
    }

    return (
      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        {isCreatedToday ? "Ny" : "Ikke startet"}
      </span>
    );
  }

  return null;
}