<script lang="ts">
  import { Blocks } from "../utils/blocks";
  import { playerController } from "../utils/player.svelte";

  // Get placeable blocks
  const placableBlocks = playerController.placableBlockTypes.map((id) => Blocks[id]);
</script>

<div
  class="pointer-events-none absolute bottom-0 left-0 right-0 z-40 flex items-end justify-center pb-6"
>
  <div class="flex gap-1 rounded-md bg-black/50 p-1 backdrop-blur-sm border border-white/20">
    {#each placableBlocks as block, index (block.id)}
      {@const isSelected = playerController.selectedBlockType === block.id}
      <div
        class="relative flex h-12 w-12 flex-col items-center justify-center rounded-sm transition-all {isSelected
          ? 'bg-white/20 scale-110 z-10 border-2 border-white'
          : 'bg-black/20 border border-white/10 hover:bg-white/10'}"
      >
        <!-- Block color preview -->
        <div
          class="h-8 w-8 shadow-sm"
          style="background-color: #{block.color?.getHexString() || 'ffffff'}; 
                 background-image: url({block.texture && typeof block.texture === 'string'
            ? block.texture
            : ''});
                 background-size: cover;
                 image-rendering: pixelated;"
        ></div>

        <!-- Block number -->
        <div class="absolute top-0 left-1 text-[10px] font-bold text-white drop-shadow-md">
          {index + 1}
        </div>
      </div>
    {/each}
  </div>
</div>
