import { defineStore } from 'pinia'
import { skills } from '../data'

export const useSkillStore = defineStore('skill', {
  state: () => ({
    skills: [],
    loading: false,
    error: null
  }),
  actions: {
    async fetchSkills() {
      this.loading = true
      try {
        // 模拟 API 延迟
        await new Promise(resolve => setTimeout(resolve, 500))
        this.skills = skills
      } catch (err) {
        this.error = '获取技能失败'
        console.error(err)
      } finally {
        this.loading = false
      }
    }
  }
})
