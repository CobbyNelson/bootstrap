# Run & deploy — local preview + always-on online view

One setup, two views, always in sync. **GitHub is the source of truth; Vercel is
the live online view; `git push` is the sync.** Edit locally, push, and the
online URL rebuilds itself in ~30–60s. No view ever drifts from the other.

> This Next.js app lives in the **`assets-and-capital/`** subfolder of the
> `CobbyNelson/bootstrap` repo. That detail matters once — see step B2.

---

## A. Build & preview locally (instant hot-reload)

Requires **Node 22** (pinned in `.nvmrc`; if you use `nvm`, run `nvm use`).

```bash
git clone https://github.com/CobbyNelson/bootstrap.git
cd bootstrap/assets-and-capital
git checkout claude/web-finance-software-planning-txpczi
npm install
npm run dev            # → http://localhost:3000  (edits reload live)
```

Want the exact production build on your machine instead of dev mode:

```bash
npm run build && npm run start   # → http://localhost:3000
```

---

## B. Put it online (Vercel — native Next.js host, free tier)

Do this **once**. After it, every push updates the site automatically.

1. Go to <https://vercel.com> → sign in with GitHub → **Add New… → Project**.
2. Import **`CobbyNelson/bootstrap`**. On the config screen, set
   **Root Directory = `assets-and-capital`**. ⚠️ This is the only setting people
   miss — the app is in a subfolder, not the repo root.
3. Framework auto-detects as **Next.js**. No environment variables are needed for
   a first deploy (the app runs on in-repo data today).
4. Click **Deploy**. You get a public URL like
   `https://assets-and-capital.vercel.app`.
5. In **Project → Settings → Git**, set **Production Branch** to
   `claude/web-finance-software-planning-txpczi` so that URL always shows our
   current work. (Later, when you want `main` to be the canonical site, merge the
   branch into `main` and switch this setting to `main`.)

Every **other** branch you push also gets its own throwaway **preview URL**, so
you can try ideas without touching the live site.

---

## C. The daily loop (how "both stay in sync" works)

```
edit locally  →  npm run dev (preview at :3000)  →  git commit  →  git push
      → Vercel auto-builds → the online URL updates in ~30–60s
```

- Changes **you** push locally and changes **Claude** pushes from a session both
  land in the same GitHub branch → both flow to the same online URL.
- Before you start an editing session: `git pull` so your local copy has the
  latest. After you finish: `git push`.
- To see live-build progress or roll back a bad deploy, use the Vercel dashboard
  (**Deployments** tab) — each push is a versioned, one-click-revertible build.

---

## Notes

- **No backend yet.** The app currently serves in-repo demo data; the Prisma
  schema and `.env.example` are integration seams for when a real database and
  auth are wired in. When that happens, add the env vars in
  **Vercel → Settings → Environment Variables** (and your local `.env`).
- **Alternatives to Vercel:** Netlify or Cloudflare Pages follow the same
  "connect repo, set root directory to `assets-and-capital`, push-to-deploy"
  pattern. Vercel is recommended because SSR pages and the `/api/match` route
  run with zero extra config.
