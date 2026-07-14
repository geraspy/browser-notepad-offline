const NOTE_KEY = 'quick_notepad_note';
const HISTORY_KEY = 'quick_notepad_history';
const HISTORY_INDEX_KEY = 'quick_notepad_history_index';
const textarea = document.getElementById('note');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const langSelect = document.getElementById('langSelect');

const MAX_HISTORY = 500;
const DEBOUNCE_MS = 300;

let history = [];
let historyIndex = -1;
let isUndoing = false;
let debounceTimer = null;
let lastSavedText = '';
let currentLang = 'en';

/* ---------- language ---------- */

function populateLangOptions() {
  langSelect.innerHTML = '';
  Object.keys(LANG_NAMES).forEach((code) => {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = LANG_NAMES[code];
    langSelect.appendChild(opt);
  });
}

function applyLang(lang) {
  currentLang = TRANSLATIONS[lang] ? lang : 'en';
  langSelect.value = currentLang;

  copyBtn.textContent = t(currentLang, 'copy');
  clearBtn.textContent = t(currentLang, 'clear');
  undoBtn.title = t(currentLang, 'undo');
  redoBtn.title = t(currentLang, 'redo');
  textarea.placeholder = t(currentLang, 'placeholder');

  const rtl = RTL_LANGS.includes(currentLang);
  document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr');
}

populateLangOptions();

langSelect.addEventListener('change', () => {
  chrome.storage.local.set({ [LANG_KEY]: langSelect.value });
  applyLang(langSelect.value);
});

/* ---------- load state ---------- */

chrome.storage.local.get([NOTE_KEY, HISTORY_KEY, HISTORY_INDEX_KEY, LANG_KEY], (res) => {
  applyLang(res[LANG_KEY] || defaultLang());

  const text = res[NOTE_KEY] || '';
  textarea.value = text;
  lastSavedText = text;

  if (res[HISTORY_KEY] && Array.isArray(res[HISTORY_KEY]) && res[HISTORY_KEY].length > 0) {
    history = res[HISTORY_KEY];
    historyIndex = res[HISTORY_INDEX_KEY] !== undefined ? res[HISTORY_INDEX_KEY] : history.length - 1;
    if (historyIndex < 0) historyIndex = 0;
    if (historyIndex >= history.length) historyIndex = history.length - 1;
  } else {
    history = [text];
    historyIndex = 0;
    saveHistory();
  }

  updateUndoRedoButtons();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;

  if (changes[LANG_KEY]) {
    applyLang(changes[LANG_KEY].newValue || 'en');
  }

  if (changes[NOTE_KEY] && !isUndoing) {
    const newText = changes[NOTE_KEY].newValue || '';
    if (newText !== textarea.value) {
      textarea.value = newText;
      lastSavedText = newText;
    }
  }

  if (changes[HISTORY_KEY] || changes[HISTORY_INDEX_KEY]) {
    chrome.storage.local.get([HISTORY_KEY, HISTORY_INDEX_KEY], (res) => {
      if (res[HISTORY_KEY] && Array.isArray(res[HISTORY_KEY])) {
        history = res[HISTORY_KEY];
        historyIndex = res[HISTORY_INDEX_KEY] !== undefined ? res[HISTORY_INDEX_KEY] : history.length - 1;
        if (historyIndex < 0) historyIndex = 0;
        if (historyIndex >= history.length) historyIndex = history.length - 1;
        updateUndoRedoButtons();
      }
    });
  }
});

function saveHistory() {
  chrome.storage.local.set({
    [HISTORY_KEY]: history,
    [HISTORY_INDEX_KEY]: historyIndex
  });
}

function flushSave() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  const text = textarea.value;
  if (text === lastSavedText) return;

  lastSavedText = text;
  chrome.storage.local.set({ [NOTE_KEY]: text });

  if (historyIndex < history.length - 1) {
    history = history.slice(0, historyIndex + 1);
  }

  history.push(text);
  if (history.length > MAX_HISTORY + 1) {
    history.shift();
  } else {
    historyIndex++;
  }

  saveHistory();
  updateUndoRedoButtons();
}

textarea.addEventListener('input', () => {
  if (isUndoing) return;

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(flushSave, DEBOUNCE_MS);
});

undoBtn.addEventListener('click', () => {
  if (historyIndex > 0) {
    isUndoing = true;
    historyIndex--;
    textarea.value = history[historyIndex];
    lastSavedText = textarea.value;
    chrome.storage.local.set({ [NOTE_KEY]: textarea.value });
    saveHistory();
    updateUndoRedoButtons();
    isUndoing = false;
  }
});

redoBtn.addEventListener('click', () => {
  if (historyIndex < history.length - 1) {
    isUndoing = true;
    historyIndex++;
    textarea.value = history[historyIndex];
    lastSavedText = textarea.value;
    chrome.storage.local.set({ [NOTE_KEY]: textarea.value });
    saveHistory();
    updateUndoRedoButtons();
    isUndoing = false;
  }
});

function updateUndoRedoButtons() {
  undoBtn.disabled = historyIndex <= 0;
  redoBtn.disabled = historyIndex >= history.length - 1;
}

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(textarea.value);
    const originalText = copyBtn.textContent;
    copyBtn.textContent = t(currentLang, 'copied');
    setTimeout(() => { copyBtn.textContent = originalText; }, 1200);
  } catch (err) {
    console.error('Clipboard error:', err);
    const originalText = copyBtn.textContent;
    copyBtn.textContent = t(currentLang, 'errcopy');
    setTimeout(() => { copyBtn.textContent = originalText; }, 1500);
  }
}

copyBtn.addEventListener('click', copyToClipboard);

clearBtn.addEventListener('click', () => {
  textarea.value = '';
  lastSavedText = '';
  chrome.storage.local.set({ [NOTE_KEY]: '' });

  if (historyIndex < history.length - 1) {
    history = history.slice(0, historyIndex + 1);
  }
  history.push('');
  if (history.length > MAX_HISTORY + 1) {
    history.shift();
  } else {
    historyIndex++;
  }

  saveHistory();
  updateUndoRedoButtons();
});
