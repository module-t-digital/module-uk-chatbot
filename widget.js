window.MTUK_CHAT_CONFIG=window.MTUK_CHAT_CONFIG||{};window.MTUK_CHAT_CONFIG.endpoint="https://script.google.com/macros/s/AKfycbyEj_jjx89YiXqT7bFx1YWB-Fi0AGlXuGEjyODgGITpwqOx_QfDC8wITT6Oy-SpjxcZ/exec";
/* Module-T UK - AI live chat widget. ES5 only (GTM Custom HTML compatible). */
(function () {
  if (window.__mtukChatLoaded) return;
  window.__mtukChatLoaded = true;

  var defaults = {
    endpoint: '',                       // Apps Script Web App URL (.../exec)
    color: '#D81E2A',                   // brand red
    bottom: 96,                         // px from bottom (sits above the site's WhatsApp button)
    right: 20,
    phone: '+44 7868 291260',
    whatsapp: '447868291260',
    privacyUrl: 'https://module-t.co.uk/contact/',
    title: 'MODULE-T UK',
    logoUrl: 'https://module-t.co.uk/wp-content/uploads/2025/12/logo.webp',
    subtitle: 'Ask us anything \u00b7 Replies instantly',
    greeting: "Hi there \ud83d\udc4b I'm the Module-T assistant. Looking for a site office, toilet cabin, changing room or a larger modular building? Ask me anything or get a free quote.",
    quickReplies: ['Office containers', 'Toilet cabins', 'Changing rooms', 'Security cabins', 'Site offices', 'Get a free quote', 'Other'],
    teaser: 'Need a cabin? Get a free quote in 2 minutes',
    teaserDelayMs: 15000,
    transport: null                     // optional custom function(payload) -> Promise<{reply}>
  };
  var cfg = window.MTUK_CHAT_CONFIG || {};
  var C = {};
  for (var k in defaults) if (defaults.hasOwnProperty(k)) C[k] = cfg.hasOwnProperty(k) ? cfg[k] : defaults[k];

  var STORE_KEY = 'mtuk_chat_v1';
  var state = load() || { sessionId: newId(), messages: [{ role: 'assistant', content: C.greeting }], chips: true, teaserSeen: false };
  var busy = false;

  function newId() { return 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }
  function load() { try { var s = sessionStorage.getItem(STORE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
  function save() { try { sessionStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {} }
  function track(ev, extra) {
    try { window.dataLayer = window.dataLayer || []; var o = { event: ev }; if (extra) for (var x in extra) o[x] = extra[x]; window.dataLayer.push(o); } catch (e) {}
  }

  // ---- fonts
  if (!document.getElementById('mtuk-fonts')) {
    var lf = document.createElement('link');
    lf.id = 'mtuk-fonts'; lf.rel = 'stylesheet';
    lf.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@400;500;600;700&display=swap';
    document.head.appendChild(lf);
  }

  // ---- styles
  var R = C.color;
  var css = '' +
    '#mtuk-chat,#mtuk-chat *{box-sizing:border-box;font-family:Montserrat,Arial,sans-serif;}' +
    '#mtuk-chat{position:fixed;right:' + C.right + 'px;bottom:' + C.bottom + 'px;z-index:2147483000;}' +
    '#mtuk-launch{width:60px;height:60px;border-radius:50%;border:0;background:' + R + ';color:#fff;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;transition:transform .2s;}' +
    '#mtuk-launch:hover{transform:scale(1.06);}#mtuk-launch svg{width:28px;height:28px;}' +
    '#mtuk-launch:focus-visible,#mtuk-chat button:focus-visible{outline:3px solid #222;outline-offset:2px;}' +
    '#mtuk-dot{position:absolute;top:2px;right:2px;width:14px;height:14px;border-radius:50%;background:#22c55e;border:2px solid #fff;}' +
    '#mtuk-teaser{position:absolute;right:0;bottom:74px;width:240px;background:#fff;color:#222;padding:12px 30px 12px 14px;border-radius:12px;font-size:13px;line-height:1.4;box-shadow:0 6px 24px rgba(0,0,0,.18);cursor:pointer;font-weight:500;}' +
    '#mtuk-teaser:after{content:"";position:absolute;right:22px;bottom:-7px;border:7px solid transparent;border-bottom:0;border-top-color:#fff;}' +
    '#mtuk-teaser-x{position:absolute;top:4px;right:6px;border:0;background:none;font-size:16px;color:#999;cursor:pointer;}' +
    '#mtuk-panel{position:absolute;right:0;bottom:76px;width:370px;height:560px;max-height:calc(100vh - ' + (C.bottom + 96) + 'px);background:#fff;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.25);display:none;flex-direction:column;overflow:hidden;}' +
    '#mtuk-chat.mtuk-open #mtuk-panel{display:flex;}' +
    '#mtuk-head{display:flex;align-items:center;gap:10px;padding:14px 14px 12px 18px;border-bottom:3px solid ' + R + ';background:#fff;}' +
    '#mtuk-head .mtuk-logo{display:block;height:34px;width:auto;max-width:180px;margin-bottom:4px;}' +
    '#mtuk-head .mtuk-t{font-family:"Bebas Neue",Impact,sans-serif;font-size:26px;letter-spacing:1px;color:' + R + ';line-height:1;}' +
    '#mtuk-head .mtuk-s{font-size:12px;color:#555;margin-top:3px;display:flex;align-items:center;gap:6px;}' +
    '#mtuk-head .mtuk-s:before{content:"";width:8px;height:8px;border-radius:50%;background:#22c55e;display:inline-block;}' +
    '#mtuk-close{margin-left:auto;border:0;background:#f2f2f2;width:32px;height:32px;border-radius:50%;cursor:pointer;color:#333;font-size:18px;line-height:1;}' +
    '#mtuk-msgs{flex:1;overflow-y:auto;padding:16px 14px;background:#f6f6f7;display:flex;flex-direction:column;gap:10px;}' +
    '.mtuk-m{max-width:85%;padding:10px 13px;border-radius:14px;font-size:14px;line-height:1.5;word-wrap:break-word;white-space:normal;}' +
    '.mtuk-a{background:#fff;color:#222;border-bottom-left-radius:4px;align-self:flex-start;box-shadow:0 1px 2px rgba(0,0,0,.06);}' +
    '.mtuk-u{background:' + R + ';color:#fff;border-bottom-right-radius:4px;align-self:flex-end;}' +
    '.mtuk-a a{color:' + R + ';font-weight:600;}.mtuk-u a{color:#fff;}' +
    '.mtuk-typing span{display:inline-block;width:7px;height:7px;margin:0 2px;border-radius:50%;background:#aaa;animation:mtukb 1.2s infinite;}' +
    '.mtuk-typing span:nth-child(2){animation-delay:.2s}.mtuk-typing span:nth-child(3){animation-delay:.4s}' +
    '@keyframes mtukb{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-5px);opacity:1}}' +
    '#mtuk-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 10px;background:#f6f6f7;}' +
    '#mtuk-chips button{border:1px solid ' + R + ';color:' + R + ';background:#fff;border-radius:16px;padding:6px 12px;font-size:12.5px;font-weight:600;cursor:pointer;}' +
    '#mtuk-chips button:hover{background:' + R + ';color:#fff;}' +
    '#mtuk-form{display:flex;gap:8px;padding:10px 12px;border-top:1px solid #eee;background:#fff;align-items:flex-end;}' +
    '#mtuk-input{flex:1;resize:none;border:1px solid #ddd;border-radius:12px;padding:10px 12px;font-size:14px;max-height:110px;min-height:42px;outline:none;color:#222;}' +
    '#mtuk-input:focus{border-color:' + R + ';}' +
    '#mtuk-send{width:42px;height:42px;border-radius:50%;border:0;background:' + R + ';color:#fff;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;}' +
    '#mtuk-send:disabled{opacity:.45;cursor:default;}#mtuk-send svg{width:18px;height:18px;}' +
    '#mtuk-foot{padding:6px 12px 10px;font-size:11px;color:#888;background:#fff;text-align:center;line-height:1.5;}' +
    '#mtuk-foot a{color:#555;font-weight:600;text-decoration:none;margin:0 6px;}#mtuk-foot a.mtuk-pl{font-weight:400;text-decoration:underline;margin:0;color:#888;}' +
    '@media (max-width:480px){#mtuk-chat.mtuk-open{right:0;bottom:0;left:0;top:0;}' +
    '#mtuk-chat.mtuk-open #mtuk-panel{position:fixed;inset:0;width:100%;height:100%;max-height:none;border-radius:0;}' +
    '#mtuk-chat.mtuk-open #mtuk-launch{display:none;}#mtuk-input{font-size:16px;}}';

  var st = document.createElement('style');
  st.id = 'mtuk-style';
  st.appendChild(document.createTextNode(css));
  document.head.appendChild(st);

  // ---- DOM
  var ICON_CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  var ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  var ICON_SEND = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z"/></svg>';

  var root = document.createElement('div');
  root.id = 'mtuk-chat';
  root.innerHTML = '' +
    '<div id="mtuk-panel" role="dialog" aria-label="Module-T UK chat">' +
      '<div id="mtuk-head"><div>' + (C.logoUrl ? '<img class="mtuk-logo" src="' + esc(C.logoUrl) + '" alt="' + esc(C.title) + '">' : '<div class="mtuk-t">' + esc(C.title) + '</div>') + '<div class="mtuk-s">' + esc(C.subtitle) + '</div></div>' +
      '<button id="mtuk-close" type="button" aria-label="Close chat">&times;</button></div>' +
      '<div id="mtuk-msgs" aria-live="polite"></div>' +
      '<div id="mtuk-chips"></div>' +
      '<form id="mtuk-form"><textarea id="mtuk-input" rows="1" placeholder="Type your message..." aria-label="Your message" maxlength="1500"></textarea>' +
      '<button id="mtuk-send" type="submit" aria-label="Send">' + ICON_SEND + '</button></form>' +
      '<div id="mtuk-foot"><a href="tel:' + C.phone.replace(/\s/g, '') + '">\u260e ' + esc(C.phone) + '</a>' +
      '<a href="https://wa.me/' + C.whatsapp + '" target="_blank" rel="noopener">WhatsApp</a><br>' +
      'AI assistant \u00b7 Details you share are used only to reply to your enquiry. <a class="mtuk-pl" href="' + esc(C.privacyUrl) + '" target="_blank" rel="noopener">Privacy</a></div>' +
    '</div>' +
    '<button id="mtuk-launch" type="button" aria-label="Open chat">' + ICON_CHAT + '<span id="mtuk-dot"></span></button>';
  (document.body || document.documentElement).appendChild(root);

  var $ = function (id) { return document.getElementById(id); };
  var msgsEl = $('mtuk-msgs'), chipsEl = $('mtuk-chips'), input = $('mtuk-input'), sendBtn = $('mtuk-send'), launch = $('mtuk-launch');

  // ---- rendering
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function format(text) {
    var tokens = [];
    var keep = function (html) { tokens.push(html); return '\u0000' + (tokens.length - 1) + '\u0000'; };
    var s = esc(text);
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, function (m, t, u) { return keep('<a href="' + u + '" target="_blank" rel="noopener">' + t + '</a>'); });
    s = s.replace(/https?:\/\/[^\s<]+[^\s<.,;:!?)]/g, function (u) {
      var label = u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
      return keep('<a href="' + u + '" target="_blank" rel="noopener">' + label + '</a>');
    });
    s = s.replace(/\+44(?:\s?\d){10}/g, function (p) { return keep('<a href="tel:' + p.replace(/\s/g, '') + '">' + p + '</a>'); });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
    s = s.replace(/^\s*[-*]\s+/gm, '\u2022 ');
    s = s.replace(/\n/g, '<br>');
    s = s.replace(/\u0000(\d+)\u0000/g, function (m, i) { return tokens[+i]; });
    return s;
  }

  function addBubble(role, content) {
    var d = document.createElement('div');
    d.className = 'mtuk-m ' + (role === 'user' ? 'mtuk-u' : 'mtuk-a');
    d.innerHTML = format(content);
    msgsEl.appendChild(d);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  function renderAll() {
    msgsEl.innerHTML = '';
    for (var i = 0; i < state.messages.length; i++) addBubble(state.messages[i].role, state.messages[i].content);
    renderChips();
  }

  function renderChips() {
    chipsEl.innerHTML = '';
    if (!state.chips || !C.quickReplies || !C.quickReplies.length) { chipsEl.style.display = 'none'; return; }
    chipsEl.style.display = 'flex';
    for (var i = 0; i < C.quickReplies.length; i++) {
      (function (label) {
        var b = document.createElement('button');
        b.type = 'button'; b.textContent = label;
        b.onclick = function () { send(label); };
        chipsEl.appendChild(b);
      })(C.quickReplies[i]);
    }
  }

  var typingEl = null;
  function showTyping(on) {
    if (on && !typingEl) {
      typingEl = document.createElement('div');
      typingEl.className = 'mtuk-m mtuk-a mtuk-typing';
      typingEl.setAttribute('aria-label', 'Assistant is typing');
      typingEl.innerHTML = '<span></span><span></span><span></span>';
      msgsEl.appendChild(typingEl);
      msgsEl.scrollTop = msgsEl.scrollHeight;
    } else if (!on && typingEl) {
      typingEl.parentNode.removeChild(typingEl); typingEl = null;
    }
  }

  // ---- open / close
  function setOpen(open) {
    if (open) { root.className = 'mtuk-open'; launch.innerHTML = ICON_X; launch.setAttribute('aria-label', 'Close chat'); hideTeaser(); track('mtuk_chat_open'); setTimeout(function () { input.focus(); }, 50); }
    else { root.className = ''; launch.innerHTML = ICON_CHAT; launch.setAttribute('aria-label', 'Open chat'); }
    state.open = open; save();
  }
  launch.onclick = function () { setOpen(root.className !== 'mtuk-open'); };
  $('mtuk-close').onclick = function () { setOpen(false); };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.className === 'mtuk-open') setOpen(false); });

  // ---- teaser
  var teaserEl = null;
  function hideTeaser() { if (teaserEl && teaserEl.parentNode) teaserEl.parentNode.removeChild(teaserEl); teaserEl = null; state.teaserSeen = true; save(); }
  if (C.teaser && !state.teaserSeen && state.messages.length <= 1) {
    setTimeout(function () {
      if (state.teaserSeen || root.className === 'mtuk-open') return;
      teaserEl = document.createElement('div');
      teaserEl.id = 'mtuk-teaser';
      teaserEl.innerHTML = esc(C.teaser) + '<button id="mtuk-teaser-x" type="button" aria-label="Dismiss">&times;</button>';
      teaserEl.onclick = function (e) { if (e.target && e.target.id === 'mtuk-teaser-x') { hideTeaser(); return; } setOpen(true); };
      root.appendChild(teaserEl);
    }, C.teaserDelayMs);
  }

  // ---- sending
  function defaultTransport(payload) {
    return new Promise(function (resolve, reject) {
      if (!C.endpoint) { reject(new Error('No endpoint configured')); return; }
      var done = false;
      var t = setTimeout(function () { if (!done) { done = true; reject(new Error('timeout')); } }, 60000);
      fetch(C.endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json(); })
        .then(function (j) { if (!done) { done = true; clearTimeout(t); resolve(j); } })
        ['catch'](function (e) { if (!done) { done = true; clearTimeout(t); reject(e); } });
    });
  }

  function send(text) {
    text = String(text || '').replace(/^\s+|\s+$/g, '');
    if (!text || busy) return;
    busy = true; sendBtn.disabled = true;
    state.chips = false; renderChips();
    state.messages.push({ role: 'user', content: text });
    save(); addBubble('user', text);
    input.value = ''; autosize();
    if (state.messages.length === 2) track('mtuk_chat_first_message');
    showTyping(true);

    var payload = { sessionId: state.sessionId, page: location.href, messages: state.messages.slice(-24) };
    var tr = typeof C.transport === 'function' ? C.transport : defaultTransport;
    tr(payload).then(function (res) {
      var reply = (res && res.reply) || "Sorry, something went wrong. Please call " + C.phone + ".";
      finish(reply);
      if (res && res.leadSaved) track('mtuk_chat_lead');
    }, function () {
      finish("Sorry, I couldn't connect just now. Please try again, call " + C.phone + " or message us on WhatsApp: https://wa.me/" + C.whatsapp);
    });
  }

  function finish(reply) {
    showTyping(false);
    state.messages.push({ role: 'assistant', content: reply });
    save(); addBubble('assistant', reply);
    busy = false; sendBtn.disabled = false;
    input.focus();
  }

  function autosize() { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 110) + 'px'; }
  input.addEventListener('input', autosize);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input.value); }
  });
  $('mtuk-form').addEventListener('submit', function (e) { e.preventDefault(); send(input.value); });

  renderAll();
  if (state.open) setOpen(true);

  window.MTUKChat = { open: function () { setOpen(true); }, close: function () { setOpen(false); }, send: send,
    reset: function () { try { sessionStorage.removeItem(STORE_KEY); } catch (e) {} state = { sessionId: newId(), messages: [{ role: 'assistant', content: C.greeting }], chips: true, teaserSeen: true }; renderAll(); } };
})();
