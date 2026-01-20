import { defineStore } from 'pinia'
import { friends as staticFriends } from '../data'
import { loadMarkdownContent } from '../utils/markdownLoader'

export const useFriendsStore = defineStore('friends', {
  state: () => ({
    friends: [],
    loading: false,
    error: null
  }),
  actions: {
    async fetchFriends() {
      this.loading = true
      try {
        const mdFriends = await loadMarkdownContent('friends')
        
        // 合并静态数据和 Markdown 数据
        const allFriends = [...mdFriends]
        staticFriends.forEach(sf => {
          if (!allFriends.some(f => f.url === sf.url)) {
            allFriends.push(sf)
          }
        })

        this.friends = allFriends
      } catch (err) {
        this.error = '无法获取友情链接'
        console.error('Fetch friends error:', err)
      } finally {
        this.loading = false
      }
    }
  }
})
