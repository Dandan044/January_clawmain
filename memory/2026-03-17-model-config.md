# Session: 2026-03-17 07:20:15 UTC

- **Session Key**: agent:main:tui-8c7cc067-5818-4a6e-9d19-0a9782e67f24
- **Session ID**: 454a0ced-60f3-4bac-af56-08c0e857ef30
- **Source**: gateway:sessions.reset

## Conversation Summary

assistant: 我来帮主人设置十四月的默认模型～
assistant: 找到了十四月的配置！当前模型是 `bailian/glm-5`，我来改成 `bailian/qwen3.5-plus`～
assistant: 搞定啦主人！☀️ 

**已将十四月的默认模型改为 `bailian/qwen3.5-plus`** （从原来的 `bailian/glm-5`）

配置已生效，Gateway 已重启～

我来更新一下记忆文件：
assistant: 好啦！记录也更新好了～

**变更摘要：**
- 🌙 十四月的模型：`bailian/glm-5` → `bailian/qwen3.5-plus`
- 配置已生效，MEMORY.md 已同步更新
user: System: [2026-03-17 14:56:13 GMT+8] Gateway restart config-patch ok (config.patch)
System: 已将十四月的默认模型从 bailian/glm-5 改为 bailian/qwen3.5-plus
System: Run: openclaw doctor --non-interactive

Sender (untrusted metadata):
```json
{
  "label": "openclaw-tui (gateway-client)",
  "id": "gateway-client",
  "name": "openclaw-tui",
  "username": "openclaw-tui"
}
```

[Tue 2026-03-17 14:56 GMT+8] 现在我们全部智能体使用的都是bailian系列的模型，我们好像还保留了一个zai的配置，你看看有没有？
assistant: 让我查一下当前的 auth profiles 配置：
assistant: 让我查一下当前的 auth profiles 配置：有的！从
assistant: 有的！从
user: Sender (untrusted metadata):
```json
{
  "label": "openclaw-tui (gateway-client)",
  "id": "gateway-client",
  "name": "openclaw-tui",
  "username": "openclaw-tui"
}
```

[Tue 2026-03-17 15:05 GMT+8] 什么情况现在？
assistant: 抱歉主人，我卡住了！😅

从之前获取的配置来看，确实有一个 `zai` 的配置残留：

**当前 auth.profiles:**
```json
"zai:default": {
  "provider": "zai",
  "mode": "api_key"
}
```

**当前 models.providers 里也有 zai:**
- zai/glm-5
- zai/glm-4.7
- zai/glm-4.7-flash
- zai/glm-4.7-flashx

但现在所有智能体都用 `bailian/*` 模型了，这个 `zai` 配置确实没用了～

主人要我把 `zai` 相关配置清理掉吗？包括：
1. 删除 `auth.profiles` 里的 `zai:default`
2. 删除 `models.providers` 里的 `zai` 条目
user: Sender (untrusted metadata):
```json
{
  "label": "openclaw-tui (gateway-client)",
  "id": "gateway-client",
  "name": "openclaw-tui",
  "username": "openclaw-tui"
}
```

[Tue 2026-03-17 15:06 GMT+8] 他是保留了所有配置的对吧，如果我想将一个模型切换至zai是很容易的对吧？
assistant: 对的！配置都保留着呢～

**现在的状态：**

| 提供商 | 认证配置 | 可用模型 |
|--------|----------|----------|
| **zai** | ✅ `zai:default` (api_key) | glm-5, glm-4.7, glm-4.7-flash, glm-4.7-flashx |
| **bailian** | ✅ 继承默认 | qwen3.5-plus, glm-5, glm-4.7, kimi-k2.5 等 |

**切换模型很简单：**

只需要改 `agents.list` 里对应智能体的 `model` 字段，比如把七月改成 zai 的模型：

```json
{
  "id": "july",
  "model": "zai/glm-5"  // 改这里就行
}
```

所以现在的配置是「兼容并存」的状态，随时可以在 `bailian/*` 和 `zai/*` 之间切换，不用重新配置认证～ 保留着也挺好的！
user: Sender (untrusted metadata):
```json
{
  "label": "openclaw-tui (gateway-client)",
  "id": "gateway-client",
  "name": "openclaw-tui",
  "username": "openclaw-tui"
}
```

[Tue 2026-03-17 15:08 GMT+8] openclaw是不是支持设定一个智能体的备用模型的？防止主模型服务挂了，用备用模型回复？有这个配置吗
assistant: 好问题！让我查一下 agents 的配置结构：
assistant: 根据文档和配置结构，OpenClaw **确实有 failover 机制**，但它是 **Auth Profile 级别**的，不是直接配置「模型备用」：

---

## 现有的 Failover 机制

### 1. **Auth Profile 轮换** (`auth.order`)
```json
{
  "auth": {
    "order": {
      "zai": ["zai:default", "zai:backup"],  // 按顺序尝试
      "bailian": ["bailian:default"]
    }
  }
}
```
当一个 API key 失败（限额、认证错误等），会自动切换到下一个 profile。

### 2. **FailoverError 触发**
当检测到特定错误（认证失败、限流、配额用尽等）时，系统会抛出 `FailoverError` 切换到下一个 auth profile。

---

## 模型级别的 Fallback？

目前**没有直接的「模型备用」配置**，比如：
```json
// 这种配置目前不支持
{
  "id": "shisiyue",
  "model": "bailian/qwen3.5-plus",
  "fallbackModel": "zai/glm-5"  // ❌ 没有这个字段
}
```

**但可以通过 auth.order 间接实现：**
- 如果 `bailian` 服务整体挂了，可以在 `auth.order` 里配置多个 provider 的 auth profile
- 系统会按顺序尝试，失败的 provider 会切换到下一个

---

**总结：** OpenClaw 的 failover 是 **Provider/Auth 级别**的，不是「模型 A 挂了切模型 B」。如果想要这个功能，可能需要向 OpenClaw 团队提 feature request～
