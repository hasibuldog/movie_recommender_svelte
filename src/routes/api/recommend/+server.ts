import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { query } from '$lib/db';

function minMaxNormalize(distances: number[]): number[] {
  const minDist = Math.min(...distances);
  const maxDist = Math.max(...distances);
  if (minDist === maxDist) {
    return distances.map(() => 1.0);
  }
  return distances.map(d => (d - minDist) / (maxDist - minDist));
}

async function getContentBasedRecommendation(movieId: number, k: number) {
  const embeddings_query = "SELECT embeddings FROM movies_v3 WHERE movieId = $1;";
  const embeddingResult = await query(embeddings_query, [movieId]);
  const embedding = embeddingResult.rows[0].embeddings;

  const knn_query = `
    SELECT movieId, tmdbId, title, embeddings <-> $1::vector AS distance
    FROM movies_v3
    WHERE movieId != $2
    ORDER BY embeddings <-> $1::vector
    LIMIT $3;
  `;

  const result = await query(knn_query, [embedding, movieId, k]);
  return result.rows;
}

async function getCollaborativeRecommendation(movieId: number, k: number) {
  const usr_vec_query = "SELECT usr_vec FROM movies_v3 WHERE movieId = $1;";
  const usrVecResult = await query(usr_vec_query, [movieId]);
  const usrVec = usrVecResult.rows[0].usr_vec;

  const sqlQuery = `
    SELECT movieId, tmdbId, title, usr_vec <-> $1::vector AS distance
    FROM movies_v3
    WHERE movieId != $2
    ORDER BY usr_vec <-> $1::vector
    LIMIT $3;
  `;

  const result = await query(sqlQuery, [usrVec, movieId, k]);
  return result.rows;
}

function mergeRecommendations(contentRecs: any[], collabRecs: any[], k: number) {
  const contentDistances = contentRecs.map(rec => rec.distance);
  const collabDistances = collabRecs.map(rec => rec.distance);

  const normContentDistances = minMaxNormalize(contentDistances);
  const normCollabDistances = minMaxNormalize(collabDistances);

  const contentRecsNorm = contentRecs.map((rec, i) => ({ ...rec, distance: normContentDistances[i] }));
  const collabRecsNorm = collabRecs.map((rec, i) => ({ ...rec, distance: normCollabDistances[i] }));

  const recDict: Record<number, any> = {};
  [...contentRecsNorm, ...collabRecsNorm].forEach(rec => {
    if (recDict[rec.movieid]) {
      recDict[rec.movieid].distance_sum += rec.distance;
      recDict[rec.movieid].count += 1;
      if (contentRecsNorm.includes(rec)) {
        recDict[rec.movieid].content_distance = rec.distance;
      }
      if (collabRecsNorm.includes(rec)) {
        recDict[rec.movieid].collaborative_distance = rec.distance;
      }
    } else {
      recDict[rec.movieid] = {
        title: rec.title,
        tmdbid: rec.tmdbid,
        distance_sum: rec.distance,
        count: 1,
        content_distance: contentRecsNorm.includes(rec) ? rec.distance : null,
        collaborative_distance: collabRecsNorm.includes(rec) ? rec.distance : null
      };
    }
  });

  const mergedRecs = Object.entries(recDict).map(([movieId, data]) => ({
    movieid: parseInt(movieId),
    tmdbid: data.tmdbid,
    title: data.title,
    avg_distance: data.distance_sum / data.count,
    count: data.count,
    content_distance: data.content_distance,
    collaborative_distance: data.collaborative_distance
  }));

  mergedRecs.sort((a, b) => b.count - a.count || a.avg_distance - b.avg_distance);
  return mergedRecs;
}

export const POST: RequestHandler = async ({ request }) => {
  const { movie_id, tmdb_id, title, n_recommendations } = await request.json();

  try {
    const contentRecs = await getContentBasedRecommendation(movie_id, n_recommendations);
    const collabRecs = await getCollaborativeRecommendation(movie_id, n_recommendations);
    const mergedRecs = mergeRecommendations(contentRecs, collabRecs, n_recommendations);

    // console.log("collabRecs", collabRecs);
    // console.log("================================================")
    // console.log("contentRecs", contentRecs);
    // console.log("================================================")
    // console.log("mergedRecs", mergedRecs);
    // console.log("================================================")

    return json({
      recommendations: mergedRecs,
      contentRecs: contentRecs,
      collabRecs: collabRecs,
      info: [movie_id, tmdb_id, title]
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return json({ error: 'Error getting recommendations' }, { status: 500 });
  }
};
