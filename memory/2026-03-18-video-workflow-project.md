# 2026-03-18 AI视频制作工作流项目启动

## 事件
主人提出要做一个AI视频自动化生产工作流，这可能会是接下来几个星期的重点工作。

## 工作流设计
```
故事选取 → AI分段改造 → 文生图 → 图文生视频 → 生成字幕 → 发布视频
```

## 可行性分析
- ✅ 故事选取：公版作品 + AI原创，完全可行
- ✅ AI分段：LLM处理，成熟方案
- ✅ 文生图：Midjourney/DALL-E/SD，工具丰富
- ⚠️ 图生视频：当前瓶颈，质量不稳定
- ✅ 字幕生成：Edge TTS + Whisper，成熟方案
- ✅ 视频发布：B站/YouTube API，可自动化

## 技术栈推荐
- 编排层: OpenClaw cron / n8n
- 文本: LLM (GLM-4 / Claude)
- 图像: Midjourney API / SD WebUI
- 视频: Runway API / 可灵
- 语音/字幕: Edge TTS + Whisper
- 发布: B站 API

## 已完成
1. 创建项目目录 `projects/video-workflow/`
2. 创建项目文档 `PROJECT.md`
3. 创建进度追踪 `PROGRESS.md`
4. 更新长期记忆 `MEMORY.md`

## 下一步
- [ ] 选择试点故事
- [ ] 测试文生图API
- [ ] 测试图生视频工具