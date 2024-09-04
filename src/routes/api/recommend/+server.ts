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
  const selfDetailsQuery = "SELECT embeddings, title, embeddings, genres, overview, release_date, runtime, poster_url, vote_average, popularity FROM movies_v5 WHERE movieId = $1;";
  const selfDetails = await query(selfDetailsQuery, [movieId]);
  const embedding = selfDetails.rows[0].embeddings;
  const knn_query = `
    SELECT movieId, title, genres, poster_url, vote_average, popularity, embeddings <-> $1::vector AS distance
    FROM movies_v5
    WHERE movieId != $2
    ORDER BY embeddings <-> $1::vector
    LIMIT $3;
  `;

  const contentRecs = await query(knn_query, [embedding, movieId, k]);
  return [contentRecs.rows, selfDetails.rows];
}

async function getCollaborativeRecommendation(movieId: number, k: number) {
  const usr_vec_query = "SELECT usr_vec FROM movies_v5 WHERE movieId = $1;";
  const usrVecResult = await query(usr_vec_query, [movieId]);
  const usrVec = usrVecResult.rows[0].usr_vec;
  // console.log(usrVec);

  const sqlQuery = `
    SELECT movieId, title, genres, poster_url, vote_average, popularity, usr_vec <-> $1::vector AS distance
    FROM movies_v5
    WHERE movieId != $2
    ORDER BY usr_vec <-> $1::vector
    LIMIT $3;
  `;

  const result = await query(sqlQuery, [usrVec, movieId, k]);
  // console.log(result.rows);
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
        genres: rec.genres,
        poster_url: rec.poster_url,
        vote_average: rec.vote_average,
        popularity: rec.popularity,
        distance_sum: rec.distance,
        count: 1,
        content_distance: contentRecsNorm.includes(rec) ? rec.distance : null,
        collaborative_distance: collabRecsNorm.includes(rec) ? rec.distance : null
      };
    }
  });

  const mergedRecs = Object.entries(recDict).map(([movieId, data]) => ({
    movieid: parseInt(movieId),
    title: data.title,
    genres: data.genres,
    poster_url: data.poster_url,
    vote_average: data.vote_average,
    popularity: data.popularity,
    avg_distance: data.distance_sum / data.count,
    count: data.count,
    content_distance: data.content_distance,
    collaborative_distance: data.collaborative_distance
  }));

  mergedRecs.sort((a, b) => b.count - a.count || a.avg_distance - b.avg_distance);
  return mergedRecs;
}

export const POST: RequestHandler = async ({ request }) => {
  const { movie_id, title, n_recommendations } = await request.json();

  try {
    const [contentRecs, selfDetails] = await getContentBasedRecommendation(movie_id, n_recommendations);
    const collabRecs = await getCollaborativeRecommendation(movie_id, n_recommendations);
    const mergedRecs = mergeRecommendations(contentRecs, collabRecs, n_recommendations);

    console.log('=========================contentRecs============================')
    console.log(contentRecs);
    console.log('=========================collabRecs============================')
    console.log(collabRecs);
    console.log('=========================mergedRecs ============================')
    console.log(mergedRecs);
    console.log('=========================selfDetails ============================')
    console.log(selfDetails);
    console.log('=====================================================')
    return json({
      recommendations: mergedRecs,
      contentRecs: contentRecs,
      collabRecs: collabRecs,
      selfDetails: selfDetails
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return json({ error: 'Error getting recommendations' }, { status: 500 });
  }
};
