<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectStore } from '../stores/projects'
import BlurFade from '../components/BlurFade.vue'

const projectStore = useProjectStore()
const { projects, loading, error } = storeToRefs(projectStore)

const BLUR_FADE_DELAY = 0.04

onMounted(() => {
  projectStore.fetchProjects()
})
</script>

<template>
  <div class="projects-container">
    <BlurFade :delay="BLUR_FADE_DELAY">
      <h1>我的作品集</h1>
      <p class="subtitle">展示我的一些个人项目和实践</p>
    </BlurFade>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="project-grid">
      <BlurFade 
        v-for="(project, index) in projects" 
        :key="project.id" 
        :delay="BLUR_FADE_DELAY + index * 0.05"
      >
        <div class="project-card">
          <div class="project-image" v-if="project.cover_url">
            <img :src="project.cover_url" :alt="project.title">
          </div>
          <div class="project-info">
            <h3>{{ project.title }}</h3>
            <p class="summary">{{ project.summary }}</p>
            <div class="project-tags" v-if="project.tags && project.tags.length">
              <span v-for="tag in project.tags" :key="tag.id" class="tag">{{ tag.name }}</span>
            </div>
            <router-link :to="`/projects/${project.id}`" class="view-detail">查看详情 →</router-link>
          </div>
        </div>
      </BlurFade>
      <div v-if="projects.length === 0" class="no-data">暂无作品展示</div>
    </div>
  </div>
</template>

<style scoped>
.projects-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  text-align: left;
}

h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #666;
  margin-bottom: 3rem;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.project-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transition: transform 0.3s ease;
}

.project-card:hover {
  transform: translateY(-5px);
}

.project-image {
  height: 180px;
  overflow: hidden;
}

.project-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.project-info {
  padding: 1.5rem;
}

.project-info h3 {
  margin: 0 0 0.75rem 0;
  color: #2c3e50;
}

.summary {
  color: #666;
  font-size: 0.95rem;
  margin-bottom: 1rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.tag {
  background: #f0f4f8;
  color: #546e7a;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.view-detail {
  color: #42b883;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
}

.loading, .error, .no-data {
  text-align: center;
  padding: 3rem;
  color: #999;
}

.error {
  color: #e74c3c;
}
</style>
