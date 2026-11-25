# Quiz World

A quiz app for class and exam practice. Students take timed multiple-choice
quizzes filtered by class/exam, subject and chapter, then review their answers
and track past results. Admins add, edit and delete questions.

Built with React 19, Vite and Supabase (auth, database and a random-question RPC).

## Getting started

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Copy `.env.example` to `.env` and fill in your Supabase project URL and anon key
   (Supabase dashboard → Project Settings → API):

   ```bash
   cp .env.example .env
   ```

3. Run the SQL in `supabase/class_level_and_random_questions.sql` in your Supabase
   project. It adds the `class_level` and `chapter` columns and the
   `get_random_questions` function the quiz uses.

4. Start the dev server:

   ```bash
   npm run dev
   ```

## Scripts

| Command           | What it does                         |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the dev server with hot reload |
| `npm run build`   | Build for production into `dist/`    |
| `npm run preview` | Serve the production build locally   |
| `npm run lint`    | Run ESLint                           |

## Roles

- **Student** — sees questions for their assigned class only, takes quizzes and
  reviews results. Correct answers are hidden in the Question Bank.
- **Admin** — set `role = 'admin'` on the user's row in the `profiles` table.
  Admins can pick any class and add, edit or delete questions.

Role checks in the UI only hide controls. Configure Supabase row-level security
so only admins can write to the `questions` table.

## Deployment

Pushes to `main` build and deploy to Azure Static Web Apps via
`.github/workflows/azure-static-web-apps-*.yml`.
