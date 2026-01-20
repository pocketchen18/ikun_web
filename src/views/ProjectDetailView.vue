<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useProjectStore } from '../stores/projects'
import { marked } from 'marked'

const route = useRoute()
const projectStore = useProjectStore()
const { projects } = storeToRefs(projectStore)
const project = ref(null)
const loading = ref(true)
const error = ref(null)

const renderedDescription = computed(() => {
  if (project.value && project.value.description) {
    return marked(project.value.description)
  }
  return ''
})

const fetchProject = async () => {
  try {
    loading.value = true
    const id = route.params.id
    
    if (projects.value.length === 0) {
      await projectStore.fetchProjects()
    }

    const foundProject = projects.value.find(p => p.id === id || p.id === parseInt(id))
    if (foundProject) {
      project.value = foundProject
    } else {
      error.value = '未找到该项目'
    }
  } catch (err) {
    console.error('Failed to fetch project:', err)
    error.value = '获取作品详情失败'
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return '进行中'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long'
  })
}

onMounted(fetchProject)
</script>

<template>
  <div class="project-detail-container">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="project" class="project-detail">
      <router-link to="/projects" class="back-link">← 返回作品集</router-link>
      
      <header class="project-header">
        <h1>{{ project.title }}</h1>
        <div class="project-meta">
          <span class="client" v-if="project.client">客户: {{ project.client }}</span>
          <span class="role" v-if="project.role"> | 角色: {{ project.role }}</span>
          <span class="date"> | {{ formatDate(project.start_date) }} - {{ formatDate(project.end_date) }}</span>
        </div>
        <div class="project-tags" v-if="project.tags && project.tags.length">
          <span v-for="tag in project.tags" :key="tag.id" class="tag">{{ tag.name }}</span>
        </div>
      </header>

      <div v-if="project.cover_url" class="project-cover">
        <img :src="project.cover_url" :alt="project.title">
      </div>

      <div class="project-body">
        <section class="section">
          <h2>项目简介</h2>
          <p>{{ project.summary }}</p>
        </section>

        <section class="section">
          <h2>详细描述</h2>
          <div class="description-text markdown-body" v-html="renderedDescription"></div>
        </section>

        <section class="section" v-if="project.result_metric">
          <h2>成果指标</h2>
          <div class="metric-card">{{ project.result_metric }}</div>
        </section>

        <div class="project-links">
          <a v-if="project.demo_url" :href="project.demo_url" target="_blank" class="btn-link demo">访问项目</a>
          <a v-if="project.repo_url" :href="project.repo_url" target="_blank" class="btn-link repo">查看源码</a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.project-detail-container {
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
  font-weight: 600;
}

.project-header h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.project-meta {
  color: #888;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.project-tags {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.tag {
  background: #f0f0f0;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  color: #666;
}

.project-cover {
  margin-bottom: 3rem;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.project-cover img {
  width: 100%;
  display: block;
}

.section {
  margin-bottom: 2.5rem;
}

.section h2 {
  font-size: 1.5rem;
  border-left: 4px solid #42b883;
  padding-left: 1rem;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.description-text {
  line-height: 1.8;
  color: #444;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3) {
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  font-weight: bold;
}

.markdown-body :deep(p) {
  margin-bottom: 1rem;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin-bottom: 1rem;
  padding-left: 1.25rem;
}

.markdown-body :deep(ul) { list-style-type: disc; }
.markdown-body :deep(ol) { list-style-type: decimal; }

.markdown-body :deep(code) {
  background: #f0f0f0;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-family: monospace;
}

.metric-card {
  background: #f0faf5;
  border: 1px solid #c8e6c9;
  padding: 1.5rem;
  border-radius: 8px;
  color: #2e7d32;
  font-weight: 600;
}

.project-links {
  display: flex;
  gap: 1rem;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #eee;
}

.btn-link {
  padding: 0.75rem 2rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-link.demo {
  background: #42b883;
  color: white;
}

.btn-link.repo {
  background: #333;
  color: white;
}

.btn-link:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

.loading, .error {
  text-align: center;
  padding: 4rem;
  color: #999;
}
</style>
