'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Direct bridge into the Collabora iframe.
 *
 * Because docs.velr.app and the Collabora endpoint are now the same origin,
 * the parent can directly access the iframe's window/document — no
 * postMessage hop needed. We:
 *   1. Wait for window.app.map to exist on the iframe.
 *   2. Call app.map.sendUnoCommand(...) for every toolbar command.
 *   3. Subscribe to app.map.on('commandstatechanged', ...) to track which
 *      formatting marks are active under the cursor so the toolbar can
 *      highlight them.
 *   4. Inject a <style> tag into the iframe's <head> that strips out
 *      every Collabora chrome surface (notebookbar, menubar, toolbars,
 *      sidebars, status bar) so the only thing left is the document canvas.
 *
 * If for some reason the direct API isn't available (origin mismatch,
 * sandbox), we silently fall back to postMessage and log a warning.
 */

export interface ActiveState {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  subscript?: boolean;
  superscript?: boolean;
  alignLeft?: boolean;
  alignCenter?: boolean;
  alignRight?: boolean;
  alignJustify?: boolean;
  bulletList?: boolean;
  orderedList?: boolean;
  blockquote?: boolean;
  link?: boolean;
  font?: string;
  fontSize?: string;
  color?: string;
  highlight?: string;
  canUndo?: boolean;
  canRedo?: boolean;
  /** Currently-applied paragraph style name (e.g. "Heading 1") */
  paraStyle?: string;
}

const ALIGN_UNO: Record<'left' | 'center' | 'right' | 'justify', string> = {
  left: '.uno:LeftPara',
  center: '.uno:CenterPara',
  right: '.uno:RightPara',
  justify: '.uno:JustifyPara',
};

export interface CollaboraCommands {
  bold:        () => void;
  italic:      () => void;
  underline:   () => void;
  strike:      () => void;
  subscript:   () => void;
  superscript: () => void;
  align: (which: 'left' | 'center' | 'right' | 'justify') => void;
  bulletList:    () => void;
  orderedList:   () => void;
  blockquote:    () => void;
  undo: () => void;
  redo: () => void;
  selectAll: () => void;
  cut:       () => void;
  copy:      () => void;
  paste:     () => void;
  pageBreak:  () => void;
  hLine:      () => void;
  insertLink: (url: string) => void;
  unsetLink:  () => void;
  insertTable: (rows: number, cols: number) => void;
  setFont:     (family: string) => void;
  setFontSize: (pt: number | string) => void;
  setColor:    (hex: string) => void;
  setHighlight:(hex: string) => void;
  clearFormatting: () => void;
  setHeading: (level: 0 | 1 | 2 | 3 | 4 | 5 | 6) => void;
  setParaStyle: (styleName: string) => void;
  setDirection: (dir: 'ltr' | 'rtl') => void;
  zoom:    (pct: number) => void;
  zoomIn:  () => void;
  zoomOut: () => void;
  /** Open a file picker and insert the chosen image at the caret. */
  insertImage: () => Promise<void>;
  /** Begin drawing a horizontal text frame (click+drag on canvas). */
  insertTextBox: () => void;
  /** Begin drawing a vertical text frame. */
  insertVerticalTextBox: () => void;
  uno: (command: string, args?: Record<string, unknown>) => void;
}

/* ─── CSS we inject into the iframe to strip Collabora chrome ─────────────
   Whitelist approach: hide every body child EXCEPT the map (document
   canvas) and necessary support elements (dialogs, context menus). Far
   more reliable than trying to enumerate every chrome class — works even
   for elements Collabora adds at runtime. */
const STRIPPED_CHROME_CSS = `
  /* 1. Hide the major chrome surfaces explicitly. */
  #toolbar-wrapper,
  #toolbar-row,
  #toolbar-up,
  #toolbar-down,
  #toolbar-mobile-back,
  #toolbar-hamburger,
  #toolbar-search,
  #toolbar-logo,
  #document-titlebar,
  #document-name-input,
  #document-name-input-loading-bar,
  #main-menu,
  .main-nav,
  .menubar, .menubar-shell,
  .cool-toolbar,
  .notebookbar-shortcuts-bar,
  .notebookbar-tabs-container,
  .notebookbar,
  #shortcuts-toolbar,
  #presentation-toolbar,
  #presentation-controls-wrapper,
  #spreadsheet-toolbar,
  #formulabar, #formulabar-row,
  #tb_editbar,
  #mobile-edit-button,
  #sidebar-dock-wrapper,
  #navigator-dock-wrapper,
  #quickfind-dock-wrapper,
  #userListHeader,
  #userListSummary,
  #followingChip,
  #sidebar-panel,
  .sidebar-panel,
  #navigator-panel,
  #quickfind-panel { display: none !important; }

  /* When body has .velr-show-sidebar, reveal the properties sidebar */
  body.velr-show-sidebar #sidebar-panel,
  body.velr-show-sidebar .sidebar-panel,
  body.velr-show-sidebar #sidebar-dock-wrapper {
    display: block !important;
    position: fixed !important;
    right: 0 !important; top: 0 !important; bottom: 0 !important;
    width: 320px !important;
    z-index: 50 !important;
    background: #ffffff !important;
    border-left: 1px solid #c6c6c6 !important;
    overflow-y: auto !important;
  }
  body.velr-show-sidebar #main-document-content,
  body.velr-show-sidebar #document-container,
  body.velr-show-sidebar #map {
    right: 320px !important;
    width: calc(100% - 320px) !important;
  }

  /* 2. Make the document area fill the iframe completely. */
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    height: 100% !important;
    width: 100% !important;
    overflow: hidden !important;
    background: #f8fafe !important;
  }
  #main-document-content,
  #document-container {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
  }
  #map, .leaflet-container, .canvas-container {
    width: 100% !important;
    height: 100% !important;
    top: 0 !important;
    background: #f8fafe !important;
  }

  /* 3. Keep dialogs / context menus visible (they overlay the doc). */
  .jsdialog, .lokdialog, .context-menu, #mobile-wizard {
    z-index: 100000 !important;
  }
`;

interface CollaboraGlobals {
  app?: {
    map?: {
      sendUnoCommand: (cmd: string, args?: any) => void;
      on: (event: string, handler: (e: any) => void) => void;
      off: (event: string, handler: (e: any) => void) => void;
    };
  };
}

function getCollabora(iframe: HTMLIFrameElement | null): CollaboraGlobals['app'] | null {
  try {
    return (iframe?.contentWindow as any)?.app ?? null;
  } catch {
    return null;
  }
}

function buildCommands(getIframe: () => HTMLIFrameElement | null): CollaboraCommands {
  function direct(cmd: string, args?: Record<string, unknown>) {
    const app = getCollabora(getIframe());
    if (app?.map?.sendUnoCommand) {
      try { app.map.sendUnoCommand(cmd, args); return; } catch (e) { console.warn('sendUnoCommand failed', e); }
    }
    // Fallback: postMessage
    const win = getIframe()?.contentWindow;
    if (win) {
      win.postMessage(JSON.stringify({
        MessageId: 'Send_UNO_Command',
        SendTime: Date.now(),
        Values: args ? { Command: cmd, Args: args } : { Command: cmd },
      }), '*');
    }
  }

  return {
    bold:        () => direct('.uno:Bold'),
    italic:      () => direct('.uno:Italic'),
    underline:   () => direct('.uno:Underline'),
    strike:      () => direct('.uno:Strikeout'),
    subscript:   () => direct('.uno:SubScript'),
    superscript: () => direct('.uno:SuperScript'),
    align: (w) => direct(ALIGN_UNO[w]),
    bulletList:  () => direct('.uno:DefaultBullet'),
    orderedList: () => direct('.uno:DefaultNumbering'),
    blockquote:  () => direct('.uno:ParaStyle', { 'Style': { type: 'string', value: 'Quotations' } }),
    undo: () => direct('.uno:Undo'),
    redo: () => direct('.uno:Redo'),
    selectAll: () => direct('.uno:SelectAll'),
    cut:       () => direct('.uno:Cut'),
    copy:      () => direct('.uno:Copy'),
    paste:     () => direct('.uno:Paste'),
    pageBreak: () => direct('.uno:InsertPagebreak'),
    hLine:     () => direct('.uno:InsertSection'),
    insertLink: (url) => direct('.uno:SetHyperlink', { 'Hyperlink.Text': { type: 'string', value: url }, 'Hyperlink.URL': { type: 'string', value: url } }),
    unsetLink:  () => direct('.uno:RemoveHyperlink'),
    insertTable: (rows, cols) =>
      direct('.uno:InsertTable', {
        Rows: { type: 'long', value: rows },
        Columns: { type: 'long', value: cols },
      }),
    setFont: (family) =>
      direct('.uno:CharFontName', { 'CharFontName.FamilyName': { type: 'string', value: family } }),
    setFontSize: (pt) =>
      direct('.uno:FontHeight', { 'FontHeight.Height': { type: 'float', value: Number(pt) } }),
    setColor: (hex) =>
      direct('.uno:Color', { Color: { type: 'long', value: parseInt(hex.replace('#', ''), 16) } }),
    setHighlight: (hex) =>
      direct('.uno:BackColor', { BackColor: { type: 'long', value: parseInt(hex.replace('#', ''), 16) } }),
    clearFormatting: () => direct('.uno:ResetAttributes'),
    setHeading: (level) => {
      const style = level === 0 ? 'Default Paragraph Style' : `Heading ${level}`;
      const map = (getIframe()?.contentWindow as any)?.app?.map;
      if (map?.applyStyle) { try { map.applyStyle(style, 'ParagraphStyles'); return; } catch {} }
      direct('.uno:StyleApply', {
        Style:      { type: 'string', value: style },
        FamilyName: { type: 'string', value: 'ParagraphStyles' },
      });
    },
    setParaStyle: (style) => {
      const map = (getIframe()?.contentWindow as any)?.app?.map;
      if (map?.applyStyle) { try { map.applyStyle(style, 'ParagraphStyles'); return; } catch {} }
      direct('.uno:StyleApply', {
        Style:      { type: 'string', value: style },
        FamilyName: { type: 'string', value: 'ParagraphStyles' },
      });
    },
    setDirection: (dir) => direct(dir === 'rtl' ? '.uno:ParaRightToLeft' : '.uno:ParaLeftToRight'),
    zoom: (pct) => {
      // Collabora's zoom levels are integers; 10 = 100%, ±1 ≈ ±20% step.
      // Mapping derived from Collabora's internal _setNewZoom table:
      //   6→25  7→33  8→50  9→75  10→100  11→125  12→150  13→175  14→200
      const PCT_TO_LEVEL: Record<number, number> = {
        25: 6, 33: 7, 50: 8, 75: 9, 90: 9, 100: 10,
        125: 11, 150: 12, 175: 13, 200: 14,
      };
      const map = (getIframe()?.contentWindow as any)?.app?.map;
      const level = PCT_TO_LEVEL[pct] ?? Math.round(10 + (pct - 100) / 25);
      if (map?.setZoom) { try { map.setZoom(level); return; } catch {} }
      // Fallback: stepwise via uno commands.
      if (pct >= 100) direct('.uno:ZoomPlus');
      else direct('.uno:ZoomMinus');
    },
    zoomIn:  () => {
      const map = (getIframe()?.contentWindow as any)?.app?.map;
      if (map?.zoomIn) { try { map.zoomIn(); return; } catch {} }
      direct('.uno:ZoomPlus');
    },
    zoomOut: () => {
      const map = (getIframe()?.contentWindow as any)?.app?.map;
      if (map?.zoomOut) { try { map.zoomOut(); return; } catch {} }
      direct('.uno:ZoomMinus');
    },
    insertImage: async () => {
      const iframe = getIframe();
      if (!iframe) return;
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      const file: File | null = await new Promise((resolve) => {
        input.onchange = () => resolve(input.files?.[0] ?? null);
        input.click();
      });
      if (!file) return;

      // Simulate a paste of the file into the Collabora document.
      // Same-origin → we can dispatch ClipboardEvent on the iframe doc directly.
      try {
        const dt = new DataTransfer();
        dt.items.add(file);
        const ev = new ClipboardEvent('paste', {
          clipboardData: dt as any,
          bubbles: true,
          cancelable: true,
        });
        iframe.contentDocument?.dispatchEvent(ev);
      } catch (e) {
        // Fallback: hand the bytes to Collabora's clipboard plumbing.
        try {
          const buf = await file.arrayBuffer();
          const blob = new Blob([buf], { type: file.type });
          const url = (iframe.contentWindow as any).URL.createObjectURL(blob);
          direct('.uno:InsertGraphic', {
            URL: { type: 'string', value: url },
            FilterName: { type: 'string', value: '' },
          });
        } catch (err) {
          console.warn('insertImage failed', err);
        }
      }
    },
    insertTextBox:         () => direct('.uno:InsertFrameInteract'),
    insertVerticalTextBox: () => direct('.uno:VerticalTextFrameInteract'),
    uno: (command, args) => direct(command, args),
  };
}

const STATE_MAPPING: Record<string, keyof ActiveState> = {
  'Bold':            'bold',
  'Italic':          'italic',
  'Underline':       'underline',
  'Strikeout':       'strike',
  'SubScript':       'subscript',
  'SuperScript':     'superscript',
  'LeftPara':        'alignLeft',
  'CenterPara':      'alignCenter',
  'RightPara':       'alignRight',
  'JustifyPara':     'alignJustify',
  'DefaultBullet':   'bulletList',
  'DefaultNumbering':'orderedList',
};
const VALUE_MAPPING: Record<string, keyof ActiveState> = {
  'CharFontName': 'font',
  'FontHeight':   'fontSize',
  'Color':        'color',
  'BackColor':    'highlight',
  'StyleApply':   'paraStyle',
  'ParaStyle':    'paraStyle',
};

/**
 * React hook: returns commands + the latest active state from Collabora.
 * Waits for the iframe's Collabora globals to appear, then subscribes to
 * commandstatechanged events. Also injects our chrome-hiding CSS into the
 * iframe's document.head so users only see the document canvas.
 */
export function useCollaboraCommands(iframeRef: React.RefObject<HTMLIFrameElement | null>) {
  const [active, setActive] = useState<ActiveState>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const commandsRef = useRef<CollaboraCommands | null>(null);

  if (!commandsRef.current) {
    commandsRef.current = buildCommands(() => iframeRef.current);
  }

  function toggleSidebar() {
    setSidebarOpen((wasOpen) => {
      const next = !wasOpen;
      const doc = iframeRef.current?.contentDocument;
      if (doc?.body) doc.body.classList.toggle('velr-show-sidebar', next);
      // Ask Collabora to actually populate the sidebar panel on first open.
      if (next) commandsRef.current?.uno('.uno:Sidebar');
      return next;
    });
  }

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let pollHandle: number | null = null;
    let mounted = true;
    let unsubscribe: (() => void) | null = null;

    function onStateChanged(e: any) {
      if (!e?.commandName) return;
      const cmd = String(e.commandName).replace(/^\.uno:/, '');
      const rawState = e.state;
      const state = String(rawState ?? '');

      const boolKey = STATE_MAPPING[cmd];
      if (boolKey) {
        setActive((prev) => ({ ...prev, [boolKey]: state === 'true' }));
        return;
      }
      const valKey = VALUE_MAPPING[cmd];
      if (valKey) {
        setActive((prev) => ({ ...prev, [valKey]: state }));
        return;
      }
      if (cmd === 'Undo') setActive((p) => ({ ...p, canUndo: state === 'enabled' }));
      if (cmd === 'Redo') setActive((p) => ({ ...p, canRedo: state === 'enabled' }));
    }

    // Some Collabora versions emit paragraph style as 'StyleApply' values
    // rather than ParaStyle. Also listen to the dedicated event.
    function onStyleApply(e: any) {
      if (typeof e?.state === 'string') {
        setActive((prev) => ({ ...prev, paraStyle: e.state }));
      }
    }

    function injectStyle(doc: Document) {
      if (doc.getElementById('velr-chrome-strip')) return;
      const style = doc.createElement('style');
      style.id = 'velr-chrome-strip';
      style.textContent = STRIPPED_CHROME_CSS;
      (doc.head ?? doc.documentElement).appendChild(style);
    }

    /** Force-hide a list of element ids/selectors in the iframe doc, by
     *  setting display:none directly. Beats any inline style Collabora adds.
     *  We re-run whenever the DOM changes (MutationObserver below) because
     *  Collabora re-creates several of these elements after we hide them. */
    const FORCE_HIDE = [
      '#sidebar-panel', '.sidebar-panel', '#sidebar-dock-wrapper',
      '#sidebar-container', '#PropertyDeck',
      '#navigator-panel', '#navigator-dock-wrapper',
      '#quickfind-panel', '#quickfind-dock-wrapper',
      '#toolbar-wrapper', '#document-titlebar', '#main-menu', '.main-nav',
      '#toolbar-up', '#toolbar-down', '#toolbar-row', '#toolbar-search',
      '#formulabar', '#formulabar-row', '#tb_editbar',
      '#presentation-toolbar', '#spreadsheet-toolbar',
      '#presentation-controls-wrapper', '#mobile-edit-button',
      '#userListHeader', '#userListSummary', '#followingChip',
    ];
    function hideAll(doc: Document, showSidebar: boolean) {
      for (const sel of FORCE_HIDE) {
        doc.querySelectorAll<HTMLElement>(sel).forEach((el) => {
          const isSidebar = el.matches('#sidebar-panel, .sidebar-panel, #sidebar-dock-wrapper, #sidebar-container, #PropertyDeck');
          if (isSidebar && showSidebar) {
            el.style.removeProperty('display');
          } else {
            el.style.setProperty('display', 'none', 'important');
          }
        });
      }
    }
    let observer: MutationObserver | null = null;
    let observedDoc: Document | null = null;
    function startObserver(doc: Document) {
      if (observer && observedDoc === doc) return;
      observer?.disconnect();
      observedDoc = doc;
      const showSidebar = doc.body?.classList.contains('velr-show-sidebar') ?? false;
      hideAll(doc, showSidebar);
      observer = new MutationObserver(() => {
        const s = doc.body?.classList.contains('velr-show-sidebar') ?? false;
        hideAll(doc, s);
      });
      observer.observe(doc.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
    }

    function tryWire() {
      if (!mounted || !iframe) return;
      const win = iframe.contentWindow as any;
      try {
        // Inject CSS as early as the iframe document exists, even before
        // Collabora has booted.
        if (iframe.contentDocument) {
          injectStyle(iframe.contentDocument);
          startObserver(iframe.contentDocument);
        }
      } catch {}
      const app = win?.app;
      const map = app?.map;
      if (map && typeof map.on === 'function' && typeof map.sendUnoCommand === 'function') {
        map.on('commandstatechanged', onStateChanged);
        unsubscribe = () => { try { map.off('commandstatechanged', onStateChanged); } catch {} };
        if (pollHandle != null) { clearInterval(pollHandle); pollHandle = null; }
        return;
      }
      // Not ready yet — poll briefly.
      if (pollHandle == null) pollHandle = window.setInterval(tryWire, 300) as unknown as number;
    }

    iframe.addEventListener('load', tryWire);
    tryWire(); // also try immediately in case it's already loaded

    // Forward zoom-keyboard shortcuts (Ctrl+= / Ctrl+- / Ctrl+0) to Collabora
    // — they fire on the parent doc when focus is in our toolbar/menubar.
    function onKeyDown(ev: KeyboardEvent) {
      if (!(ev.ctrlKey || ev.metaKey)) return;
      const cmds = commandsRef.current!;
      if (ev.key === '=' || ev.key === '+') { ev.preventDefault(); cmds.zoomIn(); }
      else if (ev.key === '-' || ev.key === '_') { ev.preventDefault(); cmds.zoomOut(); }
      else if (ev.key === '0') { ev.preventDefault(); cmds.zoom(100); }
    }
    window.addEventListener('keydown', onKeyDown);

    return () => {
      mounted = false;
      iframe.removeEventListener('load', tryWire);
      window.removeEventListener('keydown', onKeyDown);
      if (pollHandle != null) clearInterval(pollHandle);
      if (unsubscribe) unsubscribe();
      observer?.disconnect();
      observer = null;
    };
  }, [iframeRef]);

  return { commands: commandsRef.current!, active, sidebarOpen, toggleSidebar };
}
