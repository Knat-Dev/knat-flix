<script lang="ts">
  import { sys } from '$lib/state.svelte';
  import { api } from '$lib/api';
  import { toast } from '$lib/toast.svelte';
  import { onMount } from 'svelte';
  import type { BackupJob, ContainerInfo } from '@arr/shared';
  import ProgressBar from '$lib/components/ProgressBar.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import ContainerSkeleton from '$lib/components/ContainerSkeleton.svelte';
  import { Camera, RefreshCw, Search, Clock, RotateCw, Download, Database, Box, HardDrive } from 'lucide-svelte';

  let backups = $state<BackupJob[]>([]);
  let loading = $state(false);
  let initialLoading = $state(true);
  let searchQuery = $state('');
  let filterState = $state<'all' | 'running' | 'offline'>('all');
  let autoRefresh = $state(true);
  let refreshInterval: ReturnType<typeof setInterval> | null = null;
  let hasLoadedOnce = $state(false); // Track if we've loaded containers at least once
  let confirmDialog = $state<{
    open: boolean;
    containerId: string;
    containerName: string;
  }>({
    open: false,
    containerId: '',
    containerName: '',
  });

  onMount(async () => {
    // Load initial backups
    try {
      backups = await api.getBackups();
      sys.backups = backups;
    } catch (error) {
      console.error('Failed to load backups:', error);
      toast.error('Failed to load backups');
    } finally {
      // Small delay to show skeleton
      setTimeout(() => {
        initialLoading = false;
      }, 800);
    }

    // Auto-refresh setup
    if (autoRefresh) {
      startAutoRefresh();
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  });

  function startAutoRefresh() {
    refreshInterval = setInterval(async () => {
      await refreshData();
    }, 10000); // Refresh every 10 seconds
  }

  function stopAutoRefresh() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  }

  $effect(() => {
    if (autoRefresh) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  });

  async function refreshData() {
    try {
      backups = await api.getBackups();
      sys.backups = backups;
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }

  async function manualRefresh() {
    toast.info('Refreshing...');
    await refreshData();
    toast.success('Data refreshed');
  }

  async function triggerBackup() {
    loading = true;
    try {
      const result = await api.createBackup();
      console.log('Backup triggered:', result);
      toast.success('Backup created successfully');
      // Refresh backups list
      backups = await api.getBackups();
      sys.backups = backups;
    } catch (error) {
      console.error('Failed to trigger backup:', error);
      toast.error('Failed to create backup');
    } finally {
      loading = false;
    }
  }

  function openRestartDialog(id: string, name: string) {
    confirmDialog = {
      open: true,
      containerId: id,
      containerName: name,
    };
  }

  async function confirmRestart() {
    const id = confirmDialog.containerId;
    const name = confirmDialog.containerName;
    try {
      const result = await api.restartContainer(id);
      if (!result.success) {
        toast.error(`Failed to restart ${name}`);
      } else {
        toast.success(`${name} restarted successfully`);
      }
    } catch (error) {
      console.error('Failed to restart container:', error);
      toast.error(`Failed to restart ${name}`);
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);
    // Format with 1 decimal place for values >= 10, 2 decimals for smaller values
    const formatted = value >= 10 ? value.toFixed(1) : value.toFixed(2);
    return formatted + ' ' + sizes[i];
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  function getStatusColor(state: string): string {
    switch (state) {
      case 'running':
        return 'text-emerald-400';
      case 'exited':
      case 'dead':
        return 'text-red-400';
      case 'restarting':
        return 'text-amber-400';
      default:
        return 'text-gray-400';
    }
  }

  // Filtered containers based on search and filter
  const filteredContainers = $derived(() => {
    let result = sys.containers;

    // Apply state filter
    if (filterState === 'running') {
      result = result.filter((c) => c.state === 'running');
    } else if (filterState === 'offline') {
      result = result.filter((c) => c.state !== 'running');
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.image.toLowerCase().includes(query) ||
          c.status.toLowerCase().includes(query)
      );
    }

    return result;
  });
</script>

<div class="min-h-screen text-white p-4 md:p-8">
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-8 backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] rounded-3xl p-6 md:p-8 border border-white/[0.15] shadow-2xl shadow-black/50 transform hover:scale-[1.005] transition-all duration-500">
      <h1 class="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
        Arr-Stack Control Plane
      </h1>
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2 backdrop-blur-md bg-white/5 rounded-full px-4 py-2 border border-white/10 hover:bg-white/10 transition-colors">
          <div
            class="w-3 h-3 rounded-full animate-pulse {sys.connection === 'connected'
              ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50'
              : 'bg-red-400 shadow-lg shadow-red-400/50'}"
          ></div>
          <span class="text-sm font-medium text-gray-200">
            {sys.connection === 'connected' ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div class="backdrop-blur-md bg-white/5 rounded-full px-4 py-2 border border-white/10 hover:bg-white/10 transition-colors">
          <span class="text-sm font-medium text-gray-200">
            {sys.runningCount} Running • {sys.offlineCount} Offline
          </span>
        </div>
        <div class="flex items-center gap-2 backdrop-blur-md bg-white/5 rounded-full px-4 py-2 border border-white/10 hover:bg-white/10 transition-colors">
          <span class="text-sm font-medium text-gray-200">Auto-refresh</span>
          <button
            onclick={() => (autoRefresh = !autoRefresh)}
            class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors {autoRefresh
              ? 'bg-emerald-500'
              : 'bg-gray-600'}"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {autoRefresh
                ? 'translate-x-5'
                : 'translate-x-0.5'}"
            ></span>
          </button>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="mb-8 flex flex-wrap gap-4">
      <button
        class="px-6 py-3 backdrop-blur-xl bg-indigo-600/30 hover:bg-indigo-600/40 rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-500/30 shadow-lg hover:shadow-xl hover:shadow-indigo-500/20 hover:scale-105 active:scale-95 text-white flex items-center gap-2"
        onclick={triggerBackup}
        disabled={loading}
      >
        <Camera size={18} class={loading ? 'animate-pulse' : ''} />
        {loading ? 'Creating...' : 'Create Snapshot'}
      </button>
      <button
        class="px-6 py-3 backdrop-blur-xl bg-blue-600/30 hover:bg-blue-600/40 rounded-2xl font-semibold transition-all duration-300 border border-blue-500/30 shadow-lg hover:shadow-xl hover:shadow-blue-500/20 hover:scale-105 active:scale-95 text-white flex items-center gap-2"
        onclick={manualRefresh}
      >
        <RefreshCw size={18} />
        Refresh
      </button>
    </div>

    <!-- Containers Grid -->
    <div class="mb-12">
      <div class="mb-6 flex flex-col md:flex-row items-start md:items-center gap-4">
        <h2 class="text-2xl md:text-3xl font-bold backdrop-blur-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl px-6 py-4 border border-indigo-400/30 shadow-xl shadow-indigo-900/30 text-white">
          Containers
        </h2>

        <!-- Search and Filter -->
        <div class="flex-1 flex flex-wrap gap-3">
          <!-- Search -->
          <div class="flex-1 min-w-[200px] relative">
            <Search size={18} class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              bind:value={searchQuery}
              placeholder="Search containers..."
              class="w-full pl-11 pr-4 py-2.5 backdrop-blur-xl bg-white/10 rounded-2xl text-white placeholder-gray-400 border border-white/20 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
            />
          </div>

          <!-- Filter Buttons -->
          <div class="flex gap-2">
            <button
              onclick={() => (filterState = 'all')}
              class="px-4 py-2.5 backdrop-blur-xl rounded-2xl font-semibold transition-all duration-300 border text-sm {filterState ===
              'all'
                ? 'bg-indigo-600/40 border-indigo-500/50 text-white'
                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}"
            >
              All
            </button>
            <button
              onclick={() => (filterState = 'running')}
              class="px-4 py-2.5 backdrop-blur-xl rounded-2xl font-semibold transition-all duration-300 border text-sm {filterState ===
              'running'
                ? 'bg-emerald-600/40 border-emerald-500/50 text-white'
                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}"
            >
              Running
            </button>
            <button
              onclick={() => (filterState = 'offline')}
              class="px-4 py-2.5 backdrop-blur-xl rounded-2xl font-semibold transition-all duration-300 border text-sm {filterState ===
              'offline'
                ? 'bg-red-600/40 border-red-500/50 text-white'
                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}"
            >
              Offline
            </button>
          </div>
        </div>
      </div>

      {#if initialLoading || !sys.hasInitialData}
        <!-- Loading Skeletons -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each Array(6) as _, i}
            <ContainerSkeleton />
          {/each}
        </div>
      {:else if filteredContainers().length === 0}
        <!-- Empty State -->
        <div class="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] rounded-3xl p-12 border border-white/[0.15] shadow-2xl shadow-black/50 text-center">
          <div class="flex justify-center mb-4">
            <Box size={64} class="text-gray-500" />
          </div>
          <h3 class="text-2xl font-bold mb-2 text-gray-200">
            {searchQuery ? 'No containers found' : 'No containers'}
          </h3>
          <p class="text-gray-400">
            {searchQuery
              ? `No containers match "${searchQuery}"`
              : 'No containers are currently available'}
          </p>
          {#if searchQuery}
            <button
              onclick={() => (searchQuery = '')}
              class="mt-4 px-6 py-2.5 backdrop-blur-xl bg-indigo-600/30 hover:bg-indigo-600/40 rounded-2xl font-semibold transition-all duration-300 border border-indigo-500/30 text-white"
            >
              Clear Search
            </button>
          {/if}
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each filteredContainers() as container, i (container.id)}
            {@const stats = sys.getContainerStats(container.id)}
            <div
              class="group backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] rounded-3xl p-6 border border-white/[0.15] shadow-2xl shadow-black/50 hover:border-white/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl hover:shadow-black/60 animate-fade-in"
              style="animation-delay: {i * 50}ms"
            >
              <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                  <h3 class="font-bold text-lg md:text-xl mb-1 {getStatusColor(container.state)} drop-shadow-lg">
                    {container.name}
                  </h3>
                  <p class="text-xs text-gray-400 flex items-center gap-1.5">
                    <Clock size={14} class="flex-shrink-0" />
                    <span>{container.status}</span>
                  </p>
                </div>
                <span
                  class="text-xs px-3 py-1.5 rounded-full backdrop-blur-md bg-white/5 border border-white/10 font-semibold {getStatusColor(
                    container.state
                  )}"
                >
                  {container.state}
                </span>
              </div>

              <div class="mt-4 space-y-3 text-sm backdrop-blur-md bg-gradient-to-br from-white/[0.07] to-white/[0.02] rounded-2xl p-4 border border-white/10">
                <div class="text-gray-300 truncate text-xs" title={container.image}>
                  <span class="text-gray-500 font-medium">Image:</span> <span class="font-mono">{container.image}</span>
                </div>
                <div class="text-gray-300 text-xs">
                  <span class="text-gray-500 font-medium">Ports:</span>
                  <span class="font-mono">{container.ports.length > 0 ? container.ports.join(', ') : 'None'}</span>
                </div>
                <div class="mt-3 pt-3 border-t border-white/10 space-y-3">
                  <ProgressBar value={stats.cpu} max={100} label="CPU" unit="%" />
                  {#if stats.memory > 0}
                    <div class="flex justify-between items-center">
                      <span class="text-xs font-medium text-gray-400">Memory</span>
                      <span class="text-xs font-mono font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                        {formatBytes(stats.memory)}
                      </span>
                    </div>
                  {/if}
                </div>
              </div>

              {#if container.state === 'running'}
                <button
                  class="mt-4 w-full px-4 py-2.5 backdrop-blur-xl bg-gradient-to-r from-orange-500/30 to-rose-500/30 hover:from-orange-500/40 hover:to-rose-500/40 rounded-2xl text-sm font-semibold transition-all duration-300 border border-orange-400/30 shadow-lg hover:shadow-xl hover:shadow-orange-500/30 hover:scale-105 active:scale-95 text-white flex items-center justify-center gap-2"
                  onclick={() => openRestartDialog(container.id, container.name)}
                >
                  <RotateCw size={16} />
                  Restart
                </button>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Backups List -->
    <div>
      <h2 class="text-2xl md:text-3xl font-bold mb-6 backdrop-blur-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl px-6 py-4 border border-blue-400/30 shadow-xl shadow-blue-900/30 inline-block text-white">
        Backups
      </h2>
      <div class="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] rounded-3xl overflow-hidden border border-white/[0.15] shadow-2xl shadow-black/50 hover:border-white/30 transition-all duration-300">
        {#if backups.length === 0}
          <div class="p-12 text-center">
            <div class="flex justify-center mb-4">
              <HardDrive size={64} class="text-gray-500" />
            </div>
            <h3 class="text-xl font-bold mb-2 text-gray-200">No backups yet</h3>
            <p class="text-gray-400 mb-4">Create your first snapshot to get started</p>
            <button
              class="inline-flex items-center gap-2 px-6 py-2.5 backdrop-blur-xl bg-indigo-600/30 hover:bg-indigo-600/40 rounded-2xl font-semibold transition-all duration-300 border border-indigo-500/30 text-white"
              onclick={triggerBackup}
              disabled={loading}
            >
              <Camera size={18} class={loading ? 'animate-pulse' : ''} />
              {loading ? 'Creating...' : 'Create First Backup'}
            </button>
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="backdrop-blur-md bg-black/30 border-b border-white/10">
                <tr>
                  <th class="px-6 py-4 text-left font-semibold text-gray-200">Filename</th>
                  <th class="px-6 py-4 text-left font-semibold text-gray-200">Size</th>
                  <th class="px-6 py-4 text-left font-semibold text-gray-200">Status</th>
                  <th class="px-6 py-4 text-left font-semibold text-gray-200">Created</th>
                  <th class="px-6 py-4 text-left font-semibold text-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each backups as backup, i (backup.id)}
                  <tr
                    class="border-b border-white/5 hover:bg-white/5 transition-colors duration-200 animate-fade-in"
                    style="animation-delay: {i * 30}ms"
                  >
                    <td class="px-6 py-4 font-mono text-sm text-gray-300">{backup.filename}</td>
                    <td class="px-6 py-4 font-mono text-sm text-gray-300">
                      {formatBytes(backup.sizeBytes)}
                    </td>
                    <td class="px-6 py-4">
                      <span
                        class="text-xs px-3 py-1 rounded-full backdrop-blur-md border font-semibold {backup.status ===
                        'completed'
                          ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400'
                          : backup.status === 'processing'
                            ? 'bg-amber-600/20 border-amber-500/30 text-amber-400'
                            : backup.status === 'failed'
                              ? 'bg-red-600/20 border-red-500/30 text-red-400'
                              : 'bg-gray-600/20 border-gray-500/30 text-gray-400'}"
                      >
                        {backup.status}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-400">{formatDate(backup.createdAt)}</td>
                    <td class="px-6 py-4">
                      {#if backup.status === 'completed'}
                        <a
                          href={api.getBackupDownloadUrl(backup.filename)}
                          class="inline-flex items-center gap-2 px-4 py-2 backdrop-blur-md bg-blue-600/30 hover:bg-blue-600/40 rounded-xl text-sm font-semibold transition-all duration-300 border border-blue-500/30 shadow-lg hover:shadow-xl hover:shadow-blue-500/20 hover:scale-105 active:scale-95 text-white"
                          download
                        >
                          <Download size={16} />
                          Download
                        </a>
                      {:else if backup.status === 'processing'}
                        <span class="inline-block px-4 py-2 text-sm text-gray-500">Processing...</span>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<!-- Confirmation Dialog -->
<ConfirmDialog
  bind:open={confirmDialog.open}
  title="Restart Container"
  message="Are you sure you want to restart {confirmDialog.containerName}? This will temporarily stop the container."
  confirmText="Restart"
  cancelText="Cancel"
  variant="warning"
  onConfirm={confirmRestart}
  onCancel={() => {}}
/>

<style>
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in {
    animation: fade-in 0.4s ease-out forwards;
    opacity: 0;
  }
</style>

