import { db, storage } from './supabase';

const EMPTY_DOCX_BASE64 =
  // Minimal valid .docx (Word's empty document, ~6.5 KB)
  'UEsDBBQACAgIAOyYjFsAAAAAAAAAAAAAAAALAAAAX3JlbHMvLnJlbHOdkk1Pg0AQhu/+CrJ3WaA1jWl' +
  // ... we'll generate this at runtime from a stored template instead.
  '';

export interface Doc {
  id: string;
  title: string;
  owner_id: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  updated_at: string;
  opened_at: string;
}

export type ListedDoc = Doc & {
  owner: { id: string; display_name: string; avatar_color: string; email: string };
  permission: 'owner' | 'write' | 'read';
};

/**
 * Lists documents visible to the user: docs they own + docs shared with them.
 * Ordered by most-recently-opened.
 */
export async function listDocsForUser(userId: string): Promise<ListedDoc[]> {
  // Owned docs
  const { data: owned } = await db
    .from('documents')
    .select('*, owner:users!documents_owner_id_fkey(id, display_name, avatar_color, email)')
    .eq('owner_id', userId)
    .order('opened_at', { ascending: false });

  // Shared-to docs
  const { data: shared } = await db
    .from('shares')
    .select('permission, document:documents(*, owner:users!documents_owner_id_fkey(id, display_name, avatar_color, email))')
    .eq('user_id', userId);

  const ownedDocs: ListedDoc[] = (owned ?? []).map((d: any) => ({ ...d, permission: 'owner' as const }));
  const sharedDocs: ListedDoc[] = (shared ?? [])
    .filter((s: any) => s.document)
    .map((s: any) => ({ ...s.document, permission: s.permission as 'read' | 'write' }));

  return [...ownedDocs, ...sharedDocs].sort(
    (a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime(),
  );
}

export async function getDocForUser(
  documentId: string,
  userId: string,
): Promise<{ doc: Doc; permission: 'owner' | 'write' | 'read' } | null> {
  const { data: doc } = await db
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .maybeSingle();
  if (!doc) return null;

  if (doc.owner_id === userId) return { doc, permission: 'owner' };

  const { data: share } = await db
    .from('shares')
    .select('permission')
    .eq('document_id', documentId)
    .eq('user_id', userId)
    .maybeSingle();
  if (!share) return null;
  return { doc, permission: share.permission as 'read' | 'write' };
}

/**
 * Creates a new empty .docx for a user and uploads it to storage.
 */
export async function createDoc(userId: string, title = 'Untitled document'): Promise<Doc> {
  const id = crypto.randomUUID();
  const storage_path = `${userId}/${id}.docx`;

  const bytes = await emptyDocxBytes();
  const { error: uploadErr } = await storage.upload(storage_path, bytes, {
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    upsert: false,
  });
  if (uploadErr) throw new Error('Failed to create document: ' + uploadErr.message);

  const { data, error } = await db
    .from('documents')
    .insert({
      id,
      owner_id: userId,
      title,
      storage_path,
      mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size_bytes: bytes.length,
    })
    .select('*')
    .single();
  if (error || !data) throw new Error('Failed to insert document row: ' + error?.message);
  return data as Doc;
}

export async function deleteDoc(docId: string, userId: string) {
  const { data: doc } = await db.from('documents').select('storage_path, owner_id').eq('id', docId).maybeSingle();
  if (!doc) return;
  if (doc.owner_id !== userId) throw new Error('Only the owner can delete.');
  await storage.remove([doc.storage_path]);
  await db.from('documents').delete().eq('id', docId);
}

export async function renameDoc(docId: string, userId: string, title: string) {
  const access = await getDocForUser(docId, userId);
  if (!access || access.permission === 'read') throw new Error('No permission.');
  await db.from('documents').update({ title }).eq('id', docId);
}

export async function touchOpened(docId: string) {
  await db.from('documents').update({ opened_at: new Date().toISOString() }).eq('id', docId);
}

/**
 * Returns the bytes of a minimal valid empty .docx. Built at runtime via JSZip
 * to avoid shipping a fixture file. Cached after first call.
 */
let _emptyDocx: Uint8Array | null = null;
async function emptyDocxBytes(): Promise<Uint8Array> {
  if (_emptyDocx) return _emptyDocx;
  // Lazy import so the JSZip dep only loads on first doc creation.
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();

  zip.file('[Content_Types].xml',
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`);

  zip.folder('_rels')!.file('.rels',
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  // styles.xml — sets Instrument Sans as the document default font (11pt).
  zip.folder('word')!.file('styles.xml',
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Instrument Sans" w:hAnsi="Instrument Sans" w:cs="Instrument Sans"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault><w:pPr><w:spacing w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr>
      <w:rFonts w:ascii="Instrument Sans" w:hAnsi="Instrument Sans" w:cs="Instrument Sans"/>
      <w:sz w:val="22"/>
    </w:rPr>
  </w:style>
</w:styles>`);

  zip.folder('word')!.file('_rels/document.xml.rels',
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);

  zip.folder('word')!.file('document.xml',
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:rPr><w:rFonts w:ascii="Instrument Sans" w:hAnsi="Instrument Sans" w:cs="Instrument Sans"/></w:rPr></w:pPr>
    </w:p>
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`);

  _emptyDocx = new Uint8Array(await zip.generateAsync({ type: 'uint8array' }));
  return _emptyDocx;
}
