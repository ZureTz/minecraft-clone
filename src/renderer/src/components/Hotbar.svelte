<script lang="ts">
  import { Blocks } from "../utils/blocks";
  import { playerController } from "../utils/player.svelte";

  // Get placeable blocks
  const placableBlocks = playerController.placableBlockTypes.map((id) => Blocks[id]);
</script>

<div
  class="pointer-events-none absolute bottom-0 left-0 right-0 z-40 flex items-end justify-center pb-6"
>
  <div class="flex gap-2 rounded-lg bg-black/70 p-2 backdrop-blur-sm">
    {#each placableBlocks as block, index (block.id)}
      {@const isSelected = playerController.selectedBlockType === block.id}
      <div
        class="relative flex h-16 w-16 flex-col items-center justify-center rounded-md border-2 transition-all {isSelected
          ? 'border-white'
          : 'border-gray-600'}"
        style="background-color: {isSelected
          ? 'rgba(255, 255, 255, 0.2)'
          : 'rgba(255, 255, 255, 0.05)'}"
      >
        <!-- Block color preview -->
        <div
          class="h-10 w-10 rounded shadow-lg"
          style="background-color: #{block.color?.getHexString() || 'ffffff'}"
        ></div>

        <!-- Block number -->
        <div class="mt-1 text-xs font-bold text-white/80">{index + 1}</div>

        <!-- Selection indicator -->
        {#if isSelected}
          <div
            class="absolute -bottom-2 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-white"
          ></div>
        {/if}
      </div>
    {/each}
  </div>
</div>
