# Quick Notepad

A local notepad extension for Chrome. All notes are stored locally, not sent anywhere.

## Installation

1. Download / unzip the extension folder
2. In Chrome, open chrome://extensions/
3. Enable **Developer mode** (toggle in the top right)
4. Click **Load unpacked extension** and select the folder with the files
5. Done – the icon will appear in the toolbar

## Features

- Autosave
- Undo / Redo (up to 500 steps history)
- Copy all text in one click
- Separate editing window
- Character counter on the icon badge
- **Toolbar icon** (icons/ folder, 16/32/48/128 px)
- **Interface language** selector with popular languages (English, Русский, Español,
  Français, Deutsch, Português, Italiano, 中文, 日本語, 한국어, العربية, हिन्दी,
  Türkçe, Polski, Українська). The choice syncs between the popup and the window.
- **Right-click integration**
  - Select text on any page → right-click → **Add selection to Notepad**. The text is
    appended to your note immediately (undo history is kept in sync).
  - Right-click inside any editable field → **Insert text from Notepad**. Whatever is
    already saved in the note is inserted at the caret. Uses `activeTab` + `scripting`,
    so no broad site permissions are required.
