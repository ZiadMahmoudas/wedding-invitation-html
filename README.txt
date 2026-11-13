Farouk & Roaa Wedding — V15

Vercel URL:
/w/farouk-roaa

Neon / Vercel:
1) Vercel > Settings > Environment Variables > Add Environment Variable
2) Type: Secret
3) Key: DATABASE_URL
4) Value: your NEW rotated Neon pooled PostgreSQL connection string
5) Environment: Production (add Preview too if you want preview deployments to use the guestbook)
6) Save, then redeploy

Do not put DATABASE_URL in index.html or script.js.

Database schema: run neon-schema.sql once in Neon SQL Editor.

V15 changes:
- desktop invitation truly fills the viewport
- falling hearts restored on every section
- cream background => burgundy/red hearts
- burgundy background => warm white hearts
- Neon guestbook slider remains enabled
