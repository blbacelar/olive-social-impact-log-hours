# Olive Social Impact Time Tracker

A focused time-tracking application for Olive Social Impact. Team members can
record consulting and development hours, review their history, and track payment
status. Administrators can manage projects, hourly rates, approvals, billing
periods, and financial reports.

## Features

- Live timer that persists while navigating between screens
- Manual time entry with hours and minutes
- Editable pending entries for their owners
- Weekly, bi-weekly, monthly, pending, project, and period filters
- Email/password authentication with email verification
- New account registration restricted to `@olivesocialimpact.com`
- Editable user display names
- Per-user hourly rates managed by administrators
- Administrator approval and payment workflows
- Project/client creation, editing, and removal
- Financial reports grouped by billing period
- Responsive interface built with shadcn/ui
- Firestore security rules for role and record-level access

## Technology

- [Next.js](https://nextjs.org/) 15 with the App Router
- [React](https://react.dev/) 19
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) and Radix UI
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Cloud Firestore](https://firebase.google.com/docs/firestore)
- [Vitest](https://vitest.dev/)

## Application Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Team | Overview and aggregate statistics |
| `/log-time` | Team | Live timer and manual entry |
| `/history` | Team | Time-entry history and editing |
| `/admin/approvals` | Admin | Approve entries and close billing periods |
| `/admin/reports` | Admin | Financial reports and project filtering |
| `/admin/projects` | Admin | Manage projects and clients |
| `/admin/settings` | Admin | Manage team hourly rates |

## Local Setup

### Prerequisites

- Node.js 20 or later
- npm
- A Firebase project with Authentication and Firestore enabled

### Install

```bash
npm install
```

Copy the environment template:

```bash
cp .env.example .env.local
```

Add the Firebase web app configuration from:

`Firebase Console > Project settings > General > Your apps > Web app`

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_ADMIN_EMAILS=rosalyn@olivesocialimpact.com
```

The database URL and measurement ID are optional for the current application.
Never commit `.env.local`.

### Configure Firebase Authentication

In the Firebase Console:

1. Open **Authentication > Sign-in method**.
2. Enable **Email/Password**.
3. Disable Google authentication if it is still enabled.
4. Add local and deployed domains under **Authentication > Settings >
   Authorized domains**.

New accounts created through the app must use an
`@olivesocialimpact.com` email address and verify that address before accessing
Firestore data.

Existing accounts that previously used Google sign-in can use **Forgot
password** to establish an email/password credential.

### Configure Administrators

Client-side administrator navigation uses `NEXT_PUBLIC_ADMIN_EMAILS`.
Firestore permissions use the email allowlists in `firestore.rules`.

When adding or removing an administrator, update both locations and redeploy the
rules. Firestore rules are the authoritative security boundary; hiding an admin
screen in the UI is not a security control.

### Deploy Firestore Rules

Authenticate the Firebase CLI and select the correct project:

```bash
npx firebase-tools login
npx firebase-tools use your-project-id
npx firebase-tools deploy --only firestore:rules
```

The repository's current default Firebase project is stored in `.firebaserc`.
Confirm it before deploying rules to avoid changing the wrong project.

### Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Commands

```bash
npm run dev        # Start the development server
npm run build      # Create a production build
npm start          # Run the production build
npm run lint       # Run ESLint
npm test           # Run the test suite once
npm run test:watch # Run tests in watch mode
```

Before deployment:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
npm audit
```

## Firestore Data Model

### `time_logs`

```ts
{
  userId: string;
  userName: string;
  project: string;
  description: string;
  date: string; // YYYY-MM-DD
  totalMinutes: number;
  rate: number | null;
  status: "pending" | "approved" | "paid";
  periodId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### `user_profiles/{userId}`

```ts
{
  email: string;
  displayName: string;
  hourlyRate: number | null;
  lastSeenAt: Timestamp;
  updatedAt?: Timestamp;
}
```

### `app_settings/time_tracking`

```ts
{
  projects: string[];
  updatedAt: Timestamp;
}
```

## Roles and Permissions

### Contributor

- Create pending time entries
- View their own entries and statistics
- Edit their own pending entries
- Update their profile name

### Administrator

- Access all contributor capabilities
- View, edit, approve, and delete team entries
- Assign hourly rates by user
- Manage projects and clients
- Close billing periods and mark approved periods as paid
- View financial reports

Approved and paid entries require an hourly rate. New entries capture the
user's configured rate at creation time.

## Project Structure

```text
app/
  admin/
    approvals/
    projects/
    reports/
    settings/
  history/
  log-time/
components/
  ui/                     # shadcn/ui primitives
  admin-settings-panel.tsx
  approval-center.tsx
  financial-report.tsx
  log-table.tsx
  profile-menu.tsx
  project-manager.tsx
  time-logger.tsx
  workspace-provider.tsx
hooks/
  use-auth.ts
lib/
  firebase/
    config.ts             # Firebase initialization
    db.ts                 # Centralized Firestore operations
  auth.ts
  rates.ts
  time-filters.ts
  types.ts
  utils.ts
tests/
firestore.rules
```

## Implementation Notes

- Firestore reads and mutations are centralized in `lib/firebase/db.ts`.
- Authentication state and account actions are handled in `hooks/use-auth.ts`.
- The live timer draft is stored per user in browser local storage.
- Dates use the browser's local date to avoid UTC-related day shifts.
- Firestore batch operations are chunked below Firebase's write limit.
- Historical log names fall back to their stored `userName`, while current
  displays prefer the latest user profile name.

## Security

Firebase web configuration values identify the Firebase project but are not
server secrets. Application security depends on Firebase Authentication,
verified email claims, and correctly deployed Firestore rules.

Do not place service-account keys, private API credentials, or unrestricted
server secrets in `NEXT_PUBLIC_*` variables.
