<script lang="ts">
  import { sys } from '$lib/state.svelte';
  import { api } from '$lib/api';
  import { onMount } from 'svelte';
  import type { BackupJob } from '@arr/shared';

  let backups = $state<BackupJob[]>([]);
  let loading = $state(false);

  onMount(async () => {
    // Load initial backups
    try {
      backups = await api.getBackups();
      sys.backups = backups;
    } catch (error) {
      console.error('Failed to load backups:', error);
    }
  });

  async function triggerBackup() {
    loading = true;
    try {
      const result = await api.createBackup();
      console.log('Backup triggered:', result);
      // Refresh backups list
      backups = await api.getBackups();
      sys.backups = backups;
    } catch (error) {
      console.error('Failed to trigger backup:', error);
      alert('Failed to create backup');
    } finally {
      loading = false;
    }
  }

  async function restartContainer(id: string) {
    try {
      const result = await api.restartContainer(id);
      if (!result.success) {
        alert('Failed to restart container');
      }
    } catch (error) {
      console.error('Failed to restart container:', error);
      alert('Failed to restart container');
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  function getStatusColor(state: string): string {
    switch (state) {
      case 'running':
        return 'text-green-500';
      case 'exited':
      case 'dead':
        return 'text-red-500';
      case 'restarting':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  }
</script>

<div class="min-h-screen bg-gray-900 text-white p-8">
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-4xl font-bold mb-2">Arr-Stack Control Plane</h1>
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <div
            class="w-3 h-3 rounded-full {sys.connection === 'connected'
              ? 'bg-green-500'
              : 'bg-red-500'}"
          ></div>
          <span class="text-sm opacity-70">
            {sys.connection === 'connected' ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <span class="text-sm opacity-70">
          {sys.runningCount} Running • {sys.offlineCount} Offline
        </span>
      </div>
    </div>

    <!-- Actions -->
    <div class="mb-8 flex gap-4">
      <button
        class="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onclick={triggerBackup}
        disabled={loading}
      >
        {loading ? 'Creating...' : '📸 Create Snapshot'}
      </button>
    </div>

    <!-- Containers Grid -->
    <div class="mb-12">
      <h2 class="text-2xl font-bold mb-4">Containers</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each sys.containers as container}
          {@const stats = sys.getContainerStats(container.id)}
          <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div class="flex items-start justify-between mb-2">
              <div>
                <h3 class="font-bold text-lg {getStatusColor(container.state)}">
                  {container.name}
                </h3>
                <p class="text-sm opacity-70">{container.status}</p>
              </div>
              <span class="text-xs px-2 py-1 rounded {getStatusColor(container.state)} bg-opacity-20">
                {container.state}
              </span>
            </div>

            <div class="mt-3 space-y-1 text-sm">
              <div class="opacity-70">Image: {container.image}</div>
              {#if container.ports.length > 0}
                <div class="opacity-70">Ports: {container.ports.join(', ')}</div>
              {/if}
              {#if stats.cpu > 0 || stats.memory > 0}
                <div class="mt-2 space-y-1">
                  <div class="flex justify-between">
                    <span>CPU:</span>
                    <span class="font-mono">{stats.cpu.toFixed(1)}%</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Memory:</span>
                    <span class="font-mono">{formatBytes(stats.memory)}</span>
                  </div>
                </div>
              {/if}
            </div>

            {#if container.state === 'running'}
              <button
                class="mt-3 w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-sm font-semibold transition-colors"
                onclick={() => restartContainer(container.id)}
              >
                Restart
              </button>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <!-- Backups List -->
    <div>
      <h2 class="text-2xl font-bold mb-4">Backups</h2>
      <div class="bg-gray-800 rounded-lg overflow-hidden">
        {#if backups.length === 0}
          <div class="p-8 text-center opacity-70">No backups yet</div>
        {:else}
          <table class="w-full">
            <thead class="bg-gray-700">
              <tr>
                <th class="px-4 py-3 text-left">Filename</th>
                <th class="px-4 py-3 text-left">Size</th>
                <th class="px-4 py-3 text-left">Created</th>
                <th class="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each backups as backup}
                <tr class="border-t border-gray-700 hover:bg-gray-750">
                  <td class="px-4 py-3">{backup.filename}</td>
                  <td class="px-4 py-3">{formatBytes(backup.sizeBytes)}</td>
                  <td class="px-4 py-3">{formatDate(backup.createdAt)}</td>
                  <td class="px-4 py-3">
                    <a
                      href={api.getBackupDownloadUrl(backup.filename)}
                      class="text-blue-400 hover:text-blue-300 underline"
                      download
                    >
                      Download
                    </a>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>
    </div>
  </div>
</div>

