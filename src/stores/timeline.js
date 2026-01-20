import { defineStore } from 'pinia'
import { timeline } from '../data'

export const useTimelineStore = defineStore('timeline', {
  state: () => ({
    timeline: [],
    loading: false,
    error: null
  }),
  actions: {
    async fetchTimeline() {
      this.loading = true
      try {
        // 模拟 API 延迟
        await new Promise(resolve => setTimeout(resolve, 500))
        this.timeline = timeline
      } catch (err) {
        this.error = '获取经历失败'
        console.error(err)
      } finally {
        this.loading = false
      }
    }
  }
})
