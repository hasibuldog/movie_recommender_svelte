<script>
    import { onMount } from 'svelte';
    import SearchBar from '$lib/components/SearchBar.svelte';
    import MovieCard from '$lib/components/MovieCard.svelte';

    const SEARCH_API = '/api/search';
    const RECOMMEND_API_URL = '/api/recommend';
    const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
    const TMDB_BASE_URL = import.meta.env.VITE_TMDB_BASE_URL;
    const POSTER_BASE_URL = import.meta.env.VITE_POSTER_BASE_URL;

    let searchTerm = '';
    let searchResults = [];
    let recommendations = [];
    let selectedMovie = null;
    let searchError = null;
    let selectedIndex = -1;
    let showSearchResults = true;
    let contentRecs = [];
    let collabRecs = [];
    let mergedRecs = [];

    function handleSearch(event) {
        searchMovies(event.detail);
        selectedIndex = -1;
        showSearchResults = true;
    }

    function handleMoveSelection(event) {
        const direction = event.detail;
        console.log('MATH:', direction, selectedIndex, searchResults.length);
        console.log('MATH:', searchResults.length - 1, selectedIndex + direction);
        selectedIndex = Math.max(-1, Math.min(searchResults.length - 1, selectedIndex + direction));
        console.log("=============================================================");
    }

    function handleSelectCurrent() {
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
            handleMovieSelect(searchResults[selectedIndex]);
        }
    }

    async function searchMovies(title) {
        searchError = null;
        if (title.length > 0) {
            try {
                console.log(`Fetching: ${SEARCH_API}?title=${encodeURIComponent(title)}&limit=10`);
                const response = await fetch(`${SEARCH_API}?title=${encodeURIComponent(title)}&limit=10`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                searchResults = await response.json();
                console.log('Search results:', searchResults);
            } catch (error) {
                console.error('Search error:', error);
                searchError = `Error searching for movies: ${error.message}. Check console for more details.`;
                searchResults = [];
            }
        } else {
            searchResults = [];
        }
    }

    async function handleMovieSelect(movie) {
        selectedMovie = await fetchMovieDetails(movie);
        showSearchResults = false;
        searchTerm = movie.title;
        const response = await fetch(RECOMMEND_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                movie_id: movie.movieId,
                tmdb_id: movie.tmdbId,
                title: movie.title,
                n_recommendations: 15,
            }),
        });
        const data = await response.json();
        mergedRecs = await Promise.all(data.recommendations.map(fetchMovieDetails));
        contentRecs = await Promise.all(data.contentRecs.map(fetchMovieDetails));
        collabRecs = await Promise.all(data.collabRecs.map(fetchMovieDetails));
    }

    async function fetchMovieDetails(movie) {
        let tmdbId;
        if (movie.tmdbId !== undefined) {
            tmdbId = movie.tmdbId;
        } else if (movie.tmdbid !== undefined) {
            tmdbId = movie.tmdbid;
        } else {
            console.error('No tmdbId found for movie:', movie);
            return {
                ...movie,
                poster_path: null,
                rating: 0,
                genres: [],
                overview: 'Failed to fetch movie details: No TMDB ID available'
            };
        }

        try {
            const response = await fetch(
                `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}`
            );
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return {
                ...movie,
                poster_path: data.poster_path ? `${POSTER_BASE_URL}${data.poster_path}` : null,
                rating: data.vote_average || 0,
                genres: data.genres ? data.genres.map((genre) => genre.name) : [],
                overview: data.overview || 'No overview available'
            };
        } catch (error) {
            console.error('Error fetching movie details:', error);
            return {
                ...movie,
                poster_path: null,
                rating: 0,
                genres: [],
                overview: 'Failed to fetch movie details'
            };
        }
    }

    function handleShowResults(event) {
        showSearchResults = event.detail;
    }
</script>

<div class="min-h-screen bg-gray-900 text-white p-8">
    <h1 class="text-4xl font-bold mb-8 text-center">Movie Recommendations</h1>
    
    <div class="w-full max-w-2xl mx-auto mb-8">
        <SearchBar 
            bind:searchTerm
            {searchResults}
            {selectedIndex}
            showResults={showSearchResults}
            on:search={handleSearch}
            on:moveSelection={handleMoveSelection}
            on:selectCurrent={handleSelectCurrent}
            on:select={event => handleMovieSelect(event.detail)}
            on:showResults={handleShowResults}
        />
    </div>

    {#if searchError}
        <p class="text-red-500 mt-4">{searchError}</p>
    {/if}

    {#if selectedMovie}
        <div class="mb-8">
            <h2 class="text-3xl font-semibold mb-4">Selected Movie</h2>
            <div class="flex items-start">
                <MovieCard movie={selectedMovie} customClass="w-1/4" />
                <div class="ml-8 flex-1">
                    <h3 class="text-xl font-semibold">{selectedMovie.title}</h3>
                    <p class="mt-2">{selectedMovie.overview}</p>
                </div>
            </div>
        </div>

        <div class="mb-8">
            <h2 class="text-3xl font-semibold mb-4">Viewers Also Liked</h2>
            <div class="overflow-x-auto">
                <div class="flex space-x-4 pb-4">
                    {#each collabRecs as movie}
                        <MovieCard {movie} customClass="w-48 flex-shrink-0" />
                    {/each}
                </div>
            </div>
        </div>

        <div class="mb-8">
            <h2 class="text-3xl font-semibold mb-4">Similar Movies</h2>
            <div class="overflow-x-auto">
                <div class="flex space-x-4 pb-4">
                    {#each contentRecs as movie}
                        <MovieCard {movie} customClass="w-48 flex-shrink-0" />
                    {/each}
                </div>
            </div>
        </div>

        <div>
            <h2 class="text-3xl font-semibold mb-4">Top Recommendations</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {#each mergedRecs as movie}
                    <MovieCard {movie} />
                {/each}
            </div>
        </div>
    {/if}
</div>