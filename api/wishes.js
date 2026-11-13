import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

function cleanText(value, max) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  if (!process.env.DATABASE_URL) {
    return response.status(500).json({ error: 'DATABASE_URL is not configured' });
  }

  try {
    if (request.method === 'GET') {
      const rows = await sql`
        SELECT id, name, message, created_at
        FROM wedding_wishes
        WHERE approved = TRUE
        ORDER BY created_at DESC
        LIMIT 100
      `;
      return response.status(200).json({ wishes: rows });
    }

    if (request.method === 'POST') {
      const name = cleanText(request.body?.name, 40);
      const message = cleanText(request.body?.message, 280);

      if (name.length < 2 || message.length < 2) {
        return response.status(400).json({ error: 'اكتب الاسم والتهنئة' });
      }

      const [wish] = await sql`
        INSERT INTO wedding_wishes (name, message)
        VALUES (${name}, ${message})
        RETURNING id, name, message, created_at
      `;
      return response.status(201).json({ wish });
    }

    response.setHeader('Allow', 'GET, POST');
    return response.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('wedding_wishes api error', error);
    return response.status(500).json({ error: 'Database error' });
  }
}
