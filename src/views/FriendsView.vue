<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useFriendsStore } from '../stores/friends'
import BlurFade from '../components/BlurFade.vue'

const friendsStore = useFriendsStore()
const { friends } = storeToRefs(friendsStore)

const BLUR_FADE_DELAY = 0.04

onMounted(() => {
  friendsStore.fetchFriends()
})
</script>

<template>
  <div class="friends-container space-y-10">
    <section id="friends-header">
      <BlurFade :delay="BLUR_FADE_DELAY">
        <div class="flex flex-col items-center justify-center space-y-4 text-center mb-10">
          <div class="space-y-2">
            <div class="inline-block rounded-lg bg-foreground text-background px-3 py-1 text-sm">
              Friends
            </div>
            <h2 class="text-3xl font-bold tracking-tighter sm:text-5xl">友情链接</h2>
            <p class="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed max-w-[600px]">
              志同道合的朋友们以及一些好用的工具。
            </p>
          </div>
        </div>
      </BlurFade>
    </section>

    <section id="friends-grid">
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        <BlurFade 
          v-for="(friend, id) in friends" 
          :key="friend.name"
          :delay="BLUR_FADE_DELAY * 2 + id * 0.05"
        >
          <a 
            :href="friend.url" 
            target="_blank"
            class="flex flex-col items-center p-4 rounded-xl border bg-card hover:shadow-md transition-all duration-300 group h-full"
          >
            <div class="w-16 h-16 rounded-full overflow-hidden mb-4 border-2 border-muted group-hover:border-primary group-hover:scale-110 transition-all duration-300 flex items-center justify-center bg-muted">
              <img 
                v-if="friend.avatar"
                :src="friend.avatar" 
                :alt="friend.name" 
                @error="(e) => e.target.src = '/logo.png'"
                class="w-full h-full object-cover"
              >
              <span v-else class="text-xl font-bold text-muted-foreground">{{ friend.name.charAt(0) }}</span>
            </div>
            <span class="font-bold text-base text-center line-clamp-1 group-hover:text-primary transition-colors">{{ friend.name }}</span>
            <p class="text-xs text-muted-foreground text-center line-clamp-2 mt-2 h-8 leading-relaxed">{{ friend.description }}</p>
          </a>
        </BlurFade>
      </div>
    </section>
  </div>
</template>

<style scoped>
.friends-container {
  max-width: 800px;
  margin: 0 auto;
}
</style>
