# LEARNINGS.md

记录学习、纠正和最佳实践。

---

## [LRN-20260319-001] correction

**Logged**: 2026-03-19T14:52:00+08:00
**Priority**: high
**Status**: resolved
**Area**: config

### Summary
七月工作区的更新应该只推送到 dev 分支，不要合并到 master

### Details
在更新七月工作区时，用户明确要求"将更新推送至 dev"，但我错误地执行了：
```bash
git push origin dev
git checkout master
git merge dev  # 错误！不应该合并
git push origin master
```

正确做法：
```bash
git add -A
git commit -m "..."
git push origin dev  # 只推送到 dev
```

**分支策略**：
- `master`: 稳定版本，周期系统之前的代码
- `dev`: 开发版本，包含周期系统和运行数据

### Suggested Action
以后推送前确认目标分支，如果用户说"推送至 dev"，就只推送到 dev，不要自动合并到 master。

### Metadata
- Source: user_feedback
- Related Files: ~/.openclaw/july-btc-analyzer/
- Tags: git, branches, workflow
- See Also: -

### Resolution
- **Resolved**: 2026-03-19T14:47:00+08:00
- **Action**: 回滚 master 到 `e44d0b3`，保持 dev 领先
- **Notes**: master 现在停留在周期系统之前，dev 包含周期系统所有更新

---