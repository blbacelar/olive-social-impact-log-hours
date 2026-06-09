"use client";

import { useState } from "react";
import type { User } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Clock3,
  FileBarChart,
  FolderKanban,
  History,
  LogOut,
  Settings2,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfileMenuProps = {
  user: User;
  isAdmin: boolean;
  onSignOut: () => void;
  onUpdateName: (displayName: string) => Promise<void>;
};

function initials(user: User) {
  const source = user.displayName || user.email || "User";
  return source
    .split(/[\s@]+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function ProfileMenu({
  user,
  isAdmin,
  onSignOut,
  onUpdateName,
}: ProfileMenuProps) {
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function openProfile() {
    setDisplayName(user.displayName ?? "");
    setFeedback("");
    setIsProfileOpen(true);
  }

  async function saveProfile() {
    const normalizedName = displayName.trim();
    if (normalizedName.length < 2) {
      setFeedback("Enter a name with at least 2 characters.");
      return;
    }

    setIsSaving(true);
    setFeedback("");
    try {
      await onUpdateName(normalizedName);
      setIsProfileOpen(false);
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Unable to update your name. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="h-10 gap-2 rounded-full pl-1.5 pr-3"
            variant="outline"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {initials(user)}
            </span>
            <span className="hidden max-w-32 truncate sm:inline">
              {user.displayName || user.email}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="sr-only">Open profile menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="font-normal">
            <span className="block truncate font-medium">
              {user.displayName || "Olive Social Impact user"}
            </span>
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              {user.email}
            </span>
            <Badge className="mt-2" variant={isAdmin ? "default" : "outline"}>
              {isAdmin ? (
                <ShieldCheck className="mr-1 h-3 w-3" />
              ) : (
                <UserRound className="mr-1 h-3 w-3" />
              )}
              {isAdmin ? "Admin" : "Contributor"}
            </Badge>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={openProfile}>
            <UserRound className="h-4 w-4" />
            Edit profile
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push("/log-time")}>
            <Clock3 className="h-4 w-4" />
            Log time
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push("/history")}>
            <History className="h-4 w-4" />
            Time history
          </DropdownMenuItem>
          {isAdmin && (
            <>
              <DropdownMenuItem
                onSelect={() => router.push("/admin/reports")}
              >
                <FileBarChart className="h-4 w-4" />
                Financial reports
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => router.push("/admin/projects")}
              >
                <FolderKanban className="h-4 w-4" />
                Projects and clients
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => router.push("/admin/settings")}
              >
                <Settings2 className="h-4 w-4" />
                Admin settings
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={onSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Update the name displayed throughout the time tracker.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void saveProfile();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="profile-display-name">Name</Label>
              <Input
                id="profile-display-name"
                autoComplete="name"
                disabled={isSaving}
                maxLength={80}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                disabled
                type="email"
                value={user.email ?? ""}
              />
            </div>
            {feedback && (
              <p className="text-sm text-destructive" role="alert">
                {feedback}
              </p>
            )}
            <DialogFooter>
              <Button
                disabled={isSaving}
                type="button"
                variant="outline"
                onClick={() => setIsProfileOpen(false)}
              >
                Cancel
              </Button>
              <Button disabled={isSaving} type="submit">
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
