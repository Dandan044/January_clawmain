#!/usr/bin/env node
/**
 * 七月报告监控器
 * 
 * 监控 ~/.openclaw/july-btc-analyzer/active/cycle-*/reports/ 目录
 * 发现新报告时通知十四月智能体
 * 
 * 使用 PM2 管理：
 *   pm2 start scripts/july-report-monitor.js --name july-report-monitor
 *   pm2 save
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// ========== 配置 ==========
const JULY_WORKSPACE = path.join(process.env.HOME, '.openclaw/july-btc-analyzer');
const ACTIVE_DIR = path.join(JULY_WORKSPACE, 'active');
const SHISIYUE_WORKSPACE = path.join(process.env.HOME, '.openclaw/shisiyue-clawmain');
const STATE_FILE = path.join(SHISIYUE_WORKSPACE, '.july-report-state.json');
const LOGS_DIR = path.join(SHISIYUE_WORKSPACE, 'logs');
const LOG_FILE = path.join(LOGS_DIR, 'july-report-monitor.log');

// 检查间隔（毫秒）
const CHECK_INTERVAL = 3 * 60 * 1000; // 3分钟

// 目标智能体
const TARGET_AGENT = 'shisiyue';

// 回复目标（主人QQ私聊）
const REPLY_CHANNEL = 'qqbot';
const REPLY_TO = 'qqbot:c2c:3264012CFFDCF2666417B4D4ABACEFFF';

// ========== 工具函数 ==========

function timestamp() {
  // 返回北京时间 (GMT+8)
  const now = new Date();
  const beijing = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return beijing.toISOString().replace('T', ' ').substring(0, 19);
}

function log(level, message, data = null) {
  // 确保日志目录存在
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
  
  const logLine = `[${timestamp()}] [${level}] ${message}${data ? ' ' + JSON.stringify(data) : ''}\n`;
  fs.appendFileSync(LOG_FILE, logLine);
  
  if (level === 'ERROR') {
    console.error(`[Report Monitor] ${message}`, data || '');
  } else {
    console.log(`[Report Monitor] ${message}`, data || '');
  }
}

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    }
  } catch (error) {
    log('WARN', '加载状态文件失败，将重新创建', { error: error.message });
  }
  return { lastNotifiedFile: null, lastNotifiedTime: 0, lastCycleId: null };
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (error) {
    log('ERROR', '保存状态文件失败', { error: error.message });
  }
}

// ========== 核心逻辑 ==========

/**
 * 获取当前活跃周期的报告目录
 */
function getActiveReportsDir() {
  if (!fs.existsSync(ACTIVE_DIR)) {
    return null;
  }
  
  // 查找 active/cycle-* 目录
  const entries = fs.readdirSync(ACTIVE_DIR, { withFileTypes: true });
  const cycleDir = entries.find(e => e.isDirectory() && e.name.startsWith('cycle-'));
  
  if (!cycleDir) {
    return null;
  }
  
  const reportsDir = path.join(ACTIVE_DIR, cycleDir.name, 'reports');
  
  if (!fs.existsSync(reportsDir)) {
    return { cycleId: cycleDir.name, reportsDir: null };
  }
  
  return { cycleId: cycleDir.name, reportsDir };
}

/**
 * 检查是否有新报告
 */
function checkNewReports() {
  const activeInfo = getActiveReportsDir();
  
  if (!activeInfo) {
    log('INFO', '无活跃周期');
    return null;
  }
  
  if (!activeInfo.reportsDir) {
    log('INFO', '活跃周期存在但无报告目录', { cycleId: activeInfo.cycleId });
    return null;
  }
  
  const state = loadState();
  const files = fs.readdirSync(activeInfo.reportsDir).filter(f => f.endsWith('.md'));
  
  if (files.length === 0) {
    return null;
  }
  
  // 找出最新修改的文件
  let latestFile = null;
  let latestTime = 0;
  
  for (const file of files) {
    const filePath = path.join(activeInfo.reportsDir, file);
    const stat = fs.statSync(filePath);
    const mtime = stat.mtimeMs;
    
    if (mtime > latestTime) {
      latestTime = mtime;
      latestFile = file;
    }
  }
  
  // 检查是否比上次通知的更新
  // 或者是新的周期
  const isNewCycle = activeInfo.cycleId !== state.lastCycleId;
  const isNewReport = latestTime > state.lastNotifiedTime;
  
  if (latestFile && (isNewCycle || isNewReport)) {
    return {
      filename: latestFile,
      filepath: path.join(activeInfo.reportsDir, latestFile),
      cycleId: activeInfo.cycleId,
      mtime: latestTime,
      isNew: latestTime > Date.now() - CHECK_INTERVAL // 最近3分钟内修改的
    };
  }
  
  return null;
}

/**
 * 通知十四月智能体（异步执行，回复发到QQ）
 */
function notifyShisiyue(report) {
  const message = `发现新报告：${report.filename}
周期：${report.cycleId}

请前往 ~/.openclaw/july-btc-analyzer/active/${report.cycleId}/reports/ 读取最新报告，用十四月的风格向主人转述关键内容。记得用「大饼」代替 BTC，结尾加免责声明。`;

  try {
    // 使用 spawn 异步执行，回复发送到QQ
    const child = spawn('openclaw', [
      'agent',
      '--agent', TARGET_AGENT,
      '--message', message,
      '--deliver',
      '--reply-channel', REPLY_CHANNEL,
      '--reply-to', REPLY_TO
    ], {
      detached: true,
      stdio: 'ignore'
    });
    
    // 让子进程独立运行
    child.unref();
    
    log('INFO', '已触发十四月', { 
      file: report.filename,
      cycleId: report.cycleId,
      pid: child.pid
    });
    
    return true;
  } catch (error) {
    log('ERROR', '触发十四月失败', { 
      error: error.message,
      file: report.filename 
    });
    return false;
  }
}

/**
 * 主检查循环
 */
function check() {
  log('INFO', '开始检查报告目录...');
  
  const report = checkNewReports();
  
  if (!report) {
    log('INFO', '无新报告');
    return;
  }
  
  log('INFO', '发现新报告', { 
    file: report.filename,
    cycleId: report.cycleId,
    mtime: new Date(report.mtime).toISOString(),
    isNew: report.isNew
  });
  
  if (report.isNew) {
    const success = notifyShisiyue(report);
    
    if (success) {
      // 更新状态
      const state = loadState();
      state.lastNotifiedFile = report.filename;
      state.lastNotifiedTime = report.mtime;
      state.lastCycleId = report.cycleId;
      saveState(state);
      
      log('INFO', '状态已更新', { 
        lastCycleId: state.lastCycleId,
        lastNotifiedFile: state.lastNotifiedFile,
        lastNotifiedTime: new Date(state.lastNotifiedTime).toISOString()
      });
    }
  } else {
    log('INFO', '报告不是最近修改的，跳过通知', { file: report.filename });
  }
}

// ========== 启动 ==========

function main() {
  log('INFO', '七月报告监控器启动', {
    activeDir: ACTIVE_DIR,
    checkInterval: `${CHECK_INTERVAL / 1000}s`,
    targetAgent: TARGET_AGENT
  });
  
  // 立即执行一次
  check();
  
  // 启动定时器
  setInterval(check, CHECK_INTERVAL);
  
  console.log(`[Report Monitor] Started, checking every ${CHECK_INTERVAL / 1000} seconds`);
}

// 监听进程信号
process.on('SIGINT', () => {
  log('INFO', '监控器关闭 (SIGINT)');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('INFO', '监控器关闭 (SIGTERM)');
  process.exit(0);
});

main();