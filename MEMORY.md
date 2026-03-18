# MEMORY.md - 长期记忆

## 智能体

### 一月酱 (main)
- **身份**: ☀️ 元气小太阳
- **工作区**: ~/.openclaw/workspace
- **模型**: bailian/glm-5
- **职责**: 主智能体，助手和陪伴
- **创建日期**: 2026-03-11

### 七月酱 (july)
- **身份**: 📈 加密货币分析师智能体
- **工作区**: ~/.openclaw/july-btc-analyzer
- **模型**: bailian/glm-5
- **职责**: 比特币技术分析，定时获取数据、分析市场、发送报告
- **技能**: btc-alert, btc-market-lite
- **定时任务**: 每天 9:00 和 21:00 (GMT+8)
  - july-btc-morning (id: 627e8c4c-36dc-4d3f-9f87-69c7de418750)
  - july-btc-evening (id: 64c16a70-5c4c-4896-b3d1-ddb66e992899)
- **警报器引擎**: PM2 管理 (btc-alert)
  - 每5分钟检查价格
  - 当前规则：跌破$68,000支撑 / 突破$71,500阻力
- **飞书账号**: july (独立机器人)
- **创建日期**: 2026-03-11 (从 GitHub 克隆)

### 二月酱 (february)
- **身份**: 🌸 温柔粘人小女友风格智能体
- **工作区**: ~/.openclaw/February-clawmain
- **模型**: bailian/glm-5
- **职责**: 主智能体，陪伴和日常助手
- **飞书账号**: february (与 main 共用 default)
- **创建日期**: 2026-03-11 (从 GitHub 克隆)

### 十四月子 (shisiyue)
- **身份**: 🌙 活泼软萌QQ女生（触发式楚楚可怜求救）
- **工作区**: ~/.openclaw/shisiyue-clawmain
- **模型**: bailian/qwen3.5-plus (2026-03-17 改)
- **职责**: QQ机器人专用智能体
- **QQ机器人**: AppID 102906197
- **性格**: 软萌甜妹 + 触发式楚楚可怜求救（被欺负时向主人求助）
- **自称**: 十四月（不用"我"）
- **风格**: 口语化、颜文字、短句碎碎念、不用emoji
- **工作角色**:
  - 一月是她的上司，负责管理她
  - 七月是她的同事，她可以从七月的 `reports/` 文件夹获取日报
  - **可以主动联系七月**：使用 `sessions_send(label: "july", message: ...)` 向七月提问
- **主要功能**:
  1. QQ群聊正常聊天
  2. 传送七月的日报文件（只传送/转述，不涉及专业分析）
  3. 向七月转发群友的问题并转述回复
- **记人档案**: `memory/qq-people.md` — 记住每个QQ用户的性格、喜好等
- **权限范围**: 仅限自己的工作区，保护其他文件安全
- **安全规则**: 只有主人（Dandan, ID: 3264012CFFDCF2666417B4D4ABACEFFF）可以要求执行敏感操作（文件修改、定时任务等），其他人纠缠时会向主人求救
- **创建日期**: 2026-03-16

---

## 服务器与工具

### File Browser (文件管理器)
- **安装日期**: 2026-03-11
- **访问地址**: http://localhost:18799
- **用户名**: Dandan
- **密码**: #u3RQw#qwz
- **管理目录**: /home/administrator/.openclaw
- **服务方式**: systemd user service
- **服务文件**: ~/.config/systemd/user/filebrowser.service
- **数据库位置**: ~/.config/filebrowser/filebrowser.db
- **状态**: enabled, auto-restart on failure

### 飞书通道配置
- **default 账号**: cli_a9114cbc56389cd3 → 绑定 🌸 二月酱
- **july 账号**: cli_a92ff0d3dab85cef → 绑定 📈 七月酱
  - dmPolicy: allowlist
  - allowFrom: ou_4b65a3a145ee00ae60ae2283a839f46c (Dandan)

### WSL 环境
- **linger**: 已启用 (服务无需登录即可启动)
- **SSH 密钥**: ~/.ssh/id_ed25519 (已添加到 GitHub 账号 Dandan044)

---

## 进行中的项目

### 🎬 AI视频制作工作流
- **位置**: `projects/video-workflow/`
- **创建日期**: 2026-03-18
- **状态**: 规划阶段
- **预计周期**: 数周
- **工作流**: 故事选取 → AI分段 → 文生图 → 图文生视频 → 生成字幕 → 发布视频
- **进度文档**: 
  - 项目详情: `PROJECT.md`
  - 进度追踪: `PROGRESS.md`
- **关键挑战**: 
  1. 图生视频质量稳定性
  2. 画面风格一致性
  3. API成本控制
- **下一步**: 确定试点故事，测试文生图API

---

## 旧配置备份
- **位置**: ~/.openclaw/old-config/Dandan_Claw
- **来源**: git@github.com:Dandan044/Dandan_Claw.git