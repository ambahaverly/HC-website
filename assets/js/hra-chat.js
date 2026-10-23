// Haverly Consulting HRA Assistant: website chat
// Visitors get FREE_QUESTIONS questions per day in this browser, then are referred
// to the Advisory Partnership. The back end applies its own limits as well.
(function () {
  var root = document.getElementById('hra-chat');
  if (!root) return;
  var ENDPOINT = root.getAttribute('data-endpoint') || '';
  var ADVISORY = root.getAttribute('data-advisory') || 'advisory-partnership';
  var CONTACT_PAGE = root.getAttribute('data-contact') || 'contact';
  var FREE_QUESTIONS = 2;
  var MAX_LEN = 1000;
  var KEY = 'hraChatUsage';

  var log = root.querySelector('.chat-log');
  var form = root.querySelector('form');
  var box = root.querySelector('textarea');
  var send = root.querySelector('button[type="submit"]');
  var left = root.querySelector('.chat-left');
  var history = [];
  var busy = false;

  function today() { return new Date().toISOString().slice(0, 10); }
  function used() {
    try { var u = JSON.parse(localStorage.getItem(KEY) || '{}'); return u.day === today() ? (u.n || 0) : 0; }
    catch (e) { return memUsed; }
  }
  var memUsed = 0;
  function bump() {
    memUsed = used() + 1;
    try { localStorage.setItem(KEY, JSON.stringify({ day: today(), n: memUsed })); } catch (e) { /* storage blocked */ }
  }

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function inline(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g, '<a href="mailto:$1">$1</a>');
  }
  // Small, safe Markdown subset: paragraphs, "- " bullets, **bold**, and a final "Sources:" line.
  function render(text) {
    var lines = String(text).replace(/\r/g, '').split('\n');
    var html = '', list = false, para = [], sources = '';
    function flush() { if (para.length) { html += '<p>' + inline(para.join(' ')) + '</p>'; para = []; } }
    function close() { if (list) { html += '</ul>'; list = false; } }
    lines.forEach(function (raw) {
      var l = raw.trim();
      var m = /^\**sources\**\s*:\**\s*(.*)$/i.exec(l);
      if (m) { flush(); close(); sources = m[1]; return; }
      if (/^#+\s+/.test(l)) l = '**' + l.replace(/^#+\s+/, '') + '**';
      if (/^[-*•]\s+/.test(l)) { flush(); if (!list) { html += '<ul>'; list = true; } html += '<li>' + inline(l.replace(/^[-*•]\s+/, '')) + '</li>'; return; }
      if (l === '') { flush(); close(); return; }
      close(); para.push(l);
    });
    flush(); close();
    if (sources) html += '<p class="chat-src"><strong>Sources:</strong> ' + inline(sources) + '</p>';
    return html;
  }

  function add(cls, html) {
    var d = document.createElement('div');
    d.className = 'chat-msg ' + cls;
    d.innerHTML = html;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }

  function updateLeft() {
    var n = Math.max(0, FREE_QUESTIONS - used());
    if (left) left.textContent = n === 1 ? '1 free question left today' : n + ' free questions left today';
  }

  function referral() {
    form.hidden = true;
    if (left) left.hidden = true;
    var starters = root.querySelector('.chat-starters'); if (starters) starters.hidden = true;
    add('chat-refer',
      '<p class="eyebrow">Need more help?</p>' +
      '<h3>Get unlimited answers from our specialists</h3>' +
      '<p>You have used your ' + FREE_QUESTIONS + ' free questions for today. Our <strong>Advisory Partnership</strong> gives your council unlimited access to experienced housing finance consultants by phone, email or meeting, for one annual subscription with no per-query charges.</p>' +
      '<div class="chat-refer-ctas"><a class="btn btn-civic" href="' + ADVISORY + '">About the Advisory Partnership</a>' +
      '<a class="btn btn-outline" href="' + CONTACT_PAGE + '">Request a call back</a></div>');
  }

  function setBusy(b) { busy = b; send.disabled = b; box.disabled = b; }

  function ask(q) {
    q = String(q || '').trim().slice(0, MAX_LEN);
    if (!q || busy) return;
    if (used() >= FREE_QUESTIONS) { referral(); return; }
    var starters = root.querySelector('.chat-starters'); if (starters) starters.hidden = true;
    add('chat-me', esc(q));
    history.push({ role: 'user', content: q });
    box.value = ''; resize();
    setBusy(true);
    var wait = add('chat-bot', '<span class="chat-typing"><i></i><i></i><i></i> Checking the knowledge base…</span>');

    if (!ENDPOINT) {
      history.pop();
      wait.className = 'chat-msg chat-err';
      wait.innerHTML = 'The assistant is being set up and will be available shortly. In the meantime, email <a href="mailto:info@haverlyconsulting.co.uk">info@haverlyconsulting.co.uk</a>.';
      setBusy(false);
      return;
    }

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history.slice(-10) })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (!r.ok || !data.reply) { var e = new Error(data.error || 'unavailable'); e.userMessage = data.error; throw e; }
        return data.reply;
      });
    }).then(function (reply) {
      wait.innerHTML = render(reply);
      history.push({ role: 'assistant', content: reply });
      bump();
      updateLeft();
      if (used() >= FREE_QUESTIONS) setTimeout(referral, 400);
    }).catch(function (e) {
      history.pop();
      wait.className = 'chat-msg chat-err';
      wait.innerHTML = inline((e && e.userMessage) || 'Sorry, the assistant could not answer just now. Please try again, or email info@haverlyconsulting.co.uk.');
    }).then(function () {
      setBusy(false);
      if (!form.hidden) box.focus();
      log.scrollTop = log.scrollHeight;
    });
  }

  function resize() { box.style.height = 'auto'; box.style.height = Math.min(box.scrollHeight, 140) + 'px'; }
  box.addEventListener('input', resize);
  box.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(box.value); } });
  form.addEventListener('submit', function (e) { e.preventDefault(); ask(box.value); });
  root.querySelectorAll('.chat-starters button').forEach(function (b) {
    b.addEventListener('click', function () { ask(b.textContent); });
  });

  updateLeft();
  if (used() >= FREE_QUESTIONS) referral();
})();
