<script>
    export let movie;
    export let customClass = '';
</script>

<div class="bg-gray-800 rounded-lg overflow-hidden shadow-lg transition duration-300 ease-in-out transform hover:scale-105 {customClass}">
    {#if movie.poster_path}
      <img src={movie.poster_path} alt={movie.title} class="w-full h-64 object-cover" />
    {:else}
      <div class="w-full h-64 bg-gray-700 flex items-center justify-center">
        <span class="text-gray-500">No poster available</span>
      </div>
    {/if}
    <div class="p-4">
      <h3 class="text-lg font-semibold mb-2">{movie.title}</h3>
      <div class="flex items-center mb-2">
        <svg class="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span>{movie.rating.toFixed(1)}</span>
      </div>
      <div class="flex flex-wrap">
        {#each movie.genres as genre}
          <span class="bg-red-600 text-xs px-2 py-1 rounded-full mr-2 mb-2">{genre}</span>
        {/each}
      </div>
    </div>
  </div>