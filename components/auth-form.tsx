"use client";

import { useState } from "react";
import { LockKeyhole, Mail, UserRound } from "lucide-react";

import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

type AuthFormProps = {
  isBusy: boolean;
  error: string;
  onClearError: () => void;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (
    name: string,
    email: string,
    password: string,
  ) => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
};

export function AuthForm({
  isBusy,
  error,
  onClearError,
  onSignIn,
  onSignUp,
  onResetPassword,
}: AuthFormProps) {
  const [mode, setMode] = useState("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState("");

  async function submit() {
    setFeedback("");
    try {
      if (mode === "create") {
        await onSignUp(name, email, password);
        setFeedback("Check your email to verify your new account.");
      } else {
        await onSignIn(email, password);
      }
    } catch {
      // The auth hook exposes a user-friendly error.
    }
  }

  async function resetPassword() {
    setFeedback("");
    if (!email.trim()) {
      setFeedback("Enter your email address first.");
      return;
    }
    try {
      await onResetPassword(email);
      setFeedback("Password reset email sent.");
    } catch {
      // The auth hook exposes a user-friendly error.
    }
  }

  return (
    <Card className="w-full max-w-md border-primary/10 shadow-soft">
      <CardHeader className="text-center">
        <AppLogo className="mx-auto mb-4" size={72} />
        <CardTitle className="text-2xl">Olive Social Impact</CardTitle>
        <CardDescription>
          Sign in or create an account with your organization email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={mode}
          onValueChange={(value) => {
            setMode(value);
            setFeedback("");
            onClearError();
          }}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sign-in">Sign in</TabsTrigger>
            <TabsTrigger value="create">Create account</TabsTrigger>
          </TabsList>
          <TabsContent value="sign-in" />
          <TabsContent value="create">
            <div className="mb-4 space-y-2">
              <Label htmlFor="auth-name">Full name</Label>
              <div className="relative">
                <UserRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="auth-name"
                  autoComplete="name"
                  className="pl-9"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="auth-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="auth-email"
                  autoComplete="email"
                  className="pl-9"
                  placeholder="name@olivesocialimpact.com"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="auth-password">Password</Label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="auth-password"
                  aria-describedby={
                    mode === "create" ? "auth-password-help" : undefined
                  }
                  autoComplete={
                    mode === "create" ? "new-password" : "current-password"
                  }
                  className="pl-9"
                  minLength={8}
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              {mode === "create" && (
                <p
                  className="text-xs text-muted-foreground"
                  id="auth-password-help"
                >
                  Use at least 8 characters.
                </p>
              )}
            </div>

            {(error || feedback) && (
              <p
                className={error ? "text-sm text-destructive" : "text-sm text-primary"}
                role={error ? "alert" : "status"}
              >
                {error || feedback}
              </p>
            )}

            <Button className="w-full" disabled={isBusy} type="submit">
              {isBusy
                ? "Please wait..."
                : mode === "create"
                  ? "Create account"
                  : "Sign in"}
            </Button>

            {mode === "sign-in" && (
              <>
                <Button
                  className="w-full"
                  disabled={isBusy}
                  type="button"
                  variant="ghost"
                  onClick={resetPassword}
                >
                  Forgot password?
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Previously used Google sign-in? Use Forgot password to set
                  your password.
                </p>
              </>
            )}
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
}
