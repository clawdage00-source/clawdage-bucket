-- Seed / upsert MVP tools (name, slug, is_pro) — run in Supabase SQL Editor after `migration/supabase_migration.sql`.
-- Keeps app `lib/tools-data.ts` and database `is_pro` in sync when you re-run this file.
-- If you previously seeded `aadhar-pan-card-resizer`, run: delete from public.tools where slug = 'aadhar-pan-card-resizer';

insert into public.tools (name, slug, is_pro)
values
  ('Merge PDF', 'merge-pdf', false),
  ('Compress PDF', 'compress-pdf', false),
  ('Image to PDF', 'image-to-pdf', false),
  ('AI Background Remover', 'ai-background-remover', true),
  ('Image Compressor', 'image-compressor', false),
  ('Format Converter', 'format-converter', false),
  ('Passport Photo Maker', 'passport-photo-maker', true),
  ('Aadhar / PAN Card Resizer', 'id-resizer', false),
  ('QR Code Generator', 'qr-generator', false),
  ('Image to Text OCR', 'image-to-text-ocr', true)
on conflict (slug) do update
set
  name = excluded.name,
  is_pro = excluded.is_pro;
