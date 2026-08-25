# Client preview via ngrok
#
# 1. Put NGROK_AUTHTOKEN in `.env.local` (gitignored) — never commit it.
# 2. Start the web app:  `npm run dev:web`   (http://localhost:3000)
# 3. Start the tunnel:   `npm run ngrok`     or one-shot `npm run client-preview`
# 4. Share the printed https://….ngrok-free.app URL with the client.
#
# Auth notes
# - Email / localStorage session auth works through the ngrok URL immediately.
# - NextAuth OAuth needs AUTH_URL / NEXT_PUBLIC_APP_URL set to the ngrok https URL
#   and matching callback URLs in Google/GitHub consoles, then restart Next.
# - Auth.js already uses trustHost: true (apps/web/src/auth.ts).
#
# Free-tier note: first browser visit may show ngrok’s interstitial page —
# click “Visit Site”. Automated clients can send header `ngrok-skip-browser-warning: 1`.
