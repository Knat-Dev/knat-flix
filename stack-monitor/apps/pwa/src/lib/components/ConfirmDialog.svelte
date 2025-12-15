<script lang="ts">
  interface Props {
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'warning' | 'info';
  }

  let {
    open = $bindable(),
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    variant = 'info',
  }: Props = $props();

  function handleConfirm() {
    onConfirm();
    open = false;
  }

  function handleCancel() {
    onCancel();
    open = false;
  }

  function getVariantStyles() {
    switch (variant) {
      case 'danger':
        return 'border-red-500/30 bg-red-600/30 hover:bg-red-600/40';
      case 'warning':
        return 'border-amber-500/30 bg-amber-600/30 hover:bg-amber-600/40';
      default:
        return 'border-blue-500/30 bg-blue-600/30 hover:bg-blue-600/40';
    }
  }
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    onclick={handleCancel}
    role="presentation"
  >
    <div
      class="backdrop-blur-xl bg-black/40 rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl max-w-md w-full animate-scale-in"
      onclick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      <h3 class="text-2xl font-bold mb-3 text-white">{title}</h3>
      <p class="text-gray-300 mb-6">{message}</p>
      <div class="flex gap-3 justify-end">
        <button
          onclick={handleCancel}
          class="px-5 py-2.5 backdrop-blur-xl bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-all duration-300 border border-white/20 text-white"
        >
          {cancelText}
        </button>
        <button
          onclick={handleConfirm}
          class="px-5 py-2.5 backdrop-blur-xl {getVariantStyles()} rounded-xl font-semibold transition-all duration-300 border shadow-lg text-white"
        >
          {confirmText}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes scale-in {
    from {
      transform: scale(0.95);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  .animate-fade-in {
    animation: fade-in 0.2s ease-out;
  }

  .animate-scale-in {
    animation: scale-in 0.2s ease-out;
  }
</style>
