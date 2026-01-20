import { defineStore } from 'pinia'
import { projects as staticProjects } from '../data'
import { loadMarkdownContent } from '../utils/markdownLoader'

export const useProjectStore = defineStore('project', {
  state: () => ({
    projects: [],
    loading: false,
    error: null
  }),
  actions: {
    async fetchProjects() {
      this.loading = true
      try {
        const mdProjects = await loadMarkdownContent('projects')
        
        // 合并静态数据和 Markdown 数据
        const allProjects = [...mdProjects]
        staticProjects.forEach(sp => {
          if (!allProjects.some(p => p.id === sp.id)) {
            allProjects.push(sp)
          }
        })

        this.projects = allProjects
      } catch (err) {
        this.error = '获取作品失败'
        console.error(err)
      } finally {
        this.loading = false
      }
    }
  }
})
