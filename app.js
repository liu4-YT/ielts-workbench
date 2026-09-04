const STORAGE_KEY = 'ielts-workbench-data';

const DEFAULT_DATA = {
  examDate: null,
  targetBands: { overall: 7.5, listening: 7.5, reading: 7.5, writing: 6.5, speaking: 6.5 },
  weeklyHours: { weekday: 4, weekend: 6.5 },
  sections: {
    listening: { name: '听力', en: 'Listening', sessions: [] },
    reading: { name: '阅读', en: 'Reading', sessions: [] },
    writing: { name: '写作', en: 'Writing', sessions: [] },
    speaking: { name: '口语', en: 'Speaking', sessions: [] }
  },
  vocabulary: [],
  speakingRecords: [],
  tasks: [],
  timer: { seconds: 0, running: false },
  lastSaved: null
};

const SPEAKING_QUESTIONS = [
  { id: 1, part: '1', topic: 'work-study', text: 'Do you work or are you a student?' },
  { id: 2, part: '1', topic: 'work-study', text: 'What do you like most about your studies / job?' },
  { id: 3, part: '1', topic: 'hometown', text: 'Where is your hometown?' },
  { id: 4, part: '1', topic: 'hometown', text: 'What do you like most about your hometown?' },
  { id: 5, part: '1', topic: 'daily-routine', text: 'What is your typical day like?' },
  { id: 6, part: '1', topic: 'daily-routine', text: 'Do you prefer to study in the morning or at night?' },
  { id: 7, part: '1', topic: 'technology', text: 'How often do you use the internet?' },
  { id: 8, part: '1', topic: 'technology', text: 'Do you think technology has made life easier?' },
  { id: 9, part: '1', topic: 'travel', text: 'Do you like travelling?' },
  { id: 10, part: '1', topic: 'travel', text: 'What kind of places do you like to visit?' },
  { id: 11, part: '1', topic: 'food', text: 'What is your favourite food?' },
  { id: 12, part: '1', topic: 'food', text: 'Do you prefer eating at home or eating out?' },
  { id: 13, part: '1', topic: 'sports', text: 'Do you do any sports?' },
  { id: 14, part: '1', topic: 'sports', text: 'What sport would you like to try in the future?' },
  { id: 15, part: '1', topic: 'music', text: 'What kind of music do you like?' },
  { id: 16, part: '1', topic: 'music', text: 'Do you play any musical instruments?' },
  { id: 17, part: '2', topic: 'people', text: 'Describe a person you admire. You should say: who this person is, how you know them, what they do, and explain why you admire them.' },
  { id: 18, part: '2', topic: 'places', text: 'Describe a place you have visited that had a lot of noise. You should say: where it was, why you went there, why it was noisy, and explain how you felt about the noise.' },
  { id: 19, part: '2', topic: 'objects', text: 'Describe an object you own that is important to you. You should say: what it is, how long you have had it, how you use it, and explain why it is important.' },
  { id: 20, part: '2', topic: 'events', text: 'Describe a memorable event from your childhood. You should say: what happened, who was there, why it was memorable, and explain how you felt at the time.' },
  { id: 21, part: '2', topic: 'experiences', text: 'Describe a time when you helped someone. You should say: who you helped, what you did, why you helped them, and explain how you felt about it.' },
  { id: 22, part: '2', topic: 'media', text: 'Describe a film or TV programme that made you laugh. You should say: what it was, when you watched it, who you watched it with, and explain why it made you laugh.' },
  { id: 23, part: '2', topic: 'daily-routine', text: 'Describe a typical day when you were a child. You should say: what you did, who you were with, how you felt, and explain what was special about it.' },
  { id: 24, part: '2', topic: 'travel', text: 'Describe a journey you went on. You should say: where you went, how you travelled, who you were with, and explain why it was memorable.' },
  { id: 25, part: '3', topic: 'work-study', text: 'Do you think people today have a better work-life balance than in the past?' },
  { id: 26, part: '3', topic: 'work-study', text: 'What skills do you think are most important in the modern workplace?' },
  { id: 27, part: '3', topic: 'technology', text: 'How has technology changed the way people communicate?' },
  { id: 28, part: '3', topic: 'technology', text: 'Do you think artificial intelligence will replace many jobs? Why or why not?' },
  { id: 29, part: '3', topic: 'travel', text: 'What are the advantages and disadvantages of international tourism?' },
  { id: 30, part: '3', topic: 'travel', text: 'Do you think travel makes people more open-minded?' },
  { id: 31, part: '3', topic: 'environment', text: 'Whose responsibility is it to protect the environment: individuals, companies, or governments?' },
  { id: 32, part: '3', topic: 'environment', text: 'What are some effective ways to reduce pollution in cities?' },
  { id: 33, part: '3', topic: 'education', text: 'Do you think traditional classrooms will be replaced by online learning?' },
  { id: 34, part: '3', topic: 'education', text: 'What makes a good teacher?' },
  { id: 35, part: '3', topic: 'food', text: 'Why do you think fast food is so popular around the world?' },
  { id: 36, part: '3', topic: 'food', text: 'Should governments tax unhealthy food? Why or why not?' }
];

let data = deepClone(DEFAULT_DATA);
let timerInterval = null;
let activeSectionKey = null;
let currentQuestion = null;

/* ---------- 工具 ---------- */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' });
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const exam = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((exam - today) / (1000 * 60 * 60 * 24));
  return diff;
}

function getWeekday(dateStr) {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[new Date(dateStr + 'T00:00:00').getDay()];
}

/* ---------- 初始化 ---------- */
function init() {
  loadFromStorage();
  bindEvents();
  bindTabEvents();
  populateSpeakingFilters();
  render();
  document.getElementById('sessionDate').valueAsDate = new Date();
  registerServiceWorker();
}

/* ---------- Service Worker ---------- */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.error('SW 注册失败', err);
    });
  }
}

/* ---------- 数据持久化 ---------- */
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      data = mergeData(parsed);
    }
  } catch (err) {
    console.error('读取本地数据失败', err);
  }
}

function mergeData(parsed) {
  const merged = deepClone(DEFAULT_DATA);
  if (parsed.examDate) merged.examDate = parsed.examDate;
  if (parsed.targetBands) merged.targetBands = { ...merged.targetBands, ...parsed.targetBands };
  if (parsed.weeklyHours) merged.weeklyHours = { ...merged.weeklyHours, ...parsed.weeklyHours };
  if (parsed.sections) {
    Object.keys(merged.sections).forEach(key => {
      if (parsed.sections[key]) merged.sections[key].sessions = Array.isArray(parsed.sections[key].sessions)
        ? parsed.sections[key].sessions
        : [];
    });
  }
  if (Array.isArray(parsed.vocabulary)) merged.vocabulary = parsed.vocabulary;
  if (Array.isArray(parsed.speakingRecords)) merged.speakingRecords = parsed.speakingRecords;
  if (Array.isArray(parsed.tasks)) merged.tasks = parsed.tasks;
  if (parsed.timer) merged.timer = parsed.timer;
  if (parsed.lastSaved) merged.lastSaved = parsed.lastSaved;
  return merged;
}

function saveToStorage(showToast = true) {
  try {
    data.lastSaved = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (showToast) indicateSaved();
  } catch (err) {
    console.error('保存失败', err);
    alert('保存失败，可能是本地存储空间不足。');
  }
}

function indicateSaved() {
  const el = document.getElementById('saveStatus');
  el.textContent = '已保存 · ' + new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), 1200);
}

/* ---------- 导出 / 导入 ---------- */
function exportData() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `ielts-progress-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!parsed.sections) throw new Error('数据格式不正确');
      if (confirm('导入将覆盖当前所有进度，是否继续？')) {
        data = mergeData(parsed);
        saveToStorage(false);
        render();
        alert('导入成功');
      }
    } catch (err) {
      alert('导入失败：' + err.message);
    }
  };
  reader.readAsText(file);
}

/* ---------- 标签页 ---------- */
function bindTabEvents() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    });
  });
}

/* ---------- 渲染总入口 ---------- */
function render() {
  renderCountdown();
  renderOverview();
  renderSections();
  renderRecentSessions();
  renderVocabulary();
  renderTimer();
  renderTodayTasks();
  renderWeekChart();
  renderWeekPlan();
  renderSpeaking();
  fillSettings();
}

/* ---------- 倒计时 ---------- */
function renderCountdown() {
  const days = daysUntil(data.examDate);
  const daysEl = document.getElementById('countdownDays');
  const dateEl = document.getElementById('examDateDisplay');

  if (days === null) {
    daysEl.textContent = '--';
    dateEl.textContent = '未设置考试日期';
  } else {
    daysEl.textContent = days;
    dateEl.textContent = `考试日期：${data.examDate}（${getWeekday(data.examDate)}）`;
  }
}

/* ---------- 概览 ---------- */
function renderOverview() {
  const allSessions = Object.values(data.sections).flatMap(s => s.sessions);
  const uniqueDays = new Set(allSessions.map(s => s.date)).size;
  const totalMinutes = allSessions.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

  const scores = allSessions.map(s => Number(s.score)).filter(s => !isNaN(s) && s > 0);
  const avgBand = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
    : 0;

  document.getElementById('statDays').textContent = uniqueDays;
  document.getElementById('statHours').textContent = totalHours;
  document.getElementById('statBand').textContent = avgBand.toFixed(1);
  document.getElementById('statWords').textContent = data.vocabulary.length;
}

/* ---------- 四科卡片 ---------- */
function renderSections() {
  const grid = document.getElementById('sectionsGrid');
  grid.innerHTML = '';

  Object.entries(data.sections).forEach(([key, section]) => {
    const totalMinutes = section.sessions.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
    const hours = Math.round(totalMinutes / 60 * 10) / 10;
    const scores = section.sessions.map(s => Number(s.score)).filter(s => !isNaN(s) && s > 0);
    const lastScore = scores.length ? scores[scores.length - 1] : null;
    const avgScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
      : 0;
    const target = data.targetBands[key] || 7;
    const progress = Math.min(100, (avgScore / target) * 100);

    const card = document.createElement('article');
    card.className = 'section-card';
    card.innerHTML = `
      <div class="section-header">
        <div>
          <h2 class="section-title">${section.name}</h2>
          <p class="section-sub">${section.en} · 目标 ${target}</p>
        </div>
        <button class="btn btn-primary btn-small" data-add="${key}">+ 记录</button>
      </div>
      <div class="progress-bar" aria-label="进度"><div class="progress-fill" style="width: ${progress}%"></div></div>
      <div class="section-meta">
        <span>学时 <strong>${hours}h</strong></span>
        <span>练习 <strong>${section.sessions.length}</strong></span>
        <span>均分 <strong>${avgScore || '-'}</strong></span>
        ${lastScore ? `<span>最近 <strong class="session-badge">${lastScore}</strong></span>` : ''}
      </div>
      <ul class="section-sessions">
        ${section.sessions.length === 0
          ? '<li class="session-empty">还没有记录，点击右上角添加。</li>'
          : section.sessions.slice(-3).reverse().map(s => `
            <li class="session-item">
              <span>${s.date} · ${s.duration}min · ${s.note || '无备注'}</span>
              ${s.score ? `<span class="session-badge">${s.score}</span>` : ''}
            </li>
          `).join('')}
      </ul>
    `;
    grid.appendChild(card);
  });
}

function renderRecentSessions() {
  const list = document.getElementById('recentSessions');
  const all = Object.values(data.sections)
    .flatMap(s => s.sessions.map(sess => ({ ...sess, section: s.name })))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);

  if (all.length === 0) {
    list.innerHTML = '<li class="session-empty">暂无记录</li>';
    return;
  }

  list.innerHTML = all.map(s => `
    <li class="session-item">
      <span>${s.date} · ${s.section} · ${s.duration}min</span>
      ${s.score ? `<span class="session-badge">${s.score}</span>` : ''}
    </li>
  `).join('');
}

/* ---------- 今日任务 ---------- */
function generateTodayTasks(force = false) {
  const today = getTodayStr();
  const existing = data.tasks.filter(t => t.date === today && !t.completed);
  if (!force && existing.length > 0) return;

  const weekday = new Date().getDay();
  const isWeekend = weekday === 0 || weekday === 6;
  const hours = isWeekend ? data.weeklyHours.weekend : data.weeklyHours.weekday;
  const minutes = Math.round(hours * 60);
  const perSection = Math.round(minutes / 4);

  const tasks = [];
  tasks.push({ id: Date.now() + 1, date: today, section: 'listening', title: '听力练习', desc: `完成约 ${perSection} 分钟听力真题，记录错题`, completed: false });
  tasks.push({ id: Date.now() + 2, date: today, section: 'reading', title: '阅读练习', desc: `完成约 ${perSection} 分钟阅读真题，限时训练`, completed: false });
  tasks.push({ id: Date.now() + 3, date: today, section: 'writing', title: '写作练习', desc: '完成 1 篇小作文或大作文，记录常见错误', completed: false });
  tasks.push({ id: Date.now() + 4, date: today, section: 'speaking', title: '口语练习', desc: '在“口语官”中完成 1–2 题并记录反馈', completed: false });

  data.tasks = data.tasks.filter(t => t.date !== today || t.completed);
  data.tasks.push(...tasks);
}

function renderTodayTasks() {
  generateTodayTasks();
  document.getElementById('todayDate').textContent = `${formatDate(new Date())} · ${getWeekday(getTodayStr())}`;
  const list = document.getElementById('todayTasks');
  const todayTasks = data.tasks.filter(t => t.date === getTodayStr()).sort((a, b) => a.completed - b.completed);

  if (todayTasks.length === 0) {
    list.innerHTML = '<li class="session-empty">今日暂无任务，点击下方重新生成。</li>';
    return;
  }

  list.innerHTML = todayTasks.map(t => `
    <li class="task-item ${t.completed ? 'done' : ''}">
      <input type="checkbox" class="task-checkbox" ${t.completed ? 'checked' : ''} data-task="${t.id}">
      <div class="task-content">
        <div class="task-title">${t.title}</div>
        <div class="task-desc">${t.desc}</div>
      </div>
      <span class="task-tag">${data.sections[t.section]?.name || t.section}</span>
    </li>
  `).join('');
}

/* ---------- 周统计 ---------- */
function renderWeekChart() {
  const container = document.getElementById('weekChart');
  const today = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const allSessions = Object.values(data.sections).flatMap(s => s.sessions);
  const minutesByDay = {};
  days.forEach(d => minutesByDay[d] = 0);
  allSessions.forEach(s => {
    if (minutesByDay[s.date] !== undefined) minutesByDay[s.date] += Number(s.duration) || 0;
  });

  const maxMin = Math.max(120, ...Object.values(minutesByDay));
  const totalWeek = Object.values(minutesByDay).reduce((a, b) => a + b, 0);
  const hoursWeek = Math.round(totalWeek / 60 * 10) / 10;

  container.innerHTML = days.map(d => {
    const mins = minutesByDay[d];
    const height = Math.max(4, (mins / maxMin) * 100);
    const isToday = d === getTodayStr();
    return `<div class="chart-bar ${isToday ? 'active' : ''}" style="height:${height}%" data-day="${d.slice(5).replace('-', '/')}" title="${mins} 分钟"></div>`;
  }).join('');

  document.getElementById('weekSummary').textContent = `本周已学 ${hoursWeek} 小时 · 目标 ${(data.weeklyHours.weekday * 5 + data.weeklyHours.weekend * 2).toFixed(1)} 小时`;
}

/* ---------- 周计划 ---------- */
function renderWeekPlan() {
  const container = document.getElementById('weekPlan');
  const today = new Date();
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }

  container.innerHTML = days.map(d => {
    const date = new Date(d + 'T00:00:00');
    const isToday = d === getTodayStr();
    const weekday = date.getDay();
    const isWeekend = weekday === 0 || weekday === 6;
    const hours = isWeekend ? data.weeklyHours.weekend : data.weeklyHours.weekday;
    return `
      <div class="day-plan ${isToday ? 'today' : ''}">
        <div class="day-name">${isToday ? '今天' : getWeekday(d)}<br><span style="font-size:0.75rem;color:var(--ink-secondary)">${d.slice(5)}</span></div>
        <div class="day-tasks">建议学习 ${hours} 小时 · 听力 / 阅读 / 写作 / 口语 各约 ${Math.round(hours * 60 / 4)} 分钟</div>
      </div>
    `;
  }).join('');
}

/* ---------- 口语官 ---------- */
function populateSpeakingFilters() {
  const topicFilter = document.getElementById('speakingTopicFilter');
  const topics = [...new Set(SPEAKING_QUESTIONS.map(q => q.topic))];
  topicFilter.innerHTML = '<option value="all">全部话题</option>' + topics.map(t =>
    `<option value="${t}">${topicLabel(t)}</option>`
  ).join('');
}

function topicLabel(topic) {
  const map = {
    'work-study': '工作学习', 'hometown': '家乡', 'daily-routine': '日常',
    'technology': '科技', 'travel': '旅行', 'food': '食物', 'sports': '运动',
    'music': '音乐', 'people': '人物', 'places': '地点', 'objects': '物品',
    'events': '事件', 'experiences': '经历', 'media': '媒体', 'environment': '环境',
    'education': '教育'
  };
  return map[topic] || topic;
}

function filterQuestions() {
  const part = document.getElementById('speakingPartFilter').value;
  const topic = document.getElementById('speakingTopicFilter').value;
  return SPEAKING_QUESTIONS.filter(q => {
    return (part === 'all' || q.part === part) && (topic === 'all' || q.topic === topic);
  });
}

function renderSpeaking() {
  document.getElementById('speakingCount').textContent = data.speakingRecords.length;
  const list = document.getElementById('speakingRecords');

  if (data.speakingRecords.length === 0) {
    list.innerHTML = '<li class="session-empty">还没有口语练习记录。</li>';
    return;
  }

  list.innerHTML = data.speakingRecords.slice().reverse().map(r => `
    <li class="record-item">
      <div class="record-main">
        <div class="record-question">Part ${r.part} · ${r.questionText}</div>
        <div class="record-feedback">${escapeHtml(r.feedback)}</div>
      </div>
      ${r.score ? `<span class="record-score">${r.score}</span>` : ''}
    </li>
  `).join('');
}

function pickRandomQuestion() {
  const filtered = filterQuestions();
  if (filtered.length === 0) {
    currentQuestion = null;
    document.getElementById('questionText').textContent = '当前筛选条件下没有题目，请调整筛选。';
    document.getElementById('btnStartPractice').disabled = true;
    return;
  }
  currentQuestion = filtered[Math.floor(Math.random() * filtered.length)];
  document.getElementById('questionPart').textContent = `Part ${currentQuestion.part}`;
  document.getElementById('questionTopic').textContent = topicLabel(currentQuestion.topic);
  document.getElementById('questionText').textContent = currentQuestion.text;
  document.getElementById('btnStartPractice').disabled = false;
}

/* ---------- 词汇 ---------- */
function renderVocabulary() {
  const list = document.getElementById('vocabList');
  if (data.vocabulary.length === 0) {
    list.innerHTML = '<li class="session-empty">暂无单词，添加一些吧。</li>';
    return;
  }
  list.innerHTML = data.vocabulary.slice().reverse().map((item, index) => `
    <li class="vocab-item">
      <div>
        <div class="vocab-word">${escapeHtml(item.word)}</div>
        <div class="vocab-meaning">${escapeHtml(item.meaning)}</div>
      </div>
      <button class="vocab-delete" data-del="${data.vocabulary.length - 1 - index}" title="删除">×</button>
    </li>
  `).join('');
}

/* ---------- 计时器 ---------- */
function renderTimer() {
  const m = Math.floor(data.timer.seconds / 60).toString().padStart(2, '0');
  const s = (data.timer.seconds % 60).toString().padStart(2, '0');
  document.getElementById('timerDisplay').textContent = `${m}:${s}`;
}

/* ---------- 设置表单 ---------- */
function fillSettings() {
  document.getElementById('inputExamDate').value = data.examDate || '';
  document.getElementById('inputTargetOverall').value = data.targetBands.overall;
  document.getElementById('inputTargetListening').value = data.targetBands.listening;
  document.getElementById('inputTargetReading').value = data.targetBands.reading;
  document.getElementById('inputTargetWriting').value = data.targetBands.writing;
  document.getElementById('inputTargetSpeaking').value = data.targetBands.speaking;
  document.getElementById('inputWeekdayHours').value = data.weeklyHours.weekday;
  document.getElementById('inputWeekendHours').value = data.weeklyHours.weekend;
}

/* ---------- 事件绑定 ---------- */
function bindEvents() {
  document.getElementById('sectionsGrid').addEventListener('click', (e) => {
    if (e.target.matches('[data-add]')) {
      activeSectionKey = e.target.dataset.add;
      openSessionModal();
    }
  });

  document.getElementById('sessionForm').addEventListener('submit', handleSessionSubmit);
  document.getElementById('btnCloseModal').addEventListener('click', closeSessionModal);
  document.getElementById('btnCancelModal').addEventListener('click', closeSessionModal);
  document.getElementById('sessionModal').addEventListener('click', (e) => {
    if (e.target.id === 'sessionModal') closeSessionModal();
  });

  document.getElementById('vocabForm').addEventListener('submit', handleVocabSubmit);
  document.getElementById('vocabList').addEventListener('click', (e) => {
    if (e.target.matches('[data-del]')) {
      const idx = Number(e.target.dataset.del);
      data.vocabulary.splice(idx, 1);
      saveToStorage();
      render();
    }
  });

  document.getElementById('btnTimerStart').addEventListener('click', startTimer);
  document.getElementById('btnTimerPause').addEventListener('click', pauseTimer);
  document.getElementById('btnTimerReset').addEventListener('click', resetTimer);

  document.getElementById('btnSave').addEventListener('click', () => saveToStorage());
  document.getElementById('btnExport').addEventListener('click', exportData);
  document.getElementById('btnImport').addEventListener('click', () => document.getElementById('fileInput').click());
  document.getElementById('fileInput').addEventListener('change', (e) => {
    importData(e.target.files[0]);
    e.target.value = '';
  });

  document.getElementById('todayTasks').addEventListener('change', (e) => {
    if (e.target.matches('[data-task]')) {
      const id = Number(e.target.dataset.task);
      const task = data.tasks.find(t => t.id === id);
      if (task) {
        task.completed = e.target.checked;
        saveToStorage();
        renderTodayTasks();
      }
    }
  });

  document.getElementById('btnRegenerateToday').addEventListener('click', () => {
    generateTodayTasks(true);
    saveToStorage();
    renderTodayTasks();
  });

  document.getElementById('btnSetExam').addEventListener('click', () => {
    document.getElementById('quickExamDate').value = data.examDate || '';
    document.getElementById('examDateModal').showModal();
  });

  document.getElementById('examDateForm').addEventListener('submit', (e) => {
    e.preventDefault();
    data.examDate = document.getElementById('quickExamDate').value;
    closeExamDateModal();
    saveToStorage();
    render();
  });

  document.getElementById('btnCloseExamDateModal').addEventListener('click', closeExamDateModal);

  document.getElementById('examForm').addEventListener('submit', (e) => {
    e.preventDefault();
    data.examDate = document.getElementById('inputExamDate').value;
    data.targetBands = {
      overall: parseFloat(document.getElementById('inputTargetOverall').value) || 7.5,
      listening: parseFloat(document.getElementById('inputTargetListening').value) || 7.5,
      reading: parseFloat(document.getElementById('inputTargetReading').value) || 7.5,
      writing: parseFloat(document.getElementById('inputTargetWriting').value) || 6.5,
      speaking: parseFloat(document.getElementById('inputTargetSpeaking').value) || 6.5
    };
    saveToStorage();
    render();
    alert('目标已保存');
  });

  document.getElementById('weekForm').addEventListener('submit', (e) => {
    e.preventDefault();
    data.weeklyHours = {
      weekday: parseFloat(document.getElementById('inputWeekdayHours').value) || 4,
      weekend: parseFloat(document.getElementById('inputWeekendHours').value) || 6.5
    };
    saveToStorage();
    render();
    alert('时间已更新');
  });

  document.getElementById('btnRandomQuestion').addEventListener('click', pickRandomQuestion);
  document.getElementById('speakingPartFilter').addEventListener('change', () => { currentQuestion = null; renderSpeakingQuestionEmpty(); });
  document.getElementById('speakingTopicFilter').addEventListener('change', () => { currentQuestion = null; renderSpeakingQuestionEmpty(); });

  document.getElementById('btnStartPractice').addEventListener('click', openSpeakingModal);
  document.getElementById('speakingForm').addEventListener('submit', handleSpeakingSubmit);
  document.getElementById('btnCloseSpeakingModal').addEventListener('click', closeSpeakingModal);
  document.getElementById('btnCancelSpeakingModal').addEventListener('click', closeSpeakingModal);
  document.getElementById('speakingModal').addEventListener('click', (e) => {
    if (e.target.id === 'speakingModal') closeSpeakingModal();
  });

  window.addEventListener('beforeunload', () => saveToStorage(false));
}

function renderSpeakingQuestionEmpty() {
  document.getElementById('questionPart').textContent = '--';
  document.getElementById('questionTopic').textContent = '--';
  document.getElementById('questionText').textContent = '选择上方筛选条件或点击“随机一题”开始练习。';
  document.getElementById('btnStartPractice').disabled = true;
}

/* ---------- 弹窗操作 ---------- */
function openSessionModal() {
  const section = data.sections[activeSectionKey];
  document.getElementById('sessionModalTitle').textContent = `添加练习 · ${section.name}`;
  document.getElementById('sessionScore').value = '';
  document.getElementById('sessionDuration').value = '30';
  document.getElementById('sessionNote').value = '';
  document.getElementById('sessionModal').showModal();
}

function closeSessionModal() {
  document.getElementById('sessionModal').close();
  activeSectionKey = null;
}

function openSpeakingModal() {
  if (!currentQuestion) return;
  document.getElementById('speakingModalQuestion').textContent = currentQuestion.text;
  document.getElementById('speakingFeedback').value = '';
  document.getElementById('speakingScore').value = '';
  document.getElementById('speakingModal').showModal();
}

function closeSpeakingModal() {
  document.getElementById('speakingModal').close();
}

function closeExamDateModal() {
  document.getElementById('examDateModal').close();
}

/* ---------- 表单提交 ---------- */
function handleSessionSubmit(e) {
  e.preventDefault();
  if (!activeSectionKey) return;

  const date = document.getElementById('sessionDate').value;
  const score = parseFloat(document.getElementById('sessionScore').value);
  const duration = parseInt(document.getElementById('sessionDuration').value, 10);
  const note = document.getElementById('sessionNote').value.trim();

  data.sections[activeSectionKey].sessions.push({
    date,
    score: isNaN(score) ? null : score,
    duration: isNaN(duration) ? 0 : duration,
    note
  });

  closeSessionModal();
  saveToStorage();
  render();
}

function handleVocabSubmit(e) {
  e.preventDefault();
  const wordInput = document.getElementById('vocabWord');
  const meaningInput = document.getElementById('vocabMeaning');
  const word = wordInput.value.trim();
  const meaning = meaningInput.value.trim();
  if (!word || !meaning) return;

  data.vocabulary.push({ word, meaning, createdAt: new Date().toISOString() });
  wordInput.value = '';
  meaningInput.value = '';
  wordInput.focus();
  saveToStorage();
  render();
}

function handleSpeakingSubmit(e) {
  e.preventDefault();
  if (!currentQuestion) return;

  const feedback = document.getElementById('speakingFeedback').value.trim();
  const score = parseFloat(document.getElementById('speakingScore').value);
  if (!feedback) return;

  data.speakingRecords.push({
    questionId: currentQuestion.id,
    part: currentQuestion.part,
    topic: currentQuestion.topic,
    questionText: currentQuestion.text,
    feedback,
    score: isNaN(score) ? null : score,
    date: getTodayStr()
  });

  closeSpeakingModal();
  saveToStorage();
  render();
}

/* ---------- 计时器 ---------- */
function startTimer() {
  if (data.timer.running) return;
  data.timer.running = true;
  timerInterval = setInterval(() => {
    data.timer.seconds++;
    renderTimer();
  }, 1000);
}

function pauseTimer() {
  data.timer.running = false;
  clearInterval(timerInterval);
  saveToStorage(false);
}

function resetTimer() {
  pauseTimer();
  data.timer.seconds = 0;
  renderTimer();
  saveToStorage(false);
}

/* ---------- 启动 ---------- */
init();
