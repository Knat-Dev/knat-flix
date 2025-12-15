<script lang="ts">
  import { toast, type Toast } from '$lib/toast.svelte';

  function getToastStyles(type: Toast['type']) {
    switch (type) {
      case 'success':
        return 'bg-emerald-600/90 border-emerald-500/50 text-white';
      case 'error':
        return 'bg-red-600/90 border-red-500/50 text-white';
      case 'warning':
        return 'bg-amber-600/90 border-amber-500/50 text-white';
      case 'info':
      default:
        return 'bg-blue-600/90 border-blue-500/50 text-white';
    }
  }

  function getIcon(type: Toast['type']) {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  }
</script>

<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
  {#each toast.toasts as t (t.id)}
    <div
      class="pointer-events-auto backdrop-blur-xl {getToastStyles(
        t.type
      )} rounded-2xl px-5 py-3.5 border shadow-2xl min-w-[280px] max-w-md animate-slide-in-right flex items-center gap-3"
      role="alert"
    >
      <span class="text-2xl font-bold flex-shrink-0">{getIcon(t.type)}</span>
      <p class="text-sm font-medium flex-1">{t.message}</p>
      <button
        onclick={() => toast.dismiss(t.id)}
        class="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity text-xl leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  {/each}
</div>

<style>
  @keyframes slide-in-right {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .animate-slide-in-right {
    animation: slide-in-right 0.3s ease-out;
  }
</style>
