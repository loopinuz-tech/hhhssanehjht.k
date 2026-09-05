-- ═══════════════════════════════════════════════════════════════════════════
-- EduContest — Universitetlar jadvali
-- Supabase SQL Editor'da ishga tushiring
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS universities (
  id              bigserial    PRIMARY KEY,
  slug            text         UNIQUE NOT NULL,
  name            text         NOT NULL,
  url             text,
  yonalish_soni   text,
  kontrakt        text,
  qabul           text,
  logo_url        text,
  tavsif          text,
  telefon         text,
  website         text,
  manzil          text,
  telegram        text,
  instagram       text,
  talaba_soni     text,
  bitiruvchi_soni text,
  tajriba_yili    text,
  yonalishlar     jsonb        DEFAULT '[]'::jsonb,
  created_at      timestamptz  DEFAULT now(),
  updated_at      timestamptz  DEFAULT now()
);

ALTER TABLE universities ENABLE ROW LEVEL SECURITY;

-- Barcha foydalanuvchilar o'qiy oladi
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='universities' AND policyname='universities_public_read') THEN
    CREATE POLICY "universities_public_read" ON universities FOR SELECT USING (true);
  END IF;
END $$;

-- Faqat adminlar yozishi/yangilashi/o'chirishi mumkin
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='universities' AND policyname='universities_admin_write') THEN
    CREATE POLICY "universities_admin_write" ON universities FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin','sub_admin')));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_universities_slug ON universities (slug);
