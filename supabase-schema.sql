-- OPTIMUS Supabase Configuration Setup Script
-- Jalankan skrip ini pada fitur SQL Editor di dalam dasbor proyek Supabase Anda.

-- ==========================================
-- 1. Tabel Settings (Untuk Logo & Konfigurasi Umum)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.settings (
  "key" TEXT PRIMARY KEY,
  "value" TEXT
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Settings" ON public.settings;
DROP POLICY IF EXISTS "Public All Settings" ON public.settings;
CREATE POLICY "Public Read Settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Public All Settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);


-- ==========================================
-- 2. Tabel Welcome Settings (Untuk Media Welcome Page)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.welcome_settings (
  id TEXT PRIMARY KEY,
  image_url TEXT,
  video_url TEXT,
  youtube_url TEXT,
  google_drive_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.welcome_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read welcome Settings" ON public.welcome_settings;
DROP POLICY IF EXISTS "Public All welcome Settings" ON public.welcome_settings;
CREATE POLICY "Public Read welcome Settings" ON public.welcome_settings FOR SELECT USING (true);
CREATE POLICY "Public All welcome Settings" ON public.welcome_settings FOR ALL USING (true) WITH CHECK (true);

-- Insert default base setting
INSERT INTO public.welcome_settings (id, image_url, video_url, youtube_url, google_drive_url)
VALUES ('1', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1920&q=80', '', '', '')
ON CONFLICT (id) DO NOTHING;


-- ==========================================
-- 3. Tabel Profil Indikator
-- ==========================================
CREATE TABLE IF NOT EXISTS public.master_indikator (
  id TEXT PRIMARY KEY,
  category TEXT,
  title TEXT,
  rationale TEXT,
  quality_dimension TEXT,
  purpose TEXT,
  operational_definition TEXT,
  indicator_type TEXT,
  measurement_unit TEXT,
  numerator TEXT,
  denominator TEXT,
  target TEXT,
  criteria TEXT,
  formula TEXT,
  data_collection_method TEXT,
  data_source TEXT,
  sampling_method TEXT,
  data_collection_instrument TEXT,
  sample_size TEXT,
  collection_period TEXT,
  analysis_period TEXT,
  data_presentation TEXT,
  person_in_charge TEXT,
  reverse BOOLEAN DEFAULT false,
  created_by TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.master_indikator ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read master_indikator" ON public.master_indikator;
DROP POLICY IF EXISTS "Public All master_indikator" ON public.master_indikator;
CREATE POLICY "Public Read master_indikator" ON public.master_indikator FOR SELECT USING (true);
CREATE POLICY "Public All master_indikator" ON public.master_indikator FOR ALL USING (true) WITH CHECK (true);


-- ==========================================
-- 4. Tabel Data Input Mutu (Catatan IKP / INM)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.indicator_inputs (
  id TEXT PRIMARY KEY,
  unit_id TEXT,
  sub_unit TEXT,
  category_id TEXT,
  indicator_id TEXT,
  input_date TEXT,
  numerator_value NUMERIC,
  denominator_value NUMERIC,
  target TEXT,
  achievement_percentage NUMERIC,
  notes TEXT,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.indicator_inputs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read indicator_inputs" ON public.indicator_inputs;
DROP POLICY IF EXISTS "Public All indicator_inputs" ON public.indicator_inputs;
CREATE POLICY "Public Read indicator_inputs" ON public.indicator_inputs FOR SELECT USING (true);
CREATE POLICY "Public All indicator_inputs" ON public.indicator_inputs FOR ALL USING (true) WITH CHECK (true);


-- ==========================================
-- 5. Tabel Data Pengguna / Unit (Opsional)
-- ==========================================
-- Digunakan untuk integrasi di masa depan, meskipun saat ini state lokal sudah memadai
CREATE TABLE IF NOT EXISTS public.units (
  id TEXT PRIMARY KEY,
  name TEXT,
  category TEXT,
  status TEXT
);
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read units" ON public.units;
DROP POLICY IF EXISTS "Public All units" ON public.units;
CREATE POLICY "Public Read units" ON public.units FOR SELECT USING (true);
CREATE POLICY "Public All units" ON public.units FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- 6. Tabel Data Visite DPJP (Khusus Monitor Visite)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.visite_dpjp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tanggal_visite DATE,
  nama_pasien TEXT,
  visite_sebelum_14 BOOLEAN,
  visite_setelah_14 BOOLEAN,
  nama_dokter TEXT,
  keterangan TEXT,
  indikator_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_by UUID
);

ALTER TABLE public.visite_dpjp ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read visite_dpjp" ON public.visite_dpjp;
DROP POLICY IF EXISTS "Public All visite_dpjp" ON public.visite_dpjp;
CREATE POLICY "Public Read visite_dpjp" ON public.visite_dpjp FOR SELECT USING (true);
CREATE POLICY "Public All visite_dpjp" ON public.visite_dpjp FOR ALL USING (true) WITH CHECK (true);


-- ==========================================
-- 7. Setup Supabase Storage (Bucket untuk Logo & Bukti Lampiran)
-- ==========================================
-- (Harap pastikan skema storage telah aktif pada proyek Anda).
INSERT INTO storage.buckets (id, name, public) 
VALUES ('logos', 'logos', true) 
ON CONFLICT (id) DO NOTHING;

-- Policies untuk Storage
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "Public Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos');
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'logos');
-- ==========================================
-- 8. Tabel Survei Budaya Keselamatan Pasien
-- ==========================================
CREATE TABLE IF NOT EXISTS public.survei_budaya (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_kerja TEXT,
  bagian_a JSONB,
  bagian_b JSONB,
  bagian_c JSONB,
  bagian_d JSONB,
  bagian_e TEXT,
  bagian_f JSONB,
  bagian_g TEXT,
  bagian_h JSONB,
  bagian_i_komentar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.survei_budaya ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read survei_budaya" ON public.survei_budaya;
DROP POLICY IF EXISTS "Public All survei_budaya" ON public.survei_budaya;
CREATE POLICY "Public Read survei_budaya" ON public.survei_budaya FOR SELECT USING (true);
CREATE POLICY "Public All survei_budaya" ON public.survei_budaya FOR ALL USING (true) WITH CHECK (true);

