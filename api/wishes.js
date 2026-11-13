import { neon } from '@neondatabase/serverless';

function cleanText(value, max) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function safeDbError(error) {
  const code = error?.code || error?.name || 'UNKNOWN_DB_ERROR';
  const message = String(error?.message || 'Database connection failed');

  if (/password authentication failed/i.test(message)) return 'DB_AUTH_FAILED';
  if (/relation .*wedding_wishes.* does not exist/i.test(message)) return 'TABLE_NOT_FOUND';
  if (/getaddrinfo|ENOTFOUND|fetch failed|network/i.test(message)) return 'DB_NETWORK_ERROR';
  if (/connection string|database url|invalid.*url/i.test(message)) return 'INVALID_DATABASE_URL';
  return String(code).slice(0, 80);
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return response.status(500).json({
      ok: false,
      error: 'DATABASE_URL_NOT_CONFIGURED'
    });
  }

  try {
    const sql = neon(databaseUrl);

    if (request.method === 'GET') {
      const rows = await sql`
        SELECT id, name, message, created_at
        FROM wedding_wishes
        WHERE approved = TRUE
        ORDER BY created_at DESC
        LIMIT 100
      `;
      return response.status(200).json({ ok: true, wishes: rows });
    }

    if (request.method === 'POST') {
      const name = cleanText(request.body?.name, 40);
      const message = cleanText(request.body?.message, 280);

      if (name.length < 2 || message.length < 2) {
        return response.status(400).json({ ok: false, error: 'INVALID_WISH' });
      }

      const [wish] = await sql`
        INSERT INTO wedding_wishes (name, message)
        VALUES (${name}, ${message})
        RETURNING id, name, message, created_at
      `;

      return response.status(201).json({ ok: true, wish });
    }

    response.setHeader('Allow', 'GET, POST');
    return response.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  } catch (error) {
    console.error('wedding_wishes api error', error);
    return response.status(500).json({
      ok: false,
      error: safeDbError(error)
    });
  }
}
