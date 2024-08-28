<script>
    import { createEventDispatcher } from 'svelte';
    import { debounce } from 'lodash-es';
  
    const dispatch = createEventDispatcher();
    export let searchTerm = '';
    export let searchResults = [];
    export let selectedIndex = -1;
    export let showResults = true;
  
    const debouncedSearch = debounce((term) => {
      dispatch('search', term);
    }, 300);

    function handleInput() {
      debouncedSearch(searchTerm);
      dispatch('showResults', true);
    }

    function handleKeydown(event) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        dispatch('moveSelection', event.key === 'ArrowDown' ? 1 : -1);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        dispatch('selectCurrent');
      }
    }

    function handleSelect(result) {
      dispatch('select', result);
      dispatch('showResults', false);
    }
</script>
  
<div class="relative w-full max-w-2xl mx-auto">
  <input
    type="text"
    bind:value={searchTerm}
    on:input={handleInput}
    on:keydown={handleKeydown}
    placeholder="Search for a movie..."
    class="w-full px-4 py-2 bg-gray-800 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
  <button class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
    </svg>
  </button>
</div>

{#if showResults && searchResults.length > 0}
<div class="absolute left-1/2 transform -translate-x-1/2 z-10 w-full max-w-2xl mt-1 bg-gray-800 rounded-md shadow-lg">
    <ul class="py-2">
      {#each searchResults as result, index}
        <li>
          <button
            on:click={() => handleSelect(result)}
            class="w-full px-4 py-2 text-left hover:bg-gray-700 focus:outline-none"
            class:bg-gray-700={index === selectedIndex}
          >
            {result.title}
          </button>
        </li>
      {/each}
    </ul>
  </div>
{/if}