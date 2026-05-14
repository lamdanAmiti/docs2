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
  setDirection: (dir: 'ltr' | 'rtl') => void;
  zoom: (pct: number) => void;
  uno: (command: string, args?: Record<string, unknown>) => void;
}

/* ─── CSS we inject into the iframe to strip Collabora chrome ───────────── */
const STRIPPED_CHROME_CSS = `
  /* Hide every chrome surface — only the document canvas should remain. */
  #toolbar-wrapper,
  #toolbar-row,
  #toolbar-up,
  #toolbar-down,
  #toolbar-mobile-back,
  #toolbar-hamburger,
  #toolbar-search,
  #document-titlebar,
  #document-name-input,
  #document-name-input-loading-bar,
  .document-title-bar,
  #main-menu,
  .main-nav,
  .menubar,
  .menubar-shell,
  #menu-bar-container,
  .cool-toolbar,
  .notebookbar-shortcuts-bar,
  .notebookbar-tabs-container,
  .notebookbar,
  #NotebookBar,
  #shortcuts-toolbar,
  #presentation-toolbar,
  #spreadsheet-toolbar,
  .w2ui-toolbar,
  #tb_editbar,
  #mobile-edit-button,
  .toolbar-bottom,
  #welcome-iframe,
  .welcome-page,
  .leaflet-control-tabs,
  .leaflet-control-sidebar,
  #sidebar-dock-wrapper,
  #sidebar-panel { display: none !important; visibility: hidden !important; }

  /* Let the document canvas fill the iframe */
  html, body, #map, #document-container, .leaflet-container, .canvas-container {
    margin: 0 !important;
    padding: 0 !important;
    height: 100% !important;
    width: 100% !important;
    background: var(--velr-canvas, #f8fafe) !important;
  }
  #map { top: 0 !important; }
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
    setHeading: (level) =>
      direct('.uno:ParaStyle', {
        'Style': { type: 'string', value: level === 0 ? 'Default Paragraph Style' : `Heading ${level}` },
      }),
    setDirection: (dir) => direct(dir === 'rtl' ? '.uno:ParaRightToLeft' : '.uno:ParaLeftToRight'),
    zoom: (pct) => direct('.uno:Zoom', { Zoom: { type: 'long', value: pct } }),
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
};

/**
 * React hook: returns commands + the latest active state from Collabora.
 * Waits for the iframe's Collabora globals to appear, then subscribes to
 * commandstatechanged events. Also injects our chrome-hiding CSS into the
 * iframe's document.head so users only see the document canvas.
 */
export function useCollaboraCommands(iframeRef: React.RefObject<HTMLIFrameElement | null>) {
  const [active, setActive] = useState<ActiveState>({});
  const commandsRef = useRef<CollaboraCommands | null>(null);

  if (!commandsRef.current) {
    commandsRef.current = buildCommands(() => iframeRef.current);
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
      const state = String(e.state ?? '');

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

    function injectStyle(doc: Document) {
      if (doc.getElementById('velr-chrome-strip')) return;
      const style = doc.createElement('style');
      style.id = 'velr-chrome-strip';
      style.textContent = STRIPPED_CHROME_CSS;
      (doc.head ?? doc.documentElement).appendChild(style);
    }

    function tryWire() {
      if (!mounted || !iframe) return;
      const win = iframe.contentWindow as any;
      try {
        // Inject CSS as early as the iframe document exists, even before
        // Collabora has booted.
        if (iframe.contentDocument) injectStyle(iframe.contentDocument);
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

    return () => {
      mounted = false;
      iframe.removeEventListener('load', tryWire);
      if (pollHandle != null) clearInterval(pollHandle);
      if (unsubscribe) unsubscribe();
    };
  }, [iframeRef]);

  return { commands: commandsRef.current!, active };
}
