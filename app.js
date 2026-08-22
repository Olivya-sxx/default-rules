const defaultRules = [
  { id: 'wait', scene: '无聊等待', action: '打开英语 App', minimum: '只学 3 分钟' },
  { id: 'scroll', scene: '想刷手机', action: '拿起正在看的书', minimum: '只读 2 页' },
  { id: 'free', scene: '有 30 分钟空闲', action: '打开创作清单', minimum: '只完成一个小模块' },
  { id: 'lost', scene: '不知道做什么', action: '打开任务菜单', minimum: '只选一个动作' },
  { id: 'tired', scene: '很累不想动', action: '喝一杯水，坐 2 分钟', minimum: '只做休息，不逼自己推进' },
];
const reasons = ['忘记规则', '启动太麻烦', '动作还是太大', '当时太累', '手机太有吸引力', '别的事打断了'];
const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
let rules = load('default-rules-v1', defaultRules);
let logs = load('default-rules-logs-v1', []);
let activeRuleId = rules[0]?.id;
let selectedReason = reasons[0];
let editingId = null;
const $ = (s) => document.querySelector(s);
const save = () => { localStorage.setItem('default-rules-v1', JSON.stringify(rules)); localStorage.setItem('default-rules-logs-v1', JSON.stringify(logs)); };
const activeRule = () => rules.find((rule) => rule.id === activeRuleId) || rules[0];
const uid = () => `r-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const dateText = (time) => new Intl.DateTimeFormat('zh-CN', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' }).format(new Date(time));

function renderNow() {
  if (!rules.length) { $('#scene-list').innerHTML = '<p class="empty">先到「我的规则」加一条规则。</p>'; $('#action-card').innerHTML = ''; return; }
  if (!rules.some((rule) => rule.id === activeRuleId)) activeRuleId = rules[0].id;
  $('#scene-list').innerHTML = rules.map((rule) => `<button class="scene ${rule.id === activeRuleId ? 'is-active' : ''}" data-rule="${rule.id}">${rule.scene}</button>`).join('');
  const rule = activeRule();
  $('#action-card').innerHTML = `<p class="section-label">默认动作</p><h2>${rule.action}</h2><span class="minimum">最低标准：${rule.minimum}</span><div class="button-row"><button class="primary" id="done">我做到了</button><button class="secondary" id="stuck">我卡住了</button></div>`;
  document.querySelectorAll('[data-rule]').forEach((button) => button.onclick = () => { activeRuleId = button.dataset.rule; renderNow(); });
  $('#done').onclick = () => addLog('完成');
  $('#stuck').onclick = () => { selectedReason = reasons[0]; renderReasons(); $('#failure-dialog').showModal(); };
}
function addLog(result, reason = '', note = '') { const rule = activeRule(); logs.unshift({ id:uid(), ruleId:rule.id, scene:rule.scene, result, reason, note, time:Date.now() }); save(); renderReview(); if (result === '完成') $('#action-card').innerHTML += '<p class="quiet-note result-good">记下来了。到这里就够了。</p>'; }
function renderReasons() { $('#reason-grid').innerHTML = reasons.map((reason) => `<button type="button" class="reason ${reason === selectedReason ? 'is-selected' : ''}" data-reason="${reason}">${reason}</button>`).join(''); document.querySelectorAll('[data-reason]').forEach((button) => button.onclick = () => { selectedReason = button.dataset.reason; renderReasons(); }); }
function renderRules() { $('#rule-list').innerHTML = rules.length ? rules.map((rule) => `<article class="rule-item"><button data-edit="${rule.id}"><p>当我 ${rule.scene}</p><strong>我先 ${rule.action}</strong><span>最低：${rule.minimum}</span></button></article>`).join('') : '<p class="empty">还没有规则。先加一条经常用得上的。</p>'; document.querySelectorAll('[data-edit]').forEach((button) => button.onclick = () => openRule(button.dataset.edit)); }
function renderReview() { const recent = logs.filter((log) => log.time > Date.now() - 14 * 864e5); const done = recent.filter((log) => log.result === '完成').length; const stuck = recent.length - done; $('#stats').innerHTML = `<div><b>${recent.length}</b><span>次尝试</span></div><div><b>${done}</b><span>次做到</span></div><div><b>${stuck}</b><span>次卡住</span></div>`; const failed = recent.filter((log) => log.reason); const tally = failed.reduce((all, log) => ({ ...all, [log.reason]:(all[log.reason] || 0) + 1 }), {}); const top = Object.entries(tally).sort((a,b) => b[1] - a[1])[0]; $('#insight').textContent = top ? `最近最常见的卡点是「${top[0]}」（${top[1]} 次）。试着把对应规则的第一步再缩小一点。` : recent.length ? '你已经开始留下证据了。多记录几次，规律会慢慢出现。' : '先用一次，再回来看看。这里会帮你看见重复出现的卡点。'; $('#log-list').innerHTML = logs.length ? logs.slice(0, 20).map((log) => `<div class="log-entry"><b class="${log.result === '完成' ? 'result-good' : 'result-bad'}">${log.scene} · ${log.result}${log.reason ? `：${log.reason}` : ''}</b>${log.note ? `<small>${log.note}</small>` : ''}<small>${dateText(log.time)}</small></div>`).join('') : $('#empty-log').innerHTML; }
function openRule(id = null) { editingId = id; const rule = id ? rules.find((item) => item.id === id) : { scene:'', action:'', minimum:'' }; $('#rule-dialog-label').textContent = id ? '编辑规则' : '新规则'; $('#rule-id').value = id || ''; $('#rule-scene').value = rule.scene; $('#rule-action').value = rule.action; $('#rule-minimum').value = rule.minimum; $('#delete-rule').classList.toggle('is-visible', Boolean(id)); $('#rule-dialog').showModal(); }
function switchView(id) { document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('is-active', tab.dataset.view === id)); document.querySelectorAll('.view').forEach((view) => view.classList.toggle('is-active', view.id === id)); }
document.querySelectorAll('.tab').forEach((tab) => tab.onclick = () => switchView(tab.dataset.view));
$('#add-rule').onclick = () => openRule();
$('#failure-form').addEventListener('submit', (event) => { if (event.submitter?.value === 'cancel') return; event.preventDefault(); addLog('卡住了', selectedReason, $('#failure-note').value.trim()); $('#failure-note').value = ''; $('#failure-dialog').close(); });
$('#rule-form').addEventListener('submit', (event) => { if (event.submitter?.value === 'cancel') return; event.preventDefault(); const candidate = { id:editingId || uid(), scene:$('#rule-scene').value.trim(), action:$('#rule-action').value.trim(), minimum:$('#rule-minimum').value.trim() }; if (!candidate.scene || !candidate.action || !candidate.minimum) return; if (editingId) rules = rules.map((rule) => rule.id === editingId ? candidate : rule); else rules.push(candidate); activeRuleId = candidate.id; save(); renderNow(); renderRules(); $('#rule-dialog').close(); });
$('#delete-rule').onclick = () => { rules = rules.filter((rule) => rule.id !== editingId); save(); renderNow(); renderRules(); $('#rule-dialog').close(); };
$('#clear-log').onclick = () => { if (confirm('清空所有记录？规则会保留。')) { logs = []; save(); renderReview(); } };
renderNow(); renderRules(); renderReview();
