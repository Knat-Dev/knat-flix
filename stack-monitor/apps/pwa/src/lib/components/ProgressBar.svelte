<script lang="ts">
  interface Props {
    value: number;
    max?: number;
    label?: string;
    unit?: string;
    color?: 'blue' | 'emerald' | 'amber' | 'red';
  }

  let { value, max = 100, label, unit = '%', color = 'blue' }: Props = $props();

  const percentage = $derived(max > 0 ? Math.min((value / max) * 100, 100) : 0);

  function getColorClasses(color: Props['color'], percentage: number): string {
    // Auto-detect color based on percentage if using default
    if (color === 'blue') {
      if (percentage >= 90) return 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/60';
      if (percentage >= 75) return 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/60';
      if (percentage >= 50) return 'bg-gradient-to-r from-emerald-500 to-green-500 shadow-emerald-500/60';
      return 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-blue-500/60';
    }

    switch (color) {
      case 'emerald':
        return 'bg-gradient-to-r from-emerald-500 to-green-500 shadow-emerald-500/60';
      case 'amber':
        return 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/60';
      case 'red':
        return 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/60';
      default:
        return 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-blue-500/60';
    }
  }

  const barColorClass = $derived(getColorClasses(color, percentage));
</script>

<div class="w-full">
  {#if label}
    <div class="flex justify-between items-center mb-1.5">
      <span class="text-xs font-medium text-gray-400">{label}</span>
      <span class="text-xs font-mono font-bold text-gray-300">
        {value.toFixed(1)}{unit}
      </span>
    </div>
  {/if}
  <div class="relative h-2.5 bg-white/[0.08] rounded-full overflow-hidden backdrop-blur-sm border border-white/[0.05]">
    <div
      class="absolute inset-y-0 left-0 {barColorClass} rounded-full transition-all duration-700 ease-out shadow-lg"
      style="width: {percentage}%"
    >
      <div class="absolute inset-0 bg-gradient-to-r from-white/30 via-white/10 to-transparent animate-shimmer"></div>
    </div>
  </div>

  <style>
    @keyframes shimmer {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
    }

    .animate-shimmer {
      animation: shimmer 2s infinite;
    }
  </style>
</div>
