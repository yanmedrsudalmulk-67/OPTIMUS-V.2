-- =========================================================================
-- MIGRATION SCRIPT: Ubah Tipe Data Kolom Target Menjadi TEXT
-- =========================================================================
-- Penjelasan:
-- Tabel master_indikator dan indicator_inputs sebelumnya menggunakan tipe 
-- data NUMERIC untuk kolom "target" (karena hanya menerima angka). 
-- Karena sekarang kita memperbolehkan input teks seperti "≥ 80%" atau "24 Jam",
-- kolom tersebut harus diubah menjadi tipe TEXT.
--
-- Silakan jalankan script ini di SQL Editor pada dashboard Supabase Anda.
-- =========================================================================

-- 1. Ubah tipe data kolom target pada master_indikator menjadi TEXT
ALTER TABLE public.master_indikator 
ALTER COLUMN target TYPE TEXT USING target::TEXT;

-- 2. Ubah tipe data kolom target pada indicator_inputs menjadi TEXT
ALTER TABLE public.indicator_inputs 
ALTER COLUMN target TYPE TEXT USING target::TEXT;

-- Selesai. Setelah ini profil indikator dapat disimpan dengan benar.
