import { ADMIN_EMAILS } from "@/lib/types";

export const ORGANIZATION_DOMAIN = "olivesocialimpact.com";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isOrganizationEmail(email: string) {
  return normalizeEmail(email).endsWith(`@${ORGANIZATION_DOMAIN}`);
}

export function isAllowedSignInEmail(email: string) {
  const normalized = normalizeEmail(email);
  return isOrganizationEmail(normalized) || ADMIN_EMAILS.includes(normalized);
}

export function getAuthErrorMessage(error: unknown) {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : "";

  const messages: Record<string, string> = {
    "auth/configuration-not-found":
      "Firebase Authentication is not configured for this project yet.",
    "auth/email-already-in-use": "An account already exists for this email.",
    "auth/invalid-credential": "The email or password is incorrect.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/domain-not-allowed":
      "Use an authorized Olive Social Impact email address.",
    "auth/name-required": "Enter your full name.",
    "auth/user-not-found": "No account was found for this email.",
    "auth/operation-not-allowed":
      "Email and password sign-in is not enabled in Firebase yet.",
    "auth/too-many-requests": "Too many attempts. Try again later.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/weak-password": "Use a password with at least 8 characters.",
  };

  return messages[code] ?? "Authentication failed. Please try again.";
}
