const NOTE_KEY = 'quick_notepad_note';

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[NOTE_KEY]) {
    const text = changes[NOTE_KEY].newValue || '';
    updateBadge(text.length);
  }
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get([NOTE_KEY], (res) => {
    const text = res[NOTE_KEY] || '';
    updateBadge(text.length);
  });
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get([NOTE_KEY], (res) => {
    const text = res[NOTE_KEY] || '';
    updateBadge(text.length);
  });
});

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


chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "open_notepad_window") {
    chrome.windows.create({
      url: "notepad_window.html",
      type: "popup",
      width: 600,
      height: 600
    });
  }
});