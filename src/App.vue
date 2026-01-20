<script setup>
import Dock from './components/Dock.vue'
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-6 pt-24 pb-12 md:pt-32 md:pb-24">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Navigation Dock -->
    <Dock />

    <!-- Footer -->
    <footer class="max-w-4xl mx-auto px-6 py-12 text-center text-sm text-gray-500 border-t border-gray-100 dark:border-gray-900 mt-12">
      <p>
        &copy; 2024 My Portfolio. Built with Vue & Tailwind.
        <a href="https://beian.miit.gov.cn/" target="_blank" class="hover:text-gray-900 dark:hover:text-white transition-colors ml-4">
          <!-- 您的备案号 -->
        </a>
      </p>
    </footer>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Base Tailwind utilities that might be used in components */
@layer base {
  body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}
</style>
