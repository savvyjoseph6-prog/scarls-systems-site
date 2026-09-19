(function () {
  'use strict';

  var SUPABASE_URL = "https://zpytjifbhaxniuliopvp.supabase.co";
  var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpweXRqaWZiaGF4bml1bGlvcHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyOTMyNjgsImV4cCI6MjEwMzg2OTI2OH0.QFGo9feUbsle_fGxNZvxMaBuRQzS55RKF2_i0oL0LYQ";
  var SUPABASE_FUNCTIONS_BASE = SUPABASE_URL + "/functions/v1";

  var btn = document.getElementById('scarlsChatBtn');
  var panel = document.getElementById('scarlsChatPanel');
  var closeBtn = document.getElementById('scarlsChatClose');
  var body = document.getElementById('scarlsChatBody');
  var form = document.getElementById('scarlsChatForm');
  var input = document.getElementById('scarlsChatInput');
  var sendBtn = document.getElementById('scarlsChatSend');
  var escalatedNote = document.getElementById('scarlsChatEscalated');
  if (!btn || !panel || !form) return;

  var token = null;
  var escalated = false;

  // Typing-indicator styles (added here so no other file needs to change).
  var typingStyle = document.createElement('style');
  typingStyle.textContent =
    '.scarls-chat-msg.scarls-typing{display:flex;align-items:center;gap:5px;width:fit-content;min-height:22px;}' +
    '.scarls-chat-msg.scarls-typing span{width:7px;height:7px;border-radius:50%;background:currentColor;opacity:.35;animation:scarlsTypingBounce 1.2s infinite ease-in-out;}' +
    '.scarls-chat-msg.scarls-typing span:nth-child(2){animation-delay:.15s;}' +
    '.scarls-chat-msg.scarls-typing span:nth-child(3){animation-delay:.3s;}' +
    '@keyframes scarlsTypingBounce{0%,60%,100%{transform:translateY(0);opacity:.35;}30%{transform:translateY(-4px);opacity:1;}}';
  document.head.appendChild(typingStyle);

  btn.addEventListener('click', function () {
    panel.classList.toggle('is-open');
    if (panel.classList.contains('is-open')) input.focus();
  });
  closeBtn.addEventListener('click', function () { panel.classList.remove('is-open'); });

  function appendMsg(role, text) {
    var el = document.createElement('div');
    el.className = 'scarls-chat-msg ' + (role === 'user' ? 'user' : 'model');
    el.textContent = text;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
  }

  // "Assistant is typing" bubble with three bouncing dots.
  var typingEl = null;

  function showTyping() {
    if (typingEl) return;
    typingEl = document.createElement('div');
    typingEl.className = 'scarls-chat-msg model scarls-typing';
    typingEl.setAttribute('aria-label', 'The SCARLS assistant is typing');
    typingEl.innerHTML = '<span></span><span></span><span></span>';
    body.appendChild(typingEl);
    body.scrollTop = body.scrollHeight;
  }

  function hideTyping() {
    if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
    typingEl = null;
  }

  function setEscalated(isEscalated) {
    escalated = isEscalated;
    if (escalated) {
      escalatedNote.style.display = '';
      form.style.display = 'none';
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var message = input.value.trim();
    if (!message || escalated) return;

    appendMsg('user', message);
    input.value = '';
    input.disabled = true;
    sendBtn.disabled = true;
    showTyping();

    var endpoint = token ? '/chatbot-message' : '/chatbot-start';
    var payload = token ? { token: token, message: message } : { message: message };

    fetch(SUPABASE_FUNCTIONS_BASE + endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(payload)
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        hideTyping();
        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();
        if (!data || !data.ok) {
          appendMsg('model', (data && data.error) ? data.error : 'Sorry, something went wrong — please try again.');
          return;
        }
        if (!token) token = data.token;
        if (data.reply) appendMsg('model', data.reply);
        if (data.escalated) setEscalated(true);
      })
      .catch(function () {
        hideTyping();
        input.disabled = false;
        sendBtn.disabled = false;
        appendMsg('model', 'Network error — please try again, or use the WhatsApp button above.');
      });
  });
})();