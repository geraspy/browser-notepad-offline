const NOTE_KEY = 'quick_notepad_note';
const HISTORY_KEY = 'quick_notepad_history';
const HISTORY_INDEX_KEY = 'quick_notepad_history_index';
const textarea = document.getElementById('note');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const openBtn = document.getElementById('openBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');

const MAX_HEIGHT = 300;
const MAX_HISTORY = 500;
const DEBOUNCE_MS = 300;

let history = [];
let historyIndex = -1;
let isUndoing = false;
let debounceTimer = null;
let lastSavedText = '';

chrome.storage.local.get([NOTE_KEY, HISTORY_KEY, HISTORY_INDEX_KEY], (res) => {
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
  checkSize();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;

  if (changes[NOTE_KEY] && !isUndoing) {
    const newText = changes[NOTE_KEY].newValue || '';
    if (newText !== textarea.value) {
      textarea.value = newText;
      lastSavedText = newText;
      checkSize();
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
  checkSize();
});

function checkSize() {
  textarea.style.overflowY = 'hidden';
  textarea.style.height = 'auto';

  const scrollH = textarea.scrollHeight;

  if (scrollH > MAX_HEIGHT) {
    textarea.style.height = MAX_HEIGHT + 'px';
    textarea.style.overflowY = 'auto';
    openBtn.style.display = 'inline-block';
  } else {
    textarea.style.height = scrollH + 'px';
    textarea.style.overflowY = 'hidden';
    openBtn.style.display = 'none';
  }
}

undoBtn.addEventListener('click', () => {
  if (historyIndex > 0) {
    isUndoing = true;
    historyIndex--;
    textarea.value = history[historyIndex];
    lastSavedText = textarea.value;
    chrome.storage.local.set({ [NOTE_KEY]: textarea.value });
    saveHistory();
    updateUndoRedoButtons();
    checkSize();
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
    checkSize();
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
    copyBtn.textContent = 'Скопировано!';
    setTimeout(() => {
      copyBtn.textContent = originalText;
    }, 1200);
  } catch (err) {
    console.error('Clipboard error:', err);
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Error copy';
    setTimeout(() => {
      copyBtn.textContent = originalText;
    }, 1500);
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
  checkSize();
});

openBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'open_notepad_window' });
});