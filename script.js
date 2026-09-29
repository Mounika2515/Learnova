const sections = document.querySelectorAll('.section');
const navItems = document.querySelectorAll('.nav-item');
function showSection(id) { sections.forEach(s => s.classList.toggle('active-section', s.id === id)); navItems.forEach(n => n.classList.toggle('active', n.dataset.section === id)); window.scrollTo({ top: 0, behavior: 'smooth' }); document.getElementById('sidebar').classList.remove('open') }
navItems.forEach(n => n.addEventListener('click', () => showSection(n.dataset.section)));
document.querySelectorAll('[data-section-target]').forEach(b => b.addEventListener('click', () => showSection(b.dataset.sectionTarget)));
document.getElementById('mobileMenu').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));

const speakingModes = {
  free: {
    label: '',
    title: '',
    description: ''
  },
  topic: {
    label: '🎯 TOPIC MODE',
    title: '“Describe a place that makes you feel calm”',
    description: 'Talk about the place, what it looks like and why it helps you relax.'
  },
  read: {
    label: '📝 READ & SPEAK',
    title: '“A small daily habit that improves your life”',
    description: 'Read the sentence first, then speak it naturally and explain it in your own words.'
  }
};

const topicLabel = document.querySelector('.topic-box span');
const topicTitle = document.querySelector('.topic-box h2');
const topicDescription = document.querySelector('.topic-box p');

function setSpeakingMode(mode) {
  const selected = speakingModes[mode] || speakingModes.free;

  document.querySelectorAll('.mode').forEach(button => {
    const isActive = button.textContent.trim().toLowerCase().includes(mode === 'free' ? 'free' : mode === 'topic' ? 'topic' : 'read');
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  if (topicLabel) {
    topicLabel.textContent = selected.label || '';
    topicLabel.style.display = selected.label ? 'block' : 'none';
  }
  if (topicTitle) {
    topicTitle.textContent = selected.title || 'Speak freely about anything you want.';
  }
  if (topicDescription) {
    topicDescription.textContent = selected.description || 'Use your own words and speak naturally for as long as you want.';
  }
}

document.querySelectorAll('.mode').forEach(button => {
  button.addEventListener('click', () => {
    const modeKey = button.textContent.trim().toLowerCase().includes('topic') ? 'topic' : button.textContent.trim().toLowerCase().includes('read') ? 'read' : 'free';
    setSpeakingMode(modeKey);
  });
});

setSpeakingMode('free');

const words = [['Resilient', '/rɪˈzɪliənt/', 'Able to recover quickly from difficulties.'], ['Curious', '/ˈkjʊəriəs/', 'Eager to learn, know, or discover something.'], ['Adaptable', '/əˈdæptəbəl/', 'Able to change easily to suit a new situation.'], ['Confident', '/ˈkɒnfɪdənt/', 'Feeling sure about your abilities or decisions.'], ['Persistent', '/pəˈsɪstənt/', 'Continuing firmly despite difficulty or delay.']]; let wi = 0;
function nextWord() { wi = (wi + 1) % words.length; const w = words[wi]; document.getElementById('wordTitle').textContent = w[0]; document.getElementById('bigWord').textContent = w[0]; document.querySelectorAll('.pron').forEach((x, i) => { if (i < 2) x.textContent = w[1] + ' · adjective' }); document.querySelector('.vocab-card p').textContent = w[2]; document.getElementById('challengeWord').textContent = w[0].toLowerCase(); document.getElementById('toast').textContent = 'New word: ' + w[0] + ' ✨'; toast() }
document.getElementById('newWord').onclick = nextWord; document.getElementById('vocabWord').onclick = nextWord;
function toast() { const t = document.getElementById('toast'); t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2200) }
let remaining = 60, timerId = null; const timerEl = document.getElementById('timer'); const customTimeInput = document.getElementById('customTimeInput'); const setCustomTimeButton = document.getElementById('setCustomTime');

function formatTime(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function applyDuration(seconds, { updateActiveState = true } = {}) {
  remaining = Math.max(1, Number(seconds) || 1);
  timerEl.textContent = formatTime(remaining);

  if (updateActiveState) {
    document.querySelectorAll('.time').forEach(x => x.classList.remove('active'));
    const customButton = document.querySelector('.custom-time-btn');
    if (customButton) customButton.classList.add('active');
  }
}

document.querySelectorAll('.time').forEach(btn => {
  if (btn.id === 'setCustomTime') return;
  btn.onclick = () => {
    document.querySelectorAll('.time').forEach(x => x.classList.remove('active'));
    btn.classList.add('active');
    remaining = parseInt(btn.textContent) * 60;
    timerEl.textContent = formatTime(remaining);
  };
});

if (setCustomTimeButton && customTimeInput) {
  const setCustomDuration = () => {
    const value = Number(customTimeInput.value);
    if (!Number.isFinite(value) || value <= 0) {
      customTimeInput.focus();
      return;
    }

    const minutes = Math.min(90, Math.max(1, Math.round(value)));
    customTimeInput.value = minutes;
    document.querySelectorAll('.time').forEach(x => x.classList.remove('active'));
    setCustomTimeButton.classList.add('active');
    remaining = minutes * 60;
    timerEl.textContent = formatTime(remaining);
  };

  setCustomTimeButton.onclick = setCustomDuration;
  customTimeInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      setCustomDuration();
    }
  });
}

document.getElementById('recordBtn').onclick = () => { if (timerId) return; const b = document.getElementById('recordBtn'); b.innerHTML = '⏹ Stop Recording'; b.style.background = 'linear-gradient(135deg,#e85d8f,#d94475)'; timerId = setInterval(() => { remaining--; timerEl.textContent = formatTime(remaining); if (remaining <= 0) stopRecord() }, 1000); toastText('Recording started 🎙️') }; function stopRecord() { clearInterval(timerId); timerId = null; const b = document.getElementById('recordBtn'); b.innerHTML = '🎙 Start Recording'; b.style.background = 'linear-gradient(135deg,#7357f4,#9b6cff)'; toastText('Practice complete! AI feedback can be connected here ✨') };
function toastText(x) { document.getElementById('toast').textContent = x; toast() }
const conversationChatInput = document.getElementById('chatInput');
const conversationSendButton = document.getElementById('sendChat');
const conversationMessages = document.getElementById('messages');

if (!conversationChatInput || !conversationSendButton || !conversationMessages) {
  // No fallback demo chat is included; the conversation section starts empty.
}

