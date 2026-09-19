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
        input.disabled = false;
        sendBtn.disabled = false;
        appendMsg('model', 'Network error — please try again, or use the WhatsApp button above.');
      });
  });
})();
