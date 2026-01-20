# 个人作品集网站管理指南

本项目使用 Vue 3 + Vite 构建，内容由 Markdown 文件驱动。您可以直接通过在特定目录下添加或修改 Markdown 文件来更新网站内容。

## 🖼️ 图片使用指南

如果您想在博客或作品中使用自己的照片，推荐使用以下方式：

### 1. 存放图片
将您的图片文件（如 `me.jpg`, `project-cover.png`）放入以下目录：
`public/content/images/`

### 2. 在 Markdown 中引用
在 Markdown 的元数据（Frontmatter）中，使用绝对路径引用：

```markdown
---
title: "我的文章"
cover_url: "/content/images/me.jpg"
---
```

> **注意**：路径必须以 `/` 开头，这表示从网站根目录（即 `public` 文件夹）开始查找。

---

## 🚀 内容管理

### 1. 撰写博客 (Blog Posts)
所有的博客文章都存放在 `src/content/posts/` 目录下。

- **操作方式**：在该目录下新建一个 `.md` 文件。
- **元数据 (Frontmatter)**：在文件顶部添加如下信息：
  ```markdown
  ---
  title: "文章标题"
  published_at: "2024-03-20"
  excerpt: "文章简要介绍"
  cover_url: "封面图片地址"
  ---
  ```
- **正文**：在 `---` 之后使用标准 Markdown 语法编写。

---

### 2. 发布作品 (Projects)
个人作品集存放在 `src/content/projects/` 目录下。

- **操作方式**：在该目录下新建一个 `.md` 文件。
- **元数据 (Frontmatter)**：在文件顶部添加如下信息：
  ```markdown
  ---
  title: "作品名称"
  summary: "作品简介"
  cover_url: "封面图片地址"
  demo_url: "演示地址"
  repo_url: "代码仓库地址"
  is_featured: true
  tags: ["Vue", "Tailwind"]
  ---
  ```
- **正文**：在 `---` 之后编写作品的详细介绍。

---

### 3. 增加友情链接 (Friends)
友情链接存放在 `src/content/friends/` 目录下。

- **操作方式**：在该目录下新建一个 `.md` 文件。
- **元数据 (Frontmatter)**：在文件顶部添加如下信息：
  ```markdown
  ---
  name: "好友名称"
  url: "博客/网站地址"
  description: "一句话简介"
  avatar: "头像图片地址"
  ---
  ```

---

## ⚙️ 个人信息配置

网站的基础个人信息（如姓名、GitHub 链接等）可以在 `src/data.js` 中进行修改：

- `display_name`: 首页显示的名称。
- `profile.github`: 右上角和底部的 GitHub 链接。

## 🛠️ 开发命令

```bash
# 安装依赖
npm install

# 启动本地开发服务器
npm run dev

# 构建发布版本
npm run build
```
