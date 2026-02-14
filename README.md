# 🍄 AI 博客每日精选 | Daily Digest

来自 Karpathy 推荐的 92 个顶级技术博客，AI 智能筛选每日科技资讯。

## 📊 特性

- ✅ **智能筛选** - Gemini AI 三维评分（相关性 + 质量 + 时效性）
- ✅ **自动分类** - 6 大类别自动归类（AI/ML、安全、工程、工具/开源、观点/杂谈、其他）
- ✅ **中文摘要** - 4-6 句结构化摘要，快速了解核心内容
- ✅ **每日更新** - 每天早上 9:00 自动生成
- ✅ **可视化统计** - Mermaid 图表 + 关键词标签云

## 🚀 技术栈

- **数据源**: 92 个 RSS 源（[Hacker News Popularity Contest 2025](https://refactoringenglish.com/tools/hn-popularity/)）
- **AI 评分**: Google Gemini API
- **运行时**: Bun
- **自动化**: OpenClaw Cron
- **部署**: Vercel

## 📂 项目结构

```
daily-digest/
├── index.html          # 主页
├── styles.css          # 样式
├── script.js           # 前端逻辑
├── digests/            # 日报存档
│   └── latest.md       # 最新日报
└── vercel.json         # Vercel 配置
```

## 🔧 本地开发

```bash
# 克隆仓库
git clone https://github.com/0xEmberZz/daily-digest.git
cd daily-digest

# 本地预览（需要 Python 或任何静态服务器）
python3 -m http.server 8000
# 或
npx serve
```

访问 `http://localhost:8000`

## 📝 更新日报

```bash
# 复制最新生成的日报到 digests/latest.md
cp /path/to/digest-YYYYMMDD.md digests/latest.md

# 提交并推送
git add .
git commit -m "Update digest YYYY-MM-DD"
git push
```

Vercel 会自动部署更新。

## 📄 许可

MIT License

---

由 [@EmberZz](https://github.com/0xEmberZz) 维护 | Powered by [OpenClaw](https://openclaw.ai)
