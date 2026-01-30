/*
  # Gallery Cache System for Dropbox Integration

  1. New Tables
    - `gallery_images`
      - `id` (uuid, primary key)
      - `filename` (text) - Original filename from Dropbox
      - `category` (text) - Category folder (weddings, baptisms, events, bouquets)
      - `dropbox_path` (text) - Full path in Dropbox
      - `dropbox_id` (text) - Dropbox file ID
      - `public_url` (text) - Direct URL to image
      - `thumbnail_url` (text) - Thumbnail URL
      - `caption_el` (text) - Auto-generated Greek caption
      - `caption_en` (text) - Auto-generated English caption
      - `file_size` (bigint) - File size in bytes
      - `is_active` (boolean) - Whether image should be displayed
      - `display_order` (integer) - Manual sorting order
      - `last_synced` (timestamptz) - Last time synced from Dropbox
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `gallery_sync_log`
      - `id` (uuid, primary key)
      - `sync_started_at` (timestamptz)
      - `sync_completed_at` (timestamptz)
      - `images_found` (integer)
      - `images_added` (integer)
      - `images_updated` (integer)
      - `images_removed` (integer)
      - `status` (text) - success, failed, in_progress
      - `error_message` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Public read access for gallery_images (active images only)
    - No public write access

  3. Indexes
    - Index on category for filtering
    - Index on is_active for query performance
    - Index on display_order for sorting
*/

CREATE TABLE IF NOT EXISTS gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  category text NOT NULL CHECK (category IN ('weddings', 'baptisms', 'events', 'bouquets')),
  dropbox_path text NOT NULL UNIQUE,
  dropbox_id text,
  public_url text NOT NULL,
  thumbnail_url text,
  caption_el text DEFAULT '',
  caption_en text DEFAULT '',
  file_size bigint DEFAULT 0,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  last_synced timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gallery_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_started_at timestamptz DEFAULT now(),
  sync_completed_at timestamptz,
  images_found integer DEFAULT 0,
  images_added integer DEFAULT 0,
  images_updated integer DEFAULT 0,
  images_removed integer DEFAULT 0,
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'success', 'failed')),
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gallery_images_category ON gallery_images(category);
CREATE INDEX IF NOT EXISTS idx_gallery_images_active ON gallery_images(is_active);
CREATE INDEX IF NOT EXISTS idx_gallery_images_order ON gallery_images(display_order DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_sync_log_created ON gallery_sync_log(created_at DESC);

ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active gallery images"
  ON gallery_images FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view sync logs"
  ON gallery_sync_log FOR SELECT
  USING (true);

CREATE OR REPLACE FUNCTION update_gallery_image_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_gallery_images_updated_at'
  ) THEN
    CREATE TRIGGER update_gallery_images_updated_at
      BEFORE UPDATE ON gallery_images
      FOR EACH ROW
      EXECUTE FUNCTION update_gallery_image_timestamp();
  END IF;
END $$;
