<script lang="ts">
  // Crosshair component - displayed in the center of the screen
</script>

<div class="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
  <div class="relative h-6 w-6">
    <!-- Vertical line -->
    <div
      class="absolute left-1/2 top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-white/80 shadow-lg"
    ></div>
    <!-- Horizontal line -->
    <div
      class="absolute left-1/2 top-1/2 h-0.5 w-3 -translate-x-1/2 -translate-y-1/2 bg-white/80 shadow-lg"
    ></div>
    <!-- Center dot -->
    <div
      class="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60"
    ></div>
  </div>
</div>
