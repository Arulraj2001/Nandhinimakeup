# [BUSINESS NAME] - Web Application (Phase 1 Foundation)

Production website for a beauty parlour and bridal makeup artistry business that also retails jewellery accessories.

This codebase contains **Phase 1: Foundation**, providing the core architectural skeleton: Next.js App Router, strict TypeScript, Tailwind CSS design tokens, shadcn/ui components, Supabase Postgres database with Row Level Security (RLS), admin authentication with role enforcement, and quality gates.

---

## Required Tools

- **Node.js**: v20.x or v22.x+
- **pnpm**: v9.x (`npm install -g pnpm`)
- **Supabase CLI**: installed via npx or pnpm dlx

---

## Supabase Setup (Mumbai Region)

1. Create an account and log in at [supabase.com](https://supabase.com).
2. Create a new project:
   - **Name**: e.g., `nandhini-makeup`
   - **Database Password**: Choose a strong password.
   - **Region**: **South Asia (Mumbai) - `ap-south-1`**
3. **Disable Public Sign-ups**:
   - In the Supabase Dashboard, navigate to **Authentication** > **Providers** > **Email**.
   - Turn OFF **"Enable Signups"** (or uncheck "Allow new users to sign up").
   - Click **Save**.
4. Retrieve your project API credentials:
   - Navigate to **Project Settings** > **API**.
   - Copy **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`).
   - Copy **`anon` `public` key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`).
   - Copy **`service_role` `secret` key** (`SUPABASE_SERVICE_ROLE_KEY`).

---

## Environment Variables Configuration

Copy `.env.example` to create your local `.env.local` file:

```bash
cp .env.example .env.local
```

Configure the variables:

| Variable                        | Description                                                        |
| ------------------------------- | ------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL (`https://<project-ref>.supabase.co`)    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous API key (safe for browser)                        |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server-only service role key (never expose to client)              |
| `NEXT_PUBLIC_SITE_URL`          | Canonical public URL (e.g. `http://localhost:3000` locally)        |
| `ALLOW_INDEXING`                | `"false"` before launch to disallow crawling; `"true"` upon launch |

> **Note**: Environment variables are strictly validated at startup and build time with Zod. Missing or invalid variables will immediately halt execution with descriptive error messages.

---

## Running Database Migrations

You can run the migrations using either the Supabase CLI or the Supabase SQL Editor:

### Option A: Via Supabase CLI

1. Link your local project to your remote Supabase project:
   ```bash
   npx supabase link --project-ref <your-project-ref>
   ```
2. Push all migrations:
   ```bash
   npx supabase db push
   ```

### Option B: Via Supabase Dashboard SQL Editor

1. Open **SQL Editor** in your Supabase Dashboard.
2. Open `supabase/migrations/20261007000000_init_foundation_schema.sql`.
3. Paste the contents into the SQL Editor and click **Run**.

This creates the tables (`admins`, `site_settings`, `seo_pages`, `redirects`), triggers, the `is_admin()` security function, and Row Level Security policies.

---

## Creating the First Admin User

Public sign-up is disabled. Create the initial administrator account as follows:

1. In Supabase Dashboard, go to **Authentication** > **Users**.
2. Click **Add User** > **Create user**:
   - Enter the admin's email and password.
   - Confirm creation.
3. Copy the newly created user's **User UID** (UUID).
4. In the **SQL Editor**, run the snippet from `supabase/snippets/create_first_admin.sql`:

```sql
insert into public.admins (user_id, role)
values ('<PASTE-USER-UID-HERE>', 'owner')
on conflict (user_id) do update set role = 'owner';
```

Now this user can log in at `/admin/login` and access the admin dashboard.

---

## Local Development & Scripts

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production build & start

```bash
pnpm build
pnpm start
```

### 4. Code quality checks

```bash
# Typecheck TypeScript
pnpm typecheck

# Lint with ESLint
pnpm lint

# Check code formatting with Prettier
pnpm format:check

# Format code automatically
pnpm format

# Regenerate database TypeScript types
pnpm db:types
```

---

## Folder Structure

```
├── .github/workflows/ci.yml       # GitHub Actions CI workflow
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (public)/              # Public routes with Header & Footer layout
│   │   │   ├── layout.tsx         # Public layout shell
│   │   │   └── page.tsx           # Temporary foundation homepage
│   │   ├── admin/                 # Admin portal
│   │   │   ├── (protected)/       # Authenticated admin routes with sidebar
│   │   │   │   ├── layout.tsx     # Server-side admin role verification
│   │   │   │   ├── page.tsx       # Minimal welcome dashboard
│   │   │   │   └── admin-shell.tsx# Sidebar & topbar UI
│   │   │   ├── login/             # Admin sign-in page (/admin/login)
│   │   │   └── layout.tsx         # Admin root layout (enforces noindex)
│   │   ├── error.tsx              # Branded error fallback
│   │   ├── global-error.tsx       # Root layout error boundary
│   │   ├── globals.css            # Design tokens, fonts & global CSS
│   │   ├── layout.tsx             # Root layout with metadata & fonts
│   │   ├── not-found.tsx          # Branded 404 page
│   │   └── robots.ts              # Dynamic robots.txt generator
│   ├── components/                # Reusable UI components
│   │   ├── ui/                    # shadcn/ui components (button, input, label)
│   │   ├── footer.tsx             # Public footer
│   │   └── header.tsx             # Public header with mobile toggle
│   ├── lib/                       # Helpers and shared configuration
│   │   ├── config/                # Environment validation (env.ts) & site config (site.ts)
│   │   ├── supabase/              # Supabase clients (client, server, admin, middleware)
│   │   └── utils.ts               # Class merger utility (cn)
│   ├── proxy.ts                   # Next.js 16 request interception / proxy
│   └── types/                     # TypeScript definitions (database.ts)
└── supabase/                      # Supabase configuration & migrations
    ├── migrations/                # Versioned SQL migrations
    └── snippets/                  # Reusable SQL snippets (admin promotion)
```

---

## Project Conventions

1. **Naming Conventions**:
   - File and directory names use `kebab-case` (e.g., `login-form.tsx`, `site-settings`).
   - React components use `PascalCase` (e.g., `Header`, `AdminShell`).
   - Functions, hooks, and variables use `camelCase` (e.g., `createClient`, `updateSession`).
2. **Feature Placement**:
   - New public customer-facing routes belong inside `src/app/(public)/`.
   - New administrative features belong inside `src/app/admin/(protected)/`.
   - Domain-specific logic belongs in modular feature directories under `src/features/`.
   - Shared atomic UI elements belong inside `src/components/ui/`.
3. **Database Changes**:
   - **Never** modify database tables or policies manually through the Supabase UI dashboard.
   - Every database schema change **must** be committed as a timestamped SQL migration in `supabase/migrations/`.
   - After updating the schema, regenerate database types using `pnpm db:types`.
4. **Dependencies**:
   - Do **not** install arbitrary npm libraries.
   - All new packages must be proposed and approved beforehand.
