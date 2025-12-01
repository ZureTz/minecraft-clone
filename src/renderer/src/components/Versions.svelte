<script lang="ts">
  const versions = window.electron.process.versions;
</script>

<ul class="flex m-4 space-x-4 text-sm text-gray-500 dark:text-gray-400">
  <li>Electron v{versions.electron}</li>
  <li>Chromium v{versions.chrome}</li>
  <li>Node v{versions.node}</li>
</ul>
