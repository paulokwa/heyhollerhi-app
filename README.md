# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Auth Setup

This project uses **Supabase** for authentication.

### Environment Variables

Create a `.env` file in the root directory (or configure in Netlify):

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Authentication Features

-   **Google OAuth**: Enable Google provider in Supabase Dashboard.
-   **Email/Password**: Enable Email provider.
-   **Redirects**: Ensure your Site URL and Redirect URLs in Supabase include your Netlify domain and local dev URL (e.g., `http://localhost:5173`).

## Privacy & GDPR Features

- **My Posts**: Users can view and delete their own posts (soft delete). Deleted posts are hidden from the public feed but remain in "My Posts" labeled as "Deleted".
- **Account Deletion**: Deleting an account anonymizes the profile (name -> "Deleted User") and posts, but keeps the content to preserve community context. Login is disabled and the email is released.
- **Data Export**: Users can download a JSON file containing their profile and post history.
