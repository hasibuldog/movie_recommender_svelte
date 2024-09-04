<script>
    import { createEventDispatcher } from 'svelte';
    export let movie;
    export let customClass = '';

    const dispatch = createEventDispatcher();
    function handleClick() {
        // console.log("MOVIE",movie);
        dispatch('select', {movieId: movie.movieid});
    }
    $: rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    $: posterUrl = movie.poster_url || 'path/to/default/poster.jpg';
    $: genres = movie.genres ? movie.genres.split(' ') : ['N/A'];
    $: popularity = movie.popularity ? movie.popularity.toFixed(1) : 'N/A';

</script>

<button type="button" class="movie-card {customClass} bg-gray-800 p-4 rounded-lg shadow-lg" on:click={handleClick}>
    <img src={posterUrl} alt="{movie.title} poster" class="w-full h-auto rounded-lg shadow-lg">
    <div class="mt-2">
        <h3 class="text-lg font-semibold ">{movie.title}</h3>
        <div class="flex flex-wrap mt-2">
          {#each genres as genre}
          <span class="genre-badge bg-red-700 text-gray-300 text-xs font-semibold mr-2 mb-2 px-2.5 py-0.5 rounded-full">{genre}</span>
          {/each}
        </div>
        <p class="mt-2 font-semibold text-white"><span class=" text-gray-400">Rating:</span> {rating}</p>
        <p class="mt-2 font-semibold text-white"><span class=" text-gray-400">Popularity:</span> {popularity}</p>
    </div>
</button>

<style>
    .movie-card {
        background-color: #1f2937; /* Tailwind's bg-gray-800 */
    }
</style>

