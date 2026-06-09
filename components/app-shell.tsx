"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckCheck,
  Clock3,
  FileBarChart,
  FolderKanban,
  History,
  LayoutDashboard,
  Settings2,
} from "lucide-react";

import { AppLogo } from "@/components/app-logo";
import { AuthForm } from "@/components/auth-form";
import { PersistentTimer } from "@/components/persistent-timer";
import { ProfileMenu } from "@/components/profile-menu";
import { VerifyEmailCard } from "@/components/verify-email-card";
import { WorkspaceErrorBanner } from "@/components/workspace-error-banner";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useWorkspaceAuth,
  WorkspaceProvider,
} from "@/components/workspace-provider";
import { cn } from "@/lib/utils";

const baseNavigation = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/log-time", label: "Log time", icon: Clock3 },
  { href: "/history", label: "History", icon: History },
];

const adminNavigation = [
  { href: "/admin/approvals", label: "Approvals", icon: CheckCheck },
  { href: "/admin/reports", label: "Reports", icon: FileBarChart },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/settings", label: "Settings", icon: Settings2 },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const {
    user,
    isAdmin,
    isLoading,
    isAuthBusy,
    authError,
    clearAuthError,
    signIn,
    signUp,
    sendVerification,
    refreshUser,
    resetPassword,
    updateDisplayName,
    signOut,
    isFirebaseConfigured,
  } = useWorkspaceAuth();

  if (!isFirebaseConfigured) {
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <Card className="w-full max-w-lg border-primary/10 shadow-soft">
          <CardHeader>
            <AppLogo className="mb-3" size={52} />
            <CardTitle className="text-2xl">Connect Firebase</CardTitle>
            <CardDescription>
              Add the Firebase web configuration to{" "}
              <code className="rounded bg-muted px-1.5 py-0.5">.env.local</code>.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center">
        <p className="text-sm text-muted-foreground">Loading workspace...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <AuthForm
          error={authError}
          isBusy={isAuthBusy}
          onClearError={clearAuthError}
          onResetPassword={resetPassword}
          onSignIn={signIn}
          onSignUp={signUp}
        />
      </main>
    );
  }

  if (!user.emailVerified) {
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <VerifyEmailCard
          error={authError}
          isBusy={isAuthBusy}
          user={user}
          onResend={sendVerification}
          onRefresh={refreshUser}
          onSignOut={signOut}
        />
      </main>
    );
  }

  const navigation = isAdmin
    ? [...baseNavigation, ...adminNavigation]
    : baseNavigation;

  return (
    <WorkspaceProvider user={user} isAdmin={isAdmin} signOut={signOut}>
      <div className="min-h-screen lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden border-r bg-card lg:flex lg:flex-col">
          <Link className="flex items-center gap-3 border-b px-5 py-5" href="/">
            <AppLogo size={42} />
            <div>
              <p className="font-semibold leading-tight">Olive Social Impact</p>
              <p className="text-xs text-muted-foreground">Time Tracker</p>
            </div>
          </Link>
          <nav className="flex-1 space-y-1 p-3">
            {navigation.map(({ href, label, icon: Icon }) => {
              const active =
                pathname === href ||
                (href !== "/" && pathname.startsWith(`${href}/`));
              return (
                <Link
                  key={href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                  href={href}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <PersistentTimer className="mx-3 mb-3" />
          <div className="border-t p-3">
            <ProfileMenu
              user={user}
              isAdmin={isAdmin}
              onSignOut={signOut}
              onUpdateName={updateDisplayName}
            />
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <Link className="flex items-center gap-2" href="/">
                <AppLogo size={36} />
                <span className="font-semibold">Olive Social Impact</span>
              </Link>
              <div className="flex items-center gap-2">
                <PersistentTimer compact />
                <ProfileMenu
                  user={user}
                  isAdmin={isAdmin}
                  onSignOut={signOut}
                  onUpdateName={updateDisplayName}
                />
              </div>
            </div>
            <nav className="flex gap-1 overflow-x-auto px-3 pb-3">
              {navigation.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm",
                    pathname === href
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground",
                  )}
                  href={href}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </nav>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
            <WorkspaceErrorBanner />
            {children}
          </main>
        </div>
      </div>
    </WorkspaceProvider>
  );
}
