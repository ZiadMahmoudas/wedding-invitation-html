import { neon } from '@neondatabase/serverless';

function classify(error) {
  const message = String(error?.message || '');
  if (/password authentication failed/i.test(message)) return 'DB_AUTH_FAILED';
  if (/relation .*wedding_wishes.* does not exist/i.test(message)) return 'TABLE_NOT_FOUND';
  if (/getaddrinfo|ENOTFOUND|fetch failed|network/i.test(message)) return 'DB_NETWORK_ERROR';
  if (/connection string|database url|invalid.*url/i.test(message)) return 'INVALID_DATABASE_URL';
  return error?.code || error?.name || 'UNKNOWN_DB_ERROR';
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return response.status(500).json({
      ok: false,
      env: false,
      database: false,
      table: false,
      error: 'DATABASE_URL_NOT_CONFIGURED'
    });
  }

  try {
    const sql = neon(databaseUrl);
    await sql`SELECT 1 AS ok`;

    const table = await sql`
      SELECT to_regclass('public.wedding_wishes') AS name
    `;

    const tableExists = Boolean(table?.[0]?.name);

    return response.status(tableExists ? 200 : 500).json({
      ok: tableExists,
      env: true,
      database: true,
      table: tableExists,
      error: tableExists ? null : 'TABLE_NOT_FOUND'
    });
  } catch (error) {
    console.error('neon health error', error);
    return response.status(500).json({
      ok: false,
      env: true,
      database: false,
      table: false,
      error: classify(error)
    });
  }
}
