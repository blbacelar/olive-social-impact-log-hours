"use client";

import type { User } from "firebase/auth";
import { MailCheck } from "lucide-react";

import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function VerifyEmailCard({
  user,
  isBusy,
  error,
  onResend,
  onRefresh,
  onSignOut,
}: {
  user: User;
  isBusy: boolean;
  error: string;
  onResend: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onSignOut: () => Promise<void>;
}) {
  return (
    <Card className="w-full max-w-md border-primary/10 shadow-soft">
      <CardHeader className="text-center">
        <AppLogo className="mx-auto mb-4" size={72} />
        <div className="mx-auto mb-2 rounded-full bg-primary/10 p-3 text-primary">
          <MailCheck className="h-6 w-6" />
        </div>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          We sent a verification link to {user.email}. Verify it before
          accessing the workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <Button
          className="w-full"
          disabled={isBusy}
          onClick={() => void onRefresh()}
        >
          I&apos;ve verified my email
        </Button>
        <Button
          className="w-full"
          disabled={isBusy}
          variant="outline"
          onClick={() => void onResend()}
        >
          Resend verification email
        </Button>
        <Button
          className="w-full"
          variant="ghost"
          onClick={() => void onSignOut()}
        >
          Back to sign in
        </Button>
      </CardContent>
    </Card>
  );
}
