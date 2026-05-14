-- Add per-document thumbnail metadata. Thumbnails are rendered by Collabora
-- (/cool/convert-to/png) on save and stored in the `doc-thumbnails` bucket
-- at path `{owner_id}/{document_id}.png`. We keep the storage path plus the
-- generated_at timestamp so the UI can compute cache-busted signed URLs.

alter table docs.documents
  add column if not exists thumbnail_path text,
  add column if not exists thumbnail_generated_at timestamptz;
