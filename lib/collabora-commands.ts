'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Bridge between the Tiptap-style toolbar/menubar UI components and the
 * Collabora editor inside the iframe. Sends UNO commands over postMessage
 * and tracks the "active" state of selection-bound commands so the toolbar
 * can highlight Bold/Italic/etc when the cursor is in a formatted region.
 *
 * Collabora's PostMessage API:
 *   parent → iframe: { MessageId: 'Send_UNO_Command', SendTime, Values: { Command: '.uno:Bold' } }
 *   iframe → parent: { MessageId: 'Action_State_Set', Values: { type: 'commandStateChanged', state: { '.uno:Bold': 'true' } } }
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
  // Selection-bound formatting
  bold:        () => void;
  italic:      () => void;
  underline:   () => void;
  strike:      () => void;
  subscript:   () => void;
  superscript: () => void;
  // Alignment
  align: (which: 'left' | 'center' | 'right' | 'justify') => void;
  // Lists / blocks
  bulletList:    () => void;
  orderedList:   () => void;
  blockquote:    () => void;
  // History
  undo: () => void;
  redo: () => void;
  // Selection
  selectAll: () => void;
  cut:       () => void;
  copy:      () => void;
  paste:     () => void;
  // Insert
  pageBreak:  () => void;
  hLine:      () => void;
  insertLink: (url: string) => void;
  unsetLink:  () => void;
  insertTable: (rows: number, cols: number) => void;
  // Text style / typography
  setFont:     (family: string) => void;
  setFontSize: (pt: number | string) => void;
  setColor:    (hex: string) => void;
  setHighlight:(hex: string) => void;
  clearFormatting: () => void;
  // Heading
  setHeading: (level: 0 | 1 | 2 | 3 | 4 | 5 | 6) => void;
  // Direction
  setDirection: (dir: 'ltr' | 'rtl') => void;
  // View
  zoomIn:    () => void;
  zoomOut:   () => void;
  resetZoom: () => void;
  // Generic escape hatch
  uno: (command: string, args?: Record<string, unknown>) => void;
}

function buildCommands(getIframe: () => HTMLIFrameElement | null): CollaboraCommands {
  function send(command: string, args?: Record<string, unknown>) {
    const win = getIframe()?.contentWindow;
    if (!win) return;
    const msg = {
      MessageId: 'Send_UNO_Command',
      SendTime: Date.now(),
      Values: args ? { Command: command, Args: args } : { Command: command },
    };
    win.postMessage(JSON.stringify(msg), '*');
  }
  function postMsg(messageId: string, values?: Record<string, unknown>) {
    const win = getIframe()?.contentWindow;
    if (!win) return;
    win.postMessage(JSON.stringify({ MessageId: messageId, SendTime: Date.now(), Values: values ?? {} }), '*');
  }

  return {
    bold:        () => send('.uno:Bold'),
    italic:      () => send('.uno:Italic'),
    underline:   () => send('.uno:Underline'),
    strike:      () => send('.uno:Strikeout'),
    subscript:   () => send('.uno:SubScript'),
    superscript: () => send('.uno:SuperScript'),
    align: (w) => send(ALIGN_UNO[w]),
    bulletList:  () => send('.uno:DefaultBullet'),
    orderedList: () => send('.uno:DefaultNumbering'),
    blockquote:  () => send('.uno:ParaStyle', { 'Style': { type: 'string', value: 'Quotations' } }),
    undo: () => send('.uno:Undo'),
    redo: () => send('.uno:Redo'),
    selectAll: () => send('.uno:SelectAll'),
    cut:       () => send('.uno:Cut'),
    copy:      () => send('.uno:Copy'),
    paste:     () => send('.uno:Paste'),
    pageBreak: () => send('.uno:InsertPagebreak'),
    hLine:     () => send('.uno:InsertGraphic'), // best UNO match; user typically uses Insert→HRule
    insertLink: (url) => send('.uno:HyperlinkDialog', { Hyperlink: { type: 'string', value: url } }),
    unsetLink:  () => send('.uno:RemoveHyperlink'),
    insertTable: (rows, cols) =>
      send('.uno:InsertTable', {
        Rows: { type: 'long', value: rows },
        Columns: { type: 'long', value: cols },
      }),
    setFont: (family) =>
      send('.uno:CharFontName', { 'CharFontName.FamilyName': { type: 'string', value: family } }),
    setFontSize: (pt) =>
      send('.uno:FontHeight', { 'FontHeight.Height': { type: 'float', value: Number(pt) } }),
    setColor: (hex) =>
      send('.uno:FontColor', { 'FontColor.Color': { type: 'long', value: parseInt(hex.replace('#', ''), 16) } }),
    setHighlight: (hex) =>
      send('.uno:BackColor', { 'BackColor.Color': { type: 'long', value: parseInt(hex.replace('#', ''), 16) } }),
    clearFormatting: () => send('.uno:ResetAttributes'),
    setHeading: (level) =>
      send('.uno:ParaStyle', {
        'Style': { type: 'string', value: level === 0 ? 'Default Paragraph Style' : `Heading ${level}` },
      }),
    setDirection: (dir) => send(dir === 'rtl' ? '.uno:ParaRightToLeft' : '.uno:ParaLeftToRight'),
    zoomIn:    () => postMsg('Action_ChangeUIMode', { Mode: 'classic' }) /* fallback: handled separately */,
    zoomOut:   () => {},
    resetZoom: () => {},
    uno: (command, args) => send(command, args),
  };
}

/**
 * React hook: returns commands + the latest active state from Collabora.
 */
export function useCollaboraCommands(iframeRef: React.RefObject<HTMLIFrameElement | null>) {
  const [active, setActive] = useState<ActiveState>({});
  const commandsRef = useRef<CollaboraCommands | null>(null);

  if (!commandsRef.current) {
    commandsRef.current = buildCommands(() => iframeRef.current);
  }

  useEffect(() => {
    function onMessage(ev: MessageEvent) {
      if (!ev.data || typeof ev.data !== 'string') return;
      let parsed: any;
      try { parsed = JSON.parse(ev.data); } catch { return; }

      // Collabora emits various message ids; we care about state updates.
      if (parsed.MessageId === 'Action_StateChanged' || parsed.MessageId === 'CommandStateChanged') {
        applyState(parsed.Values ?? parsed, setActive);
      } else if (parsed.MessageId === 'App_LoadingStatus' && parsed.Values?.Status === 'Document_Loaded') {
        // ask Collabora to start sending us state updates
        const win = iframeRef.current?.contentWindow;
        win?.postMessage(JSON.stringify({
          MessageId: 'Host_PostmessageReady', SendTime: Date.now(), Values: {},
        }), '*');
      }
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [iframeRef]);

  return { commands: commandsRef.current!, active };
}

function applyState(values: any, setActive: (s: (prev: ActiveState) => ActiveState) => void) {
  // Values shapes seen in Collabora: { commandName: 'Bold', state: 'true' } OR
  // { type: 'commandStateChanged', state: { '.uno:Bold': 'true' } }
  const updates: Partial<ActiveState> = {};

  const setBool = (k: keyof ActiveState, v: string) => {
    (updates as any)[k] = v === 'true';
  };

  function digest(cmd: string, state: string) {
    const c = cmd.replace(/^\.uno:/, '');
    switch (c) {
      case 'Bold':        setBool('bold', state); break;
      case 'Italic':      setBool('italic', state); break;
      case 'Underline':   setBool('underline', state); break;
      case 'Strikeout':   setBool('strike', state); break;
      case 'SubScript':   setBool('subscript', state); break;
      case 'SuperScript': setBool('superscript', state); break;
      case 'LeftPara':    setBool('alignLeft', state); break;
      case 'CenterPara':  setBool('alignCenter', state); break;
      case 'RightPara':   setBool('alignRight', state); break;
      case 'JustifyPara': setBool('alignJustify', state); break;
      case 'DefaultBullet':    setBool('bulletList', state); break;
      case 'DefaultNumbering': setBool('orderedList', state); break;
      case 'Undo':        setBool('canUndo', state); break;
      case 'Redo':        setBool('canRedo', state); break;
      case 'CharFontName': updates.font = String(state); break;
      case 'FontHeight':   updates.fontSize = String(state); break;
      case 'FontColor':    updates.color = state; break;
      case 'BackColor':    updates.highlight = state; break;
    }
  }

  if (values?.commandName) {
    digest(values.commandName, String(values.state));
  }
  if (values?.state && typeof values.state === 'object') {
    for (const [k, v] of Object.entries(values.state)) digest(k, String(v));
  }

  if (Object.keys(updates).length === 0) return;
  setActive((prev) => ({ ...prev, ...updates }));
}
