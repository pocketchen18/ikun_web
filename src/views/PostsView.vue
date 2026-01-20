<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { usePostStore } from '../stores/posts'
import BlurFade from '../components/BlurFade.vue'

const postStore = usePostStore()

const { posts, loading, error } = storeToRefs(postStore)

const BLUR_FADE_DELAY = 0.04

onMounted(() => {
  postStore.fetchPosts()
})

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<template>
  <div class="posts-container space-y-20">
    <section id="posts-list">
      <BlurFade :delay="BLUR_FADE_DELAY">
        <h1>个人博客</h1>
      </BlurFade>
      
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else-if="posts.length === 0" class="no-posts">
        暂无已发布的博客。
      </div>
      
      <div v-else class="posts-list">
        <BlurFade 
          v-for="(post, index) in posts" 
          :key="post.id" 
          :delay="BLUR_FADE_DELAY + index * 0.05"
        >
          <article class="post-item">
            <div v-if="post.cover_url" class="post-cover">
              <img :src="post.cover_url" :alt="post.title">
            </div>
            <div class="post-content">
              <h2>
                <router-link :to="'/posts/' + post.slug">{{ post.title }}</router-link>
              </h2>
              <div class="post-meta">
                <span class="date">{{ formatDate(post.published_at) }}</span>
              </div>
              <p class="excerpt">{{ post.excerpt }}</p>
              <router-link :to="'/posts/' + post.slug" class="read-more">阅读更多 →</router-link>
            </div>
          </article>
        </BlurFade>
      </div>
    </section>
  </div>
</template>

<style scoped>
.posts-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  text-align: left;
}

h1 {
  text-align: center;
  margin-bottom: 3rem;
  color: #2c3e50;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.post-item {
  display: flex;
  gap: 1.5rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 2rem;
}

.post-cover {
  flex: 0 0 250px;
}

.post-cover img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
}

.post-content {
  flex: 1;
}

.post-content h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.post-content h2 a {
  color: #2c3e50;
  text-decoration: none;
}

.post-content h2 a:hover {
  color: #42b983;
}

.post-meta {
  font-size: 0.9rem;
  color: #888;
  margin-bottom: 1rem;
}

.excerpt {
  color: #666;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.read-more {
  color: #42b983;
  text-decoration: none;
  font-weight: bold;
}

.loading, .error, .no-posts {
  text-align: center;
  padding: 3rem;
  color: #666;
}

@media (max-width: 600px) {
  .post-item {
    flex-direction: column;
  }
  .post-cover {
    flex: 0 0 auto;
  }
}
</style>
