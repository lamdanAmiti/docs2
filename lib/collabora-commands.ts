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
  /** Apply a specific CSS-style weight (100..900) to the current selection. */
  setFontWeight: (weight: number) => void;
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
  /** Trigger Collabora's print flow (server-side PDF → browser print dialog). */
  print: () => void;
  insertImage: () => Promise<void>;
  /** Begin drawing a horizontal text frame (click+drag on canvas). */
  insertTextBox: () => void;
  /** Begin drawing a vertical text frame. */
  insertVerticalTextBox: () => void;
  uno: (command: string, args?: Record<string, unknown>) => void;
}

/* ─── CSS we inject into the iframe to strip Collabora chrome ─────────────
   Surgical: ONLY hide the obvious chrome (toolbars, menubar, titlebar,
   sidebar). Leave everything that could carry selection handles, drag
   markers, context menus, or hit-test geometry untouched. Don't override
   positioning of #map / #document-container — Collabora's selection
   overlays calculate themselves relative to those, and reflowing them
   moves selection markers off the visible doc. */
const STRIPPED_CHROME_CSS = `
  #toolbar-wrapper,
  #toolbar-row,
  #toolbar-up,
  #toolbar-down,
  #toolbar-mobile-back,
  #toolbar-hamburger,
  #toolbar-search,
  #toolbar-logo,
  #document-titlebar,
  #document-name-input-loading-bar,
  #main-menu,
  .main-nav,
  .menubar, .menubar-shell,
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
  #userListHeader,
  #userListSummary,
  #followingChip,
  #sidebar-panel,
  .sidebar-panel,
  #sidebar-dock-wrapper,
  /* Collabora's first-run "Welcome" carousel (Welcome / Next / X). The
     server-side --o:welcome.enable=false flag is unreliable across versions;
     this kills the overlay regardless. */
  #iframe-welcome,
  #welcome-iframe,
  #iframe-welcome-box,
  #welcome-modal,
  #welcome,
  .iframe-welcome-modal,
  .welcome-modal,
  .welcome-overlay,
  /* "Send Feedback" link Collabora injects on the canvas */
  #feedback-link,
  #feedback-button,
  .feedback-link,
  a[href*="feedback"][href*="collabora"],
  /* jQuery UI tooltip — showDocumentTooltip() uses jQuery UI's .tooltip()
     widget which injects .ui-tooltip into the DOM on hover/selection. */
  .ui-tooltip,
  .ui-helper-hidden-accessible,
  /* ContextToolbar — the floating font/size/bold popup that appears on
     text selection. Collabora's bundle.css has #context-toolbar{display:grid}
     which wins over .notebookbar{display:none} by ID specificity, so we must
     also target the ID directly. JS override (below) handles it at the API
     level so it never renders at all. */
  #context-toolbar { display: none !important; }

  /* Floating selection toolbar: we used to broadly hide .editor-toolbox /
     .w2ui-overlay / .lokdialog_container.modalpopup / .context-toolbar
     here, but those wrap LEGITIMATE frame controls too — killing them
     blocks the user from selecting and reshaping text boxes. Removal is
     now exclusively driven by the runtime sweep (sweepFeedback), which
     only removes a popup if it contains BOTH a Bold AND a Font control.
     Frame controls don't pass that test. */

  /* Sidebar reveal on demand */
  body.velr-show-sidebar #sidebar-panel,
  body.velr-show-sidebar .sidebar-panel,
  body.velr-show-sidebar #sidebar-dock-wrapper {
    display: block !important;
  }

  html, body { background: #f8fafe; }
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
    setFontWeight: (weight) => {
      // The picker passes the CSS weight (100..900). LibreOffice's
      // CharWeight property uses awt.FontWeight scale (50..200):
      //   THIN=50  ULTRALIGHT=60  LIGHT=75  SEMILIGHT=90  NORMAL=100
      //   SEMIBOLD=110  BOLD=150  ULTRABOLD=175  BLACK=200.
      const CSS_TO_LO: Record<number, number> = {
        100: 50, 200: 60, 300: 75, 400: 100, 500: 110,
        600: 110, 700: 150, 800: 175, 900: 200,
      };
      const lo = CSS_TO_LO[weight] ?? 100;
      // 1) Try the direct property setter via Collabora's editor API.
      //    This bypasses any UNO dispatch quirks and changes CharWeight on
      //    the current selection. Works in recent Collabora builds.
      const map = (getIframe()?.contentWindow as any)?.app?.map;
      try {
        const editor = map?._docLayer?._textCsel ?? map?._docLayer;
        if (editor && typeof editor.setTextAttr === 'function') {
          editor.setTextAttr('CharWeight', { type: 'float', value: lo });
          return;
        }
      } catch {}
      // 2) Fallback: send as a UNO dispatch. Parameter name must be
      //    `CharWeight.Weight` for the slot, not bare `CharWeight`.
      direct('.uno:CharWeight', {
        'CharWeight.Weight': { type: 'float', value: lo },
      });
    },
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
    setDirection: (dir) => {
      direct(dir === 'rtl' ? '.uno:ParaRightToLeft' : '.uno:ParaLeftToRight');
      // Mark as user-set so the auto-RTL Hebrew detection doesn't fight it.
      const w = window as any;
      w.__velrDirOverride = true;
    },
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
    print: () => {
      const map = (getIframe()?.contentWindow as any)?.app?.map;
      if (map?.print) {
        try { map.print(); return; } catch {}
      }
      direct('.uno:PrintDefault');
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
    insertTextBox: () => {
      // Put Collabora in "draw a text frame" mode and focus the iframe so
      // the user's next mouse-down lands on the canvas (not still in our
      // toolbar). They'll see Collabora's normal crosshair cursor on the
      // page.
      direct('.uno:InsertFrameInteract');
      const iframe = getIframe();
      iframe?.focus();
      try { (iframe?.contentWindow as any)?.focus(); } catch {}
    },
    insertVerticalTextBox: () => {
      direct('.uno:VerticalTextFrameInteract');
      const iframe = getIframe();
      iframe?.focus();
      try { (iframe?.contentWindow as any)?.focus(); } catch {}
    },
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
      // Force-show/hide the sidebar panel directly, bypassing the
      // MutationObserver and any inline display:none Collabora applied.
      if (doc) {
        const sels = ['#sidebar-panel', '.sidebar-panel', '#sidebar-dock-wrapper'];
        for (const sel of sels) {
          doc.querySelectorAll<HTMLElement>(sel).forEach((el) => {
            if (next) el.style.removeProperty('display');
            else el.style.setProperty('display', 'none', 'important');
          });
        }
      }
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
    // Chrome-only initial sweep (no MutationObserver — that was firing on
    // every DOM change Collabora made, racing with its selection layer and
    // breaking click-to-select on frames/images).
    const FORCE_HIDE = [
      '#toolbar-wrapper', '#toolbar-row', '#toolbar-up', '#toolbar-down',
      '#document-titlebar', '#main-menu', '.main-nav',
      '#sidebar-panel', '.sidebar-panel', '#sidebar-dock-wrapper',
    ];
    function hideOnce(doc: Document) {
      const showSidebar = doc.body?.classList.contains('velr-show-sidebar') ?? false;
      for (const sel of FORCE_HIDE) {
        doc.querySelectorAll<HTMLElement>(sel).forEach((el) => {
          const isSidebar = el.matches('#sidebar-panel, .sidebar-panel, #sidebar-dock-wrapper');
          if (isSidebar && showSidebar) {
            el.style.removeProperty('display');
          } else {
            el.style.setProperty('display', 'none', 'important');
          }
        });
      }
    }

    // Two things to keep clean (no stable selectors across Collabora
    // versions, so we sweep):
    //   (1) "Please send us your feedback" banner
    //   (2) The floating selection mini-toolbar — appears when text is
    //       selected, duplicates controls we already have in the top bar.
    //       Detect it heuristically: a positioned popup that contains a
    //       Bold or Italic button.
    const FEEDBACK_RE = /please\s+send\s+(us\s+)?(your\s+)?feedback/i;
    function sweepFeedback() {
      const doc = iframe?.contentDocument;
      if (!doc?.body) return;

      // (1) feedback overlays
      const feedbackTargets = doc.querySelectorAll<HTMLElement>(
        '.leaflet-popup, .toast, .notification, .vex, .vex-overlay, .modal, .feedback, .feedback-popup, .feedback-banner, [class*="feedback"]'
      );
      feedbackTargets.forEach((el) => {
        const t = el.textContent ?? '';
        if (FEEDBACK_RE.test(t)) el.remove();
      });

      // (2) text-selection mini-toolbar. We must NOT match frame/text-box
      //     selection handles — those popups have Align/Indent/Wrap buttons
      //     that would false-trigger a wider regex and break the user's
      //     ability to edit text-box shapes. The text-selection popup is
      //     defined by having BOTH a Bold AND a Font button.
      const formattingPopups = doc.querySelectorAll<HTMLElement>(
        '.leaflet-popup, .lokdialog, .lokdialog_container, ' +
          '[class*="mini-toolbar"], [class*="MiniToolbar"], ' +
          '[class*="editor-toolbox"], [class*="selection-toolbar"]'
      );
      formattingPopups.forEach((el) => {
        if (!iframe?.contentDocument?.contains(el)) return;
        const hasBold = el.querySelector(
          '[title*="Bold" i], [aria-label*="Bold" i]'
        );
        const hasFontControl = el.querySelector(
          '[title*="Font" i], [aria-label*="Font" i], select[name*="font" i]'
        );
        if (hasBold && hasFontControl) el.remove();
      });
    }

    function tryWire() {
      if (!mounted || !iframe) return;
      const win = iframe.contentWindow as any;
      try {
        // Inject CSS as early as the iframe document exists, even before
        // Collabora has booted. The CSS itself (with !important) handles
        // the chrome stripping — no MutationObserver needed.
        if (iframe.contentDocument) {
          injectStyle(iframe.contentDocument);
          hideOnce(iframe.contentDocument);
          attachDocListener();
        }
      } catch {}
      const app = win?.app;
      const map = app?.map;
      if (map && typeof map.on === 'function' && typeof map.sendUnoCommand === 'function') {
        map.on('commandstatechanged', onStateChanged);
        unsubscribe = () => { try { map.off('commandstatechanged', onStateChanged); } catch {} };
        if (pollHandle != null) { clearInterval(pollHandle); pollHandle = null; }

        // Kill the ContextToolbar at the JS level. contextToolbar is set by
        // UIManager.initializeComponents which runs AFTER map is ready, so
        // we poll until it exists rather than checking once.
        (function patchContextToolbar() {
          try {
            const win2 = iframe?.contentWindow as any;
            const ct = win2?.app?.map?.contextToolbar;
            if (ct) {
              ct.showContextToolbar = () => {};
              ct.showContextToolbarImpl = () => {};
              ct.showHideToolbar = () => {};
              return; // done
            }
          } catch {}
          // Not ready yet — check again in 200 ms (stops naturally when
          // the outer hook unmounts because the iframe is gone).
          if (mounted) setTimeout(patchContextToolbar, 200);
        })();

        return;
      }
      // Not ready yet — poll briefly.
      if (pollHandle == null) pollHandle = window.setInterval(tryWire, 300) as unknown as number;
    }

    iframe.addEventListener('load', tryWire);
    tryWire(); // also try immediately in case it's already loaded

    // Periodic safety sweep + immediate sweep on selection/mouseup so the
    // formatting popup doesn't flash visible before disappearing.
    const sweepHandle = window.setInterval(sweepFeedback, 1500);
    function attachSelectionSweep() {
      const doc = iframe?.contentDocument;
      if (!doc) return;
      const fire = () => requestAnimationFrame(sweepFeedback);
      doc.addEventListener('selectionchange', fire, true);
      doc.addEventListener('mouseup', fire, true);
      doc.addEventListener('keyup', fire, true);
    }
    // Re-attach whenever the iframe doc swaps (Collabora reloads it). The
    // poll loop above already runs tryWire periodically — piggyback on it.
    const origTryWire = tryWire;
    function wrappedTryWire() {
      origTryWire();
      attachSelectionSweep();
    }
    iframe.removeEventListener('load', tryWire);
    iframe.addEventListener('load', wrappedTryWire);
    wrappedTryWire();

    // Forward keyboard shortcuts to Collabora — captures in BOTH the parent
    // window (when focus is in our toolbar/menubar) AND the iframe document
    // (when the user is typing in the doc). preventDefault + stopPropagation
    // beats the browser's own bindings (browser zoom, hard refresh).
    let direction: 'ltr' | 'rtl' = 'ltr';
    // Auto-RTL on first Hebrew keypress in a paragraph. Resets on Enter
    // (new paragraph). userOverrodeDirection latches if the user manually
    // picks a direction in this session — keeps us from fighting them.
    let userOverrodeDirection = false;
    let paraDirectionLocked = false;
    const HEBREW_RE = /[֐-׿יִ-ﭏ]/;
    function onKeyPress(ev: KeyboardEvent) {
      // Re-read the override flag from window — setDirection() writes it.
      userOverrodeDirection = !!(window as any).__velrDirOverride;
      if (userOverrodeDirection || paraDirectionLocked) {
        if (ev.key === 'Enter') paraDirectionLocked = false;
        return;
      }
      if (ev.key === 'Enter') { paraDirectionLocked = false; return; }
      if (ev.key && ev.key.length === 1 && HEBREW_RE.test(ev.key)) {
        // Direct command (skip setDirection's override flag).
        const map = (iframe?.contentWindow as any)?.app?.map;
        if (map?.sendUnoCommand) {
          try { map.sendUnoCommand('.uno:ParaRightToLeft'); } catch {}
        }
        paraDirectionLocked = true;
      }
    }
    function onKeyDown(ev: KeyboardEvent) {
      const mod = ev.ctrlKey || ev.metaKey;
      if (!mod) return;
      const cmds = commandsRef.current!;
      const key = ev.key.toLowerCase();

      // Ctrl+Shift+R → toggle LTR/RTL (kept off the browser's reload shortcut)
      if (ev.shiftKey && key === 'r') {
        ev.preventDefault(); ev.stopPropagation();
        direction = direction === 'ltr' ? 'rtl' : 'ltr';
        cmds.setDirection(direction);
        userOverrodeDirection = true;
        return;
      }
      // Ctrl+P → Collabora's Print flow (overrides browser's page print).
      // Collabora's actual print pipeline is exposed as `app.map.print()` —
      // that generates a PDF server-side and triggers the browser print
      // dialog. The `.uno:Print` UNO is a no-op in browser context.
      if (key === 'p') {
        ev.preventDefault(); ev.stopPropagation();
        cmds.print();
        return;
      }
      // Zoom — note that '=' is Shift+=
      if (key === '=' || ev.code === 'Equal' || key === '+') {
        ev.preventDefault(); ev.stopPropagation(); cmds.zoomIn();
      } else if (key === '-' || ev.code === 'Minus' || key === '_') {
        ev.preventDefault(); ev.stopPropagation(); cmds.zoomOut();
      } else if (key === '0') {
        ev.preventDefault(); ev.stopPropagation(); cmds.zoom(100);
      }
    }
    // Capture phase so we beat the browser's default for Ctrl+Shift+R, etc.
    window.addEventListener('keydown', onKeyDown, true);

    // Re-broadcast iframe canvas clicks as a parent-window CustomEvent so
    // toolbar dropdowns (font picker, color pickers, menus) can dismiss
    // themselves — their own document-level mousedown handlers never see
    // events that happen inside the iframe.
    function onIframeMouseDown() {
      try {
        window.dispatchEvent(new CustomEvent('velr-canvas-mousedown'));
        // Also synthesize a parent-side mousedown so the seven Toolbar /
        // MenuBar dropdowns that listen on `window.mousedown` for click-
        // outside dismissal close naturally — target is document.body so
        // every panel's ref.contains() check returns false.
        document.body.dispatchEvent(
          new MouseEvent('mousedown', { bubbles: true, cancelable: true }),
        );
      } catch {}
    }

    let docKeyAttached: Document | null = null;
    function attachDocListener() {
      const doc = iframe?.contentDocument;
      if (!doc || doc === docKeyAttached) return;
      docKeyAttached?.removeEventListener('keydown', onKeyDown, true);
      docKeyAttached?.removeEventListener('keypress', onKeyPress, true);
      docKeyAttached?.removeEventListener('mousedown', onIframeMouseDown, true);
      doc.addEventListener('keydown', onKeyDown, true);
      doc.addEventListener('keypress', onKeyPress, true);
      doc.addEventListener('mousedown', onIframeMouseDown, true);
      docKeyAttached = doc;
    }
    attachDocListener();

    return () => {
      mounted = false;
      iframe.removeEventListener('load', tryWire);
      window.removeEventListener('keydown', onKeyDown, true);
      docKeyAttached?.removeEventListener('keydown', onKeyDown, true);
      docKeyAttached?.removeEventListener('keypress', onKeyPress, true);
      docKeyAttached?.removeEventListener('mousedown', onIframeMouseDown, true);
      if (pollHandle != null) clearInterval(pollHandle);
      clearInterval(sweepHandle);
      if (unsubscribe) unsubscribe();
    };
  }, [iframeRef]);

  return { commands: commandsRef.current!, active, sidebarOpen, toggleSidebar };
}
