# Movie Recommendation Service

An end-to-end movie recommendation system built with Svelte, SvelteKit, PostgreSQL, and pgvector.

## About Database & Dataset

This project uses a processed version of the latest [MovieLens dataset](https://grouplens.org/datasets/movielens/latest/). The original dataset includes a rich collection of movie ratings and tags from thousands of users. For this project, the data was processed and inserted into a PostgreSQL database, optimized for efficient querying and recommendation generation. To get more details about processing and inserting the data, please refer to [github repo](https://github.com/hasibuldog/movie_recommender).

## Overview

This project is a hybrid movie recommendation service that leverages both content-based and collaborative filtering techniques. It utilizes a vector database for efficient similarity searches, providing users with personalized movie suggestions.

## Key Features

- Hybrid recommendation system combining content-based and collaborative filtering
- Vector similarity search powered by pgvector
- Interactive user interface built with Svelte and SvelteKit
- Real-time movie search functionality

## Technology Stack

- Framework: SvelteKit (full-stack)
- UI Library: Svelte
- Server-side Logic: Node.js (via SvelteKit API routes)
- Database: PostgreSQL with pgvector extension
- API Integration: TMDB (The Movie Database) for movie details and posters

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/hasibuldog/movie_recommender_svelte.git
   cd movie-recommendation-service
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following:
   ```
   DB_URL=your_postgres_connection_string
   TMDB_API_KEY=your_tmdb_api_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173` to see the app in action.

## 

