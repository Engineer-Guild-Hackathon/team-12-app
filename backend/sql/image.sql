CREATE TABLE IF NOT EXISTS images (
  img_id       UUID PRIMARY KEY,
  gcs_uri      TEXT NOT NULL,
  mime_type    TEXT NOT NULL,
  size_bytes   BIGINT NOT NULL,
  sha256_hex   CHAR(64) NOT NULL,
  status       TEXT NOT NULL CHECK (status IN ('pending','stored','failed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated_at の自動更新（拡張を使わない素朴な方法の例）
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_images_touch ON images;
CREATE TRIGGER trg_images_touch
BEFORE UPDATE ON images
FOR EACH ROW EXECUTE PROCEDURE touch_updated_at();