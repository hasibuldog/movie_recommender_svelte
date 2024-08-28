<!-- src/routes/+page.svelte -->
<script>
    import { goto } from '$app/navigation';
  
    function goToRecommendation() {
      goto('/recommendation');
    }
  </script>
  
  <div class="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
    <h1 class="text-4xl font-bold mb-8">Welcome to Movie Recommendation App</h1>
    <p class="text-xl mb-8">Discover your next favorite movie with our AI-powered recommendations!</p>
    <button
      on:click={goToRecommendation}
      class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105"
    >
      Get Recommendation
    </button>
  </div>
