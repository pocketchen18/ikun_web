export async function loadMarkdownContent(directory) {
  let modules;
  if (directory === 'posts') {
    modules = import.meta.glob('../content/posts/*.md', { eager: true, query: '?raw', import: 'default' });
  } else if (directory === 'projects') {
    modules = import.meta.glob('../content/projects/*.md', { eager: true, query: '?raw', import: 'default' });
  } else if (directory === 'friends') {
    modules = import.meta.glob('../content/friends/*.md', { eager: true, query: '?raw', import: 'default' });
  } else {
    return [];
  }

  const items = Object.keys(modules).map((path) => {
    const rawContent = modules[path];
    
    // 简单的前端解析逻辑 (不依赖 Buffer)
    const frontmatterRegex = /^---\s*\r?\n([\s\S]+?)\r?\n---\s*\r?\n?([\s\S]*)$/;
    const match = rawContent.match(frontmatterRegex);
    
    let data = {};
    let body = rawContent;

    if (match) {
      const yamlStr = match[1];
      body = match[2].trim();
      
      yamlStr.split('\n').forEach(line => {
        const firstColonIndex = line.indexOf(':');
        if (firstColonIndex !== -1) {
          const key = line.substring(0, firstColonIndex).trim();
          const value = line.substring(firstColonIndex + 1).trim().replace(/^["']|["']$/g, '');
          
          if (key === 'tags') {
            try {
              data[key] = JSON.parse(value.replace(/'/g, '"'));
            } catch (e) {
              data[key] = value.replace(/[\[\]]/g, '').split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
            }
          } else if (key === 'is_featured') {
            data[key] = value === 'true' || value === '1';
          } else {
            data[key] = value;
          }
        }
      });
    }
    
    const slug = path.split('/').pop().replace('.md', '');

    if (directory === 'posts') {
      return {
        id: slug,
        slug: slug,
        title: data.title || '无标题',
        published_at: data.date || new Date().toISOString(),
        excerpt: data.excerpt || '',
        content_md: body,
        cover_url: data.cover_url || '',
        tags: (data.tags || []).map((tag, index) => ({ id: index, name: tag }))
      };
    } else if (directory === 'projects') {
      return {
        id: slug,
        title: data.title || '无标题',
        summary: data.summary || '',
        description: body || data.description || '',
        cover_url: data.cover_url || '',
        demo_url: data.demo_url || '',
        repo_url: data.repo_url || '',
        client: data.client || '',
        role: data.role || '',
        result_metric: data.result_metric || '',
        start_date: data.start_date || '',
        end_date: data.end_date || '',
        is_featured: data.is_featured || false,
        tags: (data.tags || []).map((tag, index) => ({ id: index, name: tag }))
      };
    } else if (directory === 'friends') {
      return {
        name: data.name || slug,
        url: data.url || '#',
        description: data.description || body || '',
        avatar: data.avatar || ''
      };
    }
  });

  return items;
}

// 保持向下兼容
export async function loadPosts() {
  const posts = await loadMarkdownContent('posts');
  return posts.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
}
