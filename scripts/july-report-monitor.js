#!/usr/bin/env node
/**
 * July Report Monitor
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const JULY_WORKSPACE = path.join(process.env.HOME, '.openclaw/july-btc-analyzer');
const ACTIVE_DIR = path.join(JULY_WORKSPACE, 'active');
const SHISIYUE_WORKSPACE = path.join(process.env.HOME, '.openclaw/shisiyue-clawmain');
const STATE_FILE = path.join(SHISIYUE_WORKSPACE, '.july-report-state.json');
const LOGS_DIR = path.join(SHISIYUE_WORKSPACE, 'logs');
const LOG_FILE = path.join(LOGS_DIR, 'july-report-monitor.log');
const CHECK_INTERVAL = 3 * 60 * 1000;
const TARGET_AGENT = 'shisiyue';
const REPLY_CHANNEL = 'qqbot';
const REPLY_TO = 'qqbot:c2c:3264012CFFDCF2666417B4D4ABACEFFF';

function timestamp() {
  const now = new Date();
  const beijing = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return beijing.toISOString().replace('T', ' ').substring(0, 19);
}

function log(level, message, data) {
  if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });
  const logLine = '[' + timestamp() + '] [' + level + '] ' + message + (data ? ' ' + JSON.stringify(data) : '') + '\n';
  fs.appendFileSync(LOG_FILE, logLine);
  if (level === 'ERROR') console.error('[Report Monitor] ' + message, data || '');
  else console.log('[Report Monitor] ' + message, data || '');
}

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  } catch (e) {
    log('WARN', 'Failed to load state', { error: e.message });
  }
  return { lastNotifiedFile: null, lastNotifiedTime: 0, lastCycleId: null };
}

function saveState(state) {
  try { fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)); }
  catch (e) { log('ERROR', 'Failed to save state', { error: e.message }); }
}

function getActiveReportsDir() {
  if (!fs.existsSync(ACTIVE_DIR)) return null;
  const entries = fs.readdirSync(ACTIVE_DIR, { withFileTypes: true });
  const cycleDir = entries.find(e => e.isDirectory() && e.name.startsWith('cycle-'));
  if (!cycleDir) return null;
  const reportsDir = path.join(ACTIVE_DIR, cycleDir.name, 'reports');
  if (!fs.existsSync(reportsDir)) return { cycleId: cycleDir.name, reportsDir: null };
  return { cycleId: cycleDir.name, reportsDir };
}

function checkNewReports() {
  const activeInfo = getActiveReportsDir();
  if (!activeInfo) { log('INFO', 'No active cycle'); return null; }
  if (!activeInfo.reportsDir) { log('INFO', 'No reports dir', { cycleId: activeInfo.cycleId }); return null; }
  const state = loadState();
  const files = fs.readdirSync(activeInfo.reportsDir).filter(f => f.endsWith('.md'));
  if (files.length === 0) return null;
  let latestFile = null, latestTime = 0;
  for (const file of files) {
    const stat = fs.statSync(path.join(activeInfo.reportsDir, file));
    if (stat.mtimeMs > latestTime) { latestTime = stat.mtimeMs; latestFile = file; }
  }
  const isNewCycle = activeInfo.cycleId !== state.lastCycleId;
  const isNewReport = latestTime > state.lastNotifiedTime;
  if (latestFile && (isNewCycle || isNewReport)) {
    return {
      filename: latestFile,
      filepath: path.join(activeInfo.reportsDir, latestFile),
      cycleId: activeInfo.cycleId,
      mtime: latestTime,
      isNew: latestTime > Date.now() - CHECK_INTERVAL
    };
  }
  return null;
}

function notifyShisiyue(report) {
  const msg = 'Found new report: ' + report.filename + '\nCycle: ' + report.cycleId + '\n\nPlease read the latest report and summarize to master.';
  try {
    const child = spawn('openclaw', ['agent', '--agent', TARGET_AGENT, '--message', msg, '--deliver', '--reply-channel', REPLY_CHANNEL, '--reply-to', REPLY_TO], { detached: true, stdio: 'ignore' });
    child.unref();
    log('INFO', 'Triggered Shisiyue', { file: report.filename, cycleId: report.cycleId, pid: child.pid });
    return true;
  } catch (e) {
    log('ERROR', 'Failed to trigger Shisiyue', { error: e.message });
    return false;
  }
}

function check() {
  log('INFO', 'Checking...');
  const report = checkNewReports();
  if (!report) { log('INFO', 'No new report'); return; }
  log('INFO', 'Found report', { file: report.filename, cycleId: report.cycleId, isNew: report.isNew });
  if (report.isNew) {
    if (notifyShisiyue(report)) {
      const state = loadState();
      state.lastNotifiedFile = report.filename;
      state.lastNotifiedTime = report.mtime;
      state.lastCycleId = report.cycleId;
      saveState(state);
      log('INFO', 'State updated', { lastCycleId: state.lastCycleId });
    }
  }
}

function main() {
  log('INFO', 'Monitor started', { activeDir: ACTIVE_DIR });
  check();
  setInterval(check, CHECK_INTERVAL);
  console.log('[Report Monitor] Started');
}

process.on('SIGINT', () => { log('INFO', 'Stopped (SIGINT)'); process.exit(0); });
process.on('SIGTERM', () => { log('INFO', 'Stopped (SIGTERM)'); process.exit(0); });
main();
