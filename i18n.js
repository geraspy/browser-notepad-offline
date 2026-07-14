// Shared translations for the whole extension (popup, window, background).
// DOM-free on purpose so background.js can load it via importScripts().

const LANG_KEY = 'quick_notepad_lang';

// Display names shown inside the language <select>.
const LANG_NAMES = {
  en: 'English',
  ru: 'Русский',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
  it: 'Italiano',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  ar: 'العربية',
  hi: 'हिन्दी',
  tr: 'Türkçe',
  pl: 'Polski',
  uk: 'Українська'
};

const TRANSLATIONS = {
  en: { copy:'copy', clear:'clear', open:'open note', undo:'undo', redo:'redo',
        copied:'Copied!', errcopy:'Copy error', placeholder:'Start typing…',
        lang:'Language', ctxAdd:'Add selection to Notepad', ctxInsert:'Insert text from Notepad' },
  ru: { copy:'копировать', clear:'очистить', open:'открыть', undo:'отменить', redo:'вернуть',
        copied:'Скопировано!', errcopy:'Ошибка копирования', placeholder:'Начните печатать…',
        lang:'Язык', ctxAdd:'Добавить в блокнот', ctxInsert:'Вставить из блокнота' },
  es: { copy:'copiar', clear:'borrar', open:'abrir', undo:'deshacer', redo:'rehacer',
        copied:'¡Copiado!', errcopy:'Error al copiar', placeholder:'Empieza a escribir…',
        lang:'Idioma', ctxAdd:'Añadir a la nota', ctxInsert:'Insertar desde la nota' },
  fr: { copy:'copier', clear:'effacer', open:'ouvrir', undo:'annuler', redo:'rétablir',
        copied:'Copié !', errcopy:'Erreur de copie', placeholder:'Commencez à écrire…',
        lang:'Langue', ctxAdd:'Ajouter au bloc-notes', ctxInsert:'Insérer depuis le bloc-notes' },
  de: { copy:'kopieren', clear:'löschen', open:'öffnen', undo:'rückgängig', redo:'wiederholen',
        copied:'Kopiert!', errcopy:'Kopierfehler', placeholder:'Tippen beginnen…',
        lang:'Sprache', ctxAdd:'Zum Notizblock hinzufügen', ctxInsert:'Aus Notizblock einfügen' },
  pt: { copy:'copiar', clear:'limpar', open:'abrir', undo:'desfazer', redo:'refazer',
        copied:'Copiado!', errcopy:'Erro ao copiar', placeholder:'Comece a digitar…',
        lang:'Idioma', ctxAdd:'Adicionar à nota', ctxInsert:'Inserir da nota' },
  it: { copy:'copia', clear:'cancella', open:'apri', undo:'annulla', redo:'ripeti',
        copied:'Copiato!', errcopy:'Errore di copia', placeholder:'Inizia a scrivere…',
        lang:'Lingua', ctxAdd:'Aggiungi al blocco note', ctxInsert:'Inserisci dal blocco note' },
  zh: { copy:'复制', clear:'清空', open:'打开', undo:'撤销', redo:'重做',
        copied:'已复制！', errcopy:'复制失败', placeholder:'开始输入…',
        lang:'语言', ctxAdd:'添加到记事本', ctxInsert:'从记事本插入' },
  ja: { copy:'コピー', clear:'消去', open:'開く', undo:'元に戻す', redo:'やり直し',
        copied:'コピーしました！', errcopy:'コピー失敗', placeholder:'入力を開始…',
        lang:'言語', ctxAdd:'メモに追加', ctxInsert:'メモから挿入' },
  ko: { copy:'복사', clear:'지우기', open:'열기', undo:'실행 취소', redo:'다시 실행',
        copied:'복사됨!', errcopy:'복사 오류', placeholder:'입력을 시작하세요…',
        lang:'언어', ctxAdd:'메모에 추가', ctxInsert:'메모에서 붙여넣기' },
  ar: { copy:'نسخ', clear:'مسح', open:'فتح', undo:'تراجع', redo:'إعادة',
        copied:'تم النسخ!', errcopy:'خطأ في النسخ', placeholder:'ابدأ الكتابة…',
        lang:'اللغة', ctxAdd:'إضافة إلى المفكرة', ctxInsert:'إدراج من المفكرة' },
  hi: { copy:'कॉपी', clear:'साफ़', open:'खोलें', undo:'पूर्ववत', redo:'फिर से',
        copied:'कॉपी हो गया!', errcopy:'कॉपी त्रुटि', placeholder:'लिखना शुरू करें…',
        lang:'भाषा', ctxAdd:'नोटपैड में जोड़ें', ctxInsert:'नोटपैड से डालें' },
  tr: { copy:'kopyala', clear:'temizle', open:'aç', undo:'geri al', redo:'yinele',
        copied:'Kopyalandı!', errcopy:'Kopyalama hatası', placeholder:'Yazmaya başlayın…',
        lang:'Dil', ctxAdd:'Not defterine ekle', ctxInsert:'Not defterinden ekle' },
  pl: { copy:'kopiuj', clear:'wyczyść', open:'otwórz', undo:'cofnij', redo:'ponów',
        copied:'Skopiowano!', errcopy:'Błąd kopiowania', placeholder:'Zacznij pisać…',
        lang:'Język', ctxAdd:'Dodaj do notatnika', ctxInsert:'Wstaw z notatnika' },
  uk: { copy:'копіювати', clear:'очистити', open:'відкрити', undo:'скасувати', redo:'повернути',
        copied:'Скопійовано!', errcopy:'Помилка копіювання', placeholder:'Почніть друкувати…',
        lang:'Мова', ctxAdd:'Додати до блокнота', ctxInsert:'Вставити з блокнота' }
};

const RTL_LANGS = ['ar'];

// Pick a sensible default from the browser locale, falling back to English.
function defaultLang() {
  try {
    const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
    return TRANSLATIONS[nav] ? nav : 'en';
  } catch (e) {
    return 'en';
  }
}

function t(lang, key) {
  const l = TRANSLATIONS[lang] ? lang : 'en';
  return (TRANSLATIONS[l] && TRANSLATIONS[l][key]) || TRANSLATIONS.en[key] || key;
}

// Expose for service worker (importScripts) context.
if (typeof self !== 'undefined') {
  self.LANG_KEY = LANG_KEY;
  self.LANG_NAMES = LANG_NAMES;
  self.TRANSLATIONS = TRANSLATIONS;
  self.RTL_LANGS = RTL_LANGS;
  self.t = t;
  self.defaultLang = defaultLang;
}
