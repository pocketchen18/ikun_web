import { defineStore } from 'pinia'
import { posts as staticPosts } from '../data'
import { loadPosts } from '../utils/markdownLoader'

export const usePostStore = defineStore('posts', {
  state: () => ({
    posts: [],
    loading: false,
    error: null
  }),
  actions: {
    async fetchPosts() {
      this.loading = true
      try {
        // 加载文件夹中的 Markdown 博客
        const mdPosts = await loadPosts()
        
        // 合并静态数据和 Markdown 文件夹数据
        // 优先使用 Markdown 文件夹中的数据，如果 slug 相同
        const allPosts = [...mdPosts]
        
        staticPosts.forEach(staticPost => {
          if (!allPosts.some(p => p.slug === staticPost.slug)) {
            allPosts.push(staticPost)
          }
        })

        this.posts = allPosts.sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
      } catch (err) {
        this.error = '无法获取博客列表'
        console.error('Fetch posts error:', err)
      } finally {
        this.loading = false
      }
    }
  }
})
