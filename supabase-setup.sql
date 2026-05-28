-- Skrip Konfigurasi Supabase untuk Aplikasi Kinerja & Mutu Rumah Sakit

-- Tabel Indikator Mutu (Profil Indikator)
CREATE TABLE IF NOT EXISTS master_indikator (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pengaturan Welcome Page & Logo
CREATE TABLE IF NOT EXISTS welcome_settings (
  id TEXT PRIMARY KEY,
  image_url TEXT,
  video_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default value for welcome_settings
INSERT INTO welcome_settings (id, image_url) 
VALUES ('1', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1920&q=80')
ON CONFLICT DO NOTHING;

-- Kebijakan Akses (RLS) - Publik untuk keperluan preview (Sesuaikan di Production)
ALTER TABLE master_indikator ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Master Indikator" ON master_indikator FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE welcome_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Welcome Settings" ON welcome_settings FOR ALL USING (true) WITH CHECK (true);

-- Membuat Storage Bucket untuk file upload seperti Logo dan Background
-- Catatan: Eksekusi ini via Storage interface Supabase atau SQL berikut jika mendukung:
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('backgrounds', 'backgrounds', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Public Access Logos" ON storage.objects FOR ALL USING (bucket_id = 'logos') WITH CHECK (bucket_id = 'logos');
CREATE POLICY "Public Access Backgrounds" ON storage.objects FOR ALL USING (bucket_id = 'backgrounds') WITH CHECK (bucket_id = 'backgrounds');
