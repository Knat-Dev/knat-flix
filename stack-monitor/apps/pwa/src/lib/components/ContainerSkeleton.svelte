<div
  class="backdrop-blur-xl bg-black/20 rounded-3xl p-6 border border-white/10 shadow-2xl shadow-black/50 animate-pulse"
>
  <div class="flex items-start justify-between mb-4">
    <div class="flex-1">
      <div class="h-6 bg-white/10 rounded-lg w-32 mb-2"></div>
      <div class="h-4 bg-white/5 rounded w-24"></div>
    </div>
    <div class="h-6 w-16 bg-white/10 rounded-full"></div>
  </div>

  <div class="mt-4 space-y-2 backdrop-blur-md bg-black/20 rounded-2xl p-4 border border-white/5">
    <div class="h-3 bg-white/5 rounded w-full"></div>
    <div class="h-3 bg-white/5 rounded w-3/4"></div>
    <div class="mt-3 pt-3 border-t border-white/10 space-y-2">
      <div class="h-3 bg-white/5 rounded w-1/2"></div>
      <div class="h-3 bg-white/5 rounded w-1/2"></div>
    </div>
  </div>

  <div class="mt-4 h-10 bg-white/5 rounded-2xl"></div>
</div>

<style>
  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
</style>
