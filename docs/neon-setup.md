# Neon Setup — VoiceBridge SD

Project: `dawn-paper-01055964`
Org: `org-sweet-cloud-51381943`
Console: https://console.neon.tech/app/projects/dawn-paper-01055964/

## Do this ON YOUR LAPTOP, in your repo folder — Muse can't log in as you

Neon's own prompt says to run this yourself, and `neon login` needs YOUR browser sign-in. Don't paste connection strings / passwords in chat — `neon init` writes them to your local `.env` file.

```bash
cd voicebridge-sd

neon --version
# If that fails:
npm i -g neon@latest

neon login
# Finish sign-in in the browser that opens

neon init -y --agent cursor --org-id org-sweet-cloud-51381943 --project-id dawn-paper-01055964
```

What that does:
- Links your app to the existing Neon project
- Populates `.env` / `.env.local` with `DATABASE_URL` (never paste that value in chat)
- Installs Neon skills + MCP server for Cursor

When it finishes you should see:
```
Neon Setup Complete
✓ Project dawn-paper-01055964 linked
✓ Env variables populated
✓ Skills installed
✓ MCP configured
⚡ Restart your agent to load the MCP server
```

Then in Neon SQL Editor, run `db/schema.sql`, then `npm run seed`.

## About Neon promo credits — "can't find how to redeem"

You already have a Neon account + project, so you can build right now on the free tier — you don't need promo credits to start the data sprint.

For SanD Hacks, Devpost says "All participants receive Neon promo credits to build with" but doesn't list a redeem link on Devpost. Check in this order:
1. SanD Hacks Slack #announcements / #neon — look for a Neon promo link or code
2. Neon Console → Billing / Settings → Promo code / Add credits
3. Ask at the Neon table / Help Desk in Qualcomm Room — they can give you the link/code fastest

If you find a code/link, paste just the LINK (not a secret key) here and I'll tell you where to click. Don't let this block you — start building on free tier now, add credits later if you find them.
