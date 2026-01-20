<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { usePostStore } from '../stores/posts'
import { marked } from 'marked'

const route = useRoute()
const postStore = usePostStore()
const { posts } = storeToRefs(postStore)
const post = ref(null)
const loading = ref(true)
const error = ref(null)

const renderedContent = computed(() => {
  if (post.value && post.value.content_md) {
    return marked(post.value.content_md)
  }
  return ''
})

const fetchPost = async () => {
  try {
    loading.value = true
    const slug = route.params.slug
    
    if (posts.value.length === 0) {
      await postStore.fetchPosts()
    }

    const foundPost = posts.value.find(p => p.slug === slug)
    if (foundPost) {
      post.value = foundPost
    } else {
      error.value = '未找到该博客'
    }
  } catch (err) {
    console.error('Failed to fetch post:', err)
    error.value = '获取博客详情失败'
  } finally {
    loading.value = false
  }
}

onMounted(fetchPost)

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}
</script>

<template>
  <div class="post-detail-container">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="post" class="post-detail">
      <router-link to="/posts" class="back-link">← 返回列表</router-link>
      
      <header class="post-header">
        <h1>{{ post.title }}</h1>
        <div class="post-meta">
          <span class="date">发布于 {{ formatDate(post.published_at) }}</span>
          <span v-if="post.tags && post.tags.length" class="tags">
            | 标签: <span v-for="tag in post.tags" :key="tag.id" class="tag">{{ tag.name }}</span>
          </span>
        </div>
      </header>

      <div v-if="post.cover_url" class="post-cover">
        <img :src="post.cover_url" :alt="post.title">
      </div>

      <div class="post-content">
        <div class="content-body markdown-body" v-html="renderedContent"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.post-detail-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  text-align: left;
}

.back-link {
  display: inline-block;
  margin-bottom: 2rem;
  color: #42b983;
  text-decoration: none;
}

.post-header h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.post-meta {
  color: #888;
  font-size: 0.9rem;
  margin-bottom: 2rem;
}

.tag {
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 4px;
  margin-left: 5px;
  color: #666;
}

.post-cover img {
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 2rem;
}

.post-content {
  line-height: 1.8;
  color: #333;
  font-size: 1.1rem;
}

.content-body {
  padding: 1rem 0;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3) {
  margin-top: 2rem;
  margin-bottom: 1rem;
  font-weight: bold;
}

.markdown-body :deep(h1) { font-size: 2rem; }
.markdown-body :deep(h2) { font-size: 1.5rem; }
.markdown-body :deep(h3) { font-size: 1.25rem; }

.markdown-body :deep(p) {
  margin-bottom: 1.25rem;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin-bottom: 1.25rem;
  padding-left: 1.5rem;
}

.markdown-body :deep(ul) { list-style-type: disc; }
.markdown-body :deep(ol) { list-style-type: decimal; }

.markdown-body :deep(li) {
  margin-bottom: 0.5rem;
}

.markdown-body :deep(code) {
  background: #f0f0f0;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: monospace;
}

.dark .markdown-body :deep(code) {
  background: #2d2d2d;
  color: #e0e0e0;
}

.markdown-body :deep(pre) {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 1.25rem;
}

.dark .markdown-body :deep(pre) {
  background: #1e1e1e;
}

.markdown-body :deep(pre code) {
  background: transparent;
  padding: 0;
}

.markdown-body :deep(blockquote) {
  border-left: 4px solid #ddd;
  padding-left: 1rem;
  color: #666;
  font-style: italic;
  margin-bottom: 1.25rem;
}

.dark .markdown-body :deep(blockquote) {
  border-left-color: #444;
  color: #aaa;
}

.loading, .error {
  text-align: center;
  padding: 5rem;
  color: #666;
}
</style>
