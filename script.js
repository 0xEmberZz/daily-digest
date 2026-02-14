// 获取最新日报
async function loadLatestDigest() {
    const loading = document.getElementById('loading');
    const content = document.getElementById('content');
    const error = document.getElementById('error');

    try {
        // 查找 digests 目录下最新的日报文件
        const response = await fetch('./digests/latest.md');
        
        if (!response.ok) {
            throw new Error('Failed to load digest');
        }

        const markdown = await response.text();
        
        // 使用 marked.js 渲染 Markdown
        content.innerHTML = marked.parse(markdown);
        
        loading.style.display = 'none';
        content.style.display = 'block';
        
        // 平滑滚动到锚点
        if (window.location.hash) {
            setTimeout(() => {
                const element = document.querySelector(window.location.hash);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        }
        
    } catch (err) {
        console.error('Error loading digest:', err);
        loading.style.display = 'none';
        error.style.display = 'block';
    }
}

// 页面加载时执行
document.addEventListener('DOMContentLoaded', loadLatestDigest);
