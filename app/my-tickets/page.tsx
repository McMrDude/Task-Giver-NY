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

  title: string | null;
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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);


  // ------------------------------------------------
  // LOAD
  // ------------------------------------------------

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
                        className="fixed inset-0 top-16 z-40 bg-slate-950/20 backdrop-blur-[2px]"
                      />
          
                      {/* Menu */}
                      <div className="fixed inset-x-0 top-16 z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
          
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

            {ticket.title}

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