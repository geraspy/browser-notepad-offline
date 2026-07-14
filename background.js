importScripts('i18n.js');

const NOTE_KEY = 'quick_notepad_note';
const HISTORY_KEY = 'quick_notepad_history';
const HISTORY_INDEX_KEY = 'quick_notepad_history_index';
const MAX_HISTORY = 500;

const MENU_ADD = 'qn_add_selection';
const MENU_INSERT = 'qn_insert_note';

/* ---------- badge ---------- */

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[NOTE_KEY]) {
    const text = changes[NOTE_KEY].newValue || '';
    updateBadge(text.length);
  }
  // Rebuild menus with new labels when the UI language changes.
  if (area === 'local' && changes[LANG_KEY]) {
    buildMenus(changes[LANG_KEY].newValue);
  }
});

chrome.runtime.onStartup.addListener(refreshBadge);
chrome.runtime.onInstalled.addListener(() => {
  refreshBadge();
  buildMenus();
});

function refreshBadge() {
  chrome.storage.local.get([NOTE_KEY], (res) => {
    updateBadge((res[NOTE_KEY] || '').length);
  });
}

function updateBadge(count) {
  let badgeText = '';
  if (count === 0) {
    badgeText = '';
  } else if (count < 1000) {
    badgeText = String(count);
  } else if (count < 10000) {
    badgeText = (count / 1000).toFixed(1).replace('.0', '') + 'k';
  } else {
    badgeText = '9k+';
  }
  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setBadgeBackgroundColor({ color: '#2b6cb0' });
}

/* ---------- separate window ---------- */

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'open_notepad_window') {
    chrome.windows.create({
      url: 'notepad_window.html',
      type: 'popup',
      width: 600,
      height: 600
    });
  }
});

/* ---------- context menus ---------- */

function buildMenus(lang) {
  const apply = (l) => {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: MENU_ADD,
        title: t(l, 'ctxAdd'),
        contexts: ['selection']
      });
      chrome.contextMenus.create({
        id: MENU_INSERT,
        title: t(l, 'ctxInsert'),
        contexts: ['editable']
      });
    });
  };

  if (lang) { apply(lang); return; }
  chrome.storage.local.get([LANG_KEY], (res) => apply(res[LANG_KEY] || defaultLang()));
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_ADD && info.selectionText) {
    appendToNote(info.selectionText);
  } else if (info.menuItemId === MENU_INSERT && tab && tab.id != null) {
    insertNoteIntoPage(tab.id);
  }
});

/* Append selected page text to the note, keeping undo history in sync. */
function appendToNote(selection) {
  chrome.storage.local.get([NOTE_KEY, HISTORY_KEY, HISTORY_INDEX_KEY], (res) => {
    const current = res[NOTE_KEY] || '';
    const newText = current ? current + '\n' + selection : selection;

    let history = Array.isArray(res[HISTORY_KEY]) ? res[HISTORY_KEY].slice() : [current];
    let index = typeof res[HISTORY_INDEX_KEY] === 'number' ? res[HISTORY_INDEX_KEY] : history.length - 1;
    if (index < 0) index = 0;
    if (index > history.length - 1) index = history.length - 1;

    // Drop any "redo" branch, then push the new state.
    if (index < history.length - 1) history = history.slice(0, index + 1);
    history.push(newText);
    if (history.length > MAX_HISTORY + 1) history.shift();
    else index++;

    chrome.storage.local.set({
      [NOTE_KEY]: newText,
      [HISTORY_KEY]: history,
      [HISTORY_INDEX_KEY]: index
    });
  });
}

/* Read the current note and inject it into the focused field on the page. */
function insertNoteIntoPage(tabId) {
  chrome.storage.local.get([NOTE_KEY], (res) => {
    const noteText = res[NOTE_KEY] || '';
    if (!noteText) return;
    chrome.scripting.executeScript({
      target: { tabId },
      func: injectText,
      args: [noteText]
    }).catch((err) => console.error('Insert failed:', err));
  });
}

/* Runs inside the page. Inserts text at the caret of the active editable element. */
function injectText(text) {
  const el = document.activeElement;
  if (!el) return;

  const tag = (el.tagName || '').toLowerCase();
  if (tag === 'textarea' || (tag === 'input' && /^(text|search|url|email|tel|password|number|)$/i.test(el.type || ''))) {
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    el.value = el.value.slice(0, start) + text + el.value.slice(end);
    const caret = start + text.length;
    el.setSelectionRange(caret, caret);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  } else if (el.isContentEditable) {
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const node = document.createTextNode(text);
      range.insertNode(node);
      range.setStartAfter(node);
      range.setEndAfter(node);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      el.textContent += text;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
