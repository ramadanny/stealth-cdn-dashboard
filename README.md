# GitHub CDN Dashboard

A simple, serverless dashboard to manage and serve files from a GitHub repository as CDN assets via the jsDelivr network. Exclusively optimized for Vercel.

---

## 🚀 Key Features
* **Serverless Native**: Engineered strictly for Vercel Serverless Functions. No persistent processes.
* **Instant CDN Integration**: Automatically generates `jsdelivr.net` links for every file.
* **Secure Access**: Protected by password authentication and JWT session management.
* **Stealth Mode**: Filenames are automatically obfuscated during upload for extra security.
* **Modern UI**: Built with React 19, Tailwind CSS, and Framer Motion.

---

## ⚙️ Configuration

Set these Environment Variables in your Vercel Dashboard (**Settings > Environment Variables**):

| Variable | Description |
| :--- | :--- |
| `ADMIN_PASSWORD` | Password to access the dashboard. |
| `GITHUB_TOKEN` | GitHub Personal Access Token (scope: `repo`). |
| `GITHUB_OWNER` | Your GitHub username. |
| `GITHUB_REPO` | The repository name for storing files. |
| `GITHUB_BRANCH` | Branch name (e.g., `main`). |
| `JWT_SECRET` | A unique secret for login security. |

---

## 📦 Deployment (Vercel)

This application is engineered specifically for Vercel. Local persistent servers (`app.listen`) have been stripped to maximize serverless performance.

1. Push this repository to GitHub.
2. Import the project into **Vercel**.
3. Vercel will automatically detect the Vite frontend and build it.
4. Add all required Environment Variables.
5. Vercel will process `vercel.json`, compiling `server.ts` into a stateless Edge/Node Serverless Function mapped to `/api/*`.
6. Click **Deploy**.

---

## 🛠️ Local Development

For local frontend development, use the standard Vite dev server:

# Install Depedencies:
```bash
npm install
```
# Start the development server:
```bash
npm run dev
```

*(Note: Since the Express server acts as a Serverless Function, you can simulate the Vercel environment locally using the Vercel CLI via `vercel dev`)*

---
<div align="center">
  <p>© 2026 Made With Love by <b>ramadanny</b></p>
</div>