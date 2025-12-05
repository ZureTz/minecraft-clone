<script lang="ts">
  import { Canvas } from "@threlte/core";
  import { ACESFilmicToneMapping } from "three";

  import Scene from "./components/Scene.svelte";
  import { World } from "./utils/world.svelte";
  import { defaultPosition } from "./utils/player.svelte";

  // Initialize world and player position state
  const world = new World();

  // Copy the default position to avoid mutating the imported object
  let position = $state(defaultPosition);
</script>

{#if world.isGenerating}
  <!-- Show Loading Spinner -->
  <div
    class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-black text-white backdrop-blur-md"
  >
    <div
      class="mb-5 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-green-500"
    ></div>
    <p class="text-xl font-semibold tracking-wide drop-shadow-lg">Generating World...</p>
  </div>
{:else}
  <!-- Main Canvas -->
  <Canvas shadows toneMapping={ACESFilmicToneMapping}>
    <Scene {world} bind:position />
  </Canvas>

  <!-- Position Display -->
  <div
    class="pointer-events-none absolute bottom-4 left-4 z-50 flex flex-col gap-1 rounded-lg bg-black/60 p-3 font-mono text-sm text-white backdrop-blur-sm"
  >
    <div class="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400">Coordinates</div>
    <div class="flex gap-3">
      <span class="flex items-center gap-1"
        ><span class="font-bold text-red-400">X</span> {position.x}</span
      >
      <span class="flex items-center gap-1"
        ><span class="font-bold text-green-400">Y</span> {position.y}</span
      >
      <span class="flex items-center gap-1"
        ><span class="font-bold text-blue-400">Z</span> {position.z}</span
      >
    </div>
  </div>
{/if}
