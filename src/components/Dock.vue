<script setup>
import { useProfileStore } from '../stores/profile'
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'

const profileStore = useProfileStore()
const { profile } = storeToRefs(profileStore)

onMounted(() => {
  if (!profile.value) {
    profileStore.fetchProfile()
  }
})

const navItems = [
  { 
    name: '首页', 
    path: '/', 
    icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>` 
  },
  { 
    name: '作品', 
    path: '/projects', 
    icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>` 
  },
  { 
    name: '博客', 
    path: '/posts', 
    icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>` 
  },
  { 
    name: '关于', 
    path: '/about', 
    icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>` 
  },
  { 
    name: '友链', 
    path: '/friends', 
    icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>` 
  },
]
</script>

<template>
  <header class="fixed top-0 left-0 right-0 z-[9999] bg-white/70 dark:bg-black/70 backdrop-blur-md border-b border-gray-100 dark:border-gray-900">
    <div class="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
      <!-- Left: Brand -->
      <div class="flex items-center">
        <router-link to="/" class="text-lg font-bold tracking-tight hover:opacity-70 transition-opacity cool-text">
          {{ profile?.display_name?.split(' ')[0] || 'ikun' }}
        </router-link>
      </div>

      <!-- Center: Navigation Links -->
      <nav class="hidden sm:flex items-center gap-8">
        <router-link 
          v-for="item in navItems" 
          :key="item.path" 
          :to="item.path"
          class="flex items-center gap-2 text-[14px] font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          active-class="text-gray-900 dark:text-white"
        >
          <span v-html="item.icon" class="opacity-70"></span>
          <span>{{ item.name }}</span>
        </router-link>
      </nav>

      <!-- Right: Social Icons -->
      <div class="flex items-center gap-6">
        <div class="hidden md:flex items-center gap-4 text-gray-400 dark:text-gray-500">
          <a :href="profile?.github || 'https://github.com'" target="_blank" class="hover:text-gray-900 dark:hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          </a>
        </div>
      </div>
    </div>
  </header>
</template>
