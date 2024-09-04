<script>
    import { onMount } from 'svelte';
    import SearchBar from '$lib/components/SearchBar.svelte';
    import MovieCard from '$lib/components/MovieCard.svelte';

    const SEARCH_API = '/api/search';
    const RECOMMEND_API_URL = '/api/recommend';

    let searchTerm = '';
    let searchResults = [];
    let selectedMovie = null;
    let searchError = null;
    let selectedgenres = [];
    let selectedIndex = -1;
    let showSearchResults = true;
    let contentRecs = [];
    let collabRecs = [];
    let mergedRecs = [];
    let selfDetails = [];

    $: if (selectedMovie) {
        selectedgenres = selectedMovie.genres ? selectedMovie.genres.split(' ') : ['N/A'];
    }

    function handleSearch(event) {
        searchMovies(event.detail);
        selectedIndex = -1;
        showSearchResults = true;
    }

    function handleMoveSelection(event) {
        const direction = event.detail;
        selectedIndex = Math.max(-1, Math.min(searchResults.length - 1, selectedIndex + direction));
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
                const response = await fetch(`${SEARCH_API}?title=${encodeURIComponent(title)}&limit=10`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                searchResults = await response.json();
            } catch (error) {
                searchError = `Error searching for movies: ${error.message}. Check console for more details.`;
                searchResults = [];
            }
        } else {
            searchResults = [];
        }
    }

    async function handleMovieSelect(movie) {
        showSearchResults = false;
        searchTerm = movie.title;
        console.log("MOVIE",movie);
        const response = await fetch(RECOMMEND_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                movie_id: movie.movieId,
                n_recommendations: 20,
            }),
        });
        const data = await response.json();
        mergedRecs = data.recommendations;
        contentRecs = data.contentRecs;
        collabRecs = data.collabRecs;
        selfDetails = data.selfDetails[0]; // Assuming there's only one item in selfDetails
        selectedMovie = selfDetails;
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
            <div class="selected-movie-card flex items-start bg-gray-800 p-4 rounded-lg shadow-lg">
                <img src={selectedMovie.poster_url || 'path/to/default/poster.jpg'} alt="{selectedMovie.title} poster" class="w-1/4 h-auto rounded-lg shadow-lg">
                <div class="ml-4 flex-1">
                    <h3 class="text-2xl font-semibold">{selectedMovie.title}</h3>
                    <div class="flex flex-wrap mt-2">
                        {#each selectedgenres as genre}
                        <span class="genre-badge bg-red-700 text-gray-300 text-l font-semibold mr-2 mb-2 px-2.5 py-0.5 rounded-full">{genre}</span>
                        {/each}
                    </div>
                    <p> </p>
                    <p class="mt-2 text-gray-300">{selectedMovie.overview}</p>
                    <p class="mt-2 font-bold text-white"><span class=" text-gray-400">Release Date:</span> {selectedMovie.release_date}</p>
                    <p class="mt-2 font-bold text-white"><span class=" text-gray-400">Runtime:</span> {selectedMovie.runtime} minutes</p>
                    <p class="mt-2 font-bold text-white"><span class=" text-gray-400">Vote Average:</span> {selectedMovie.vote_average.toFixed(1)}</p>
                    <p class="mt-2 font-bold text-white"><span class=" text-gray-400">Popularity:</span> {selectedMovie.popularity}</p>
                </div>
            </div>
        </div>

        <div class="mb-8">
            <h2 class="text-3xl font-semibold mb-4">Viewers Also Liked</h2>
            <div class="overflow-x-auto">
                <div class="flex space-x-4 pb-4">
                    {#each collabRecs as movie}
                        <MovieCard {movie} customClass="w-48 flex-shrink-0" on:select={event => handleMovieSelect(event.detail)} />
                    {/each}
                </div>
            </div>
        </div>

        <div class="mb-8">
            <h2 class="text-3xl font-semibold mb-4">Similar Movies</h2>
            <div class="overflow-x-auto">
                <div class="flex space-x-4 pb-4">
                    {#each contentRecs as movie}
                        <MovieCard {movie} customClass="w-48 flex-shrink-0" on:select={event => handleMovieSelect(event.detail)} />
                    {/each}
                </div>
            </div>
        </div>

        <div>
            <h2 class="text-3xl font-semibold mb-4">Top Recommendations</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {#each mergedRecs as movie}
                    <MovieCard {movie} on:select={event => handleMovieSelect(event.detail)} />
                {/each}
            </div>
        </div>
    {/if}
</div>

<style>
    .selected-movie-card {
        background-color: #1f2937; 
        max-height: 40rem;
    }
    .selected-movie-card img {
        max-height: 36rem;
        object-fit: cover;
    }
</style>