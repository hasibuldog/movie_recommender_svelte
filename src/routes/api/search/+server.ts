import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { query } from '$lib/db';

export const GET: RequestHandler = async ({ url }) => {
  const title = url.searchParams.get('title');
  const limit = parseInt(url.searchParams.get('limit') || '10');

  if (!title) {
    return json({ error: 'Title parameter is required' }, { status: 400 });
  }

  const sqlQuery = `
    SELECT movieId, tmdbId, title, similarity(title, $1) AS sim
    FROM movies_v3
    WHERE title % $1 OR title ILIKE $2
    ORDER BY sim DESC
    LIMIT $3;
  `;

  try {
    const result = await query(sqlQuery, [title, `%${title}%`, limit]);
    const movies = result.rows.map(row => ({
      movieId: row.movieid,
      tmdbId: row.tmdbid,
      title: row.title,
      similarity: row.sim
    }));
    return json(movies);
  } catch (error) {
    console.error('Error searching movies:', error);
    return json({ error: 'Error searching movies' }, { status: 500 });
  }
};