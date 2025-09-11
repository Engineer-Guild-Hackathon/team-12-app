CREATE TABLE IF NOT EXISTS posts (
  post_id    UUID        PRIMARY KEY,
  user_id    UUID        NOT NULL,
  img_id     UUID        NOT NULL,
  question   TEXT        NOT NULL,
  target     TEXT        NOT NULL,
  answer     TEXT        NOT NULL,
  toi        TEXT        NOT NULL,
  location   TEXT        NOT NULL,
  latitude   DOUBLE PRECISION NOT NULL,
  longitude  DOUBLE PRECISION NOT NULL,
  date       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_posts_latitude  CHECK (latitude  BETWEEN -90  AND 90),
  CONSTRAINT chk_posts_longitude CHECK (longitude BETWEEN -180 AND 180)
);

-- 外部キー制約
-- ALTER TABLE posts
--   ADD CONSTRAINT fk_posts_image
--   FOREIGN KEY (img_id)
--   REFERENCES images(img_id)
--   ON UPDATE CASCADE
--   ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_posts_user_id   ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_date      ON posts(date);
CREATE INDEX IF NOT EXISTS idx_posts_img_id    ON posts(img_id);
CREATE INDEX IF NOT EXISTS idx_posts_lat_lng   ON posts(latitude, longitude);

-- updated_at の自動更新トリガ（FUNCTION を使用）
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_posts_touch ON posts;

CREATE TRIGGER trg_posts_touch
BEFORE UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();