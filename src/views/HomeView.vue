<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useProfileStore } from '../stores/profile'
import BlurFade from '../components/BlurFade.vue'
import Meteors from '../components/Meteors.vue'
import Globe from '../components/Globe.vue'

const profileStore = useProfileStore()
const { profile } = storeToRefs(profileStore)

const BLUR_FADE_DELAY = 0.04

onMounted(() => {
  profileStore.fetchProfile()
})
</script>

<template>
  <main class="flex flex-col min-h-[100dvh] space-y-10 pb-20">
    <!-- Hero Section -->
    <section id="hero" class="relative overflow-hidden py-10 -mx-4 px-4 rounded-lg">
      <Meteors :number="50" />
      <div class="mx-auto w-full max-w-4xl space-y-8 relative z-10">
        <div class="gap-2 flex">
          <div class="flex-col flex flex-1 space-y-1.5 text-left">
            <BlurFade :delay="BLUR_FADE_DELAY">
              <h1 class="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                Hi, I'm <span class="cool-text">{{ profile?.display_name?.split(' ')[0] || 'ikun' }}</span> 👋
              </h1>
            </BlurFade>
            <BlurFade :delay="BLUR_FADE_DELAY * 2">
              <p class="max-w-[600px] md:text-xl text-muted-foreground">
                欢迎来到我的个人网站
              </p>
            </BlurFade>
          </div>
        </div>
      </div>
    </section>

    <!-- Globe Section -->
    <section id="globe" class="flex items-center justify-center py-5 overflow-visible">
      <BlurFade :delay="BLUR_FADE_DELAY * 2.5">
        <div class="relative flex h-[400px] w-[400px] items-center justify-center overflow-visible">
          <Globe />
        </div>
      </BlurFade>
    </section>
  </main>
</template>

<style>
/* Additional specific styles if needed */
</style>
