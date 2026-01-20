import { defineStore } from 'pinia'
import { profile } from '../data'

export const useProfileStore = defineStore('profile', {
  state: () => ({
    profile: null,
    loading: false,
    error: null
  }),
  actions: {
    async fetchProfile() {
      this.loading = true
      try {
        // 模拟 API 延迟
        await new Promise(resolve => setTimeout(resolve, 500))
        this.profile = profile
      } catch (err) {
        this.error = '无法获取个人信息'
        console.error('Fetch profile error:', err)
      } finally {
        this.loading = false
      }
    }
  }
})
