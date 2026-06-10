import { createClient } from "@supabase/supabase-js";

// Retrieve configuration from Vite client-side environment variables
const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || "https://mfxfogdcqouymquhxwsr.supabase.co";
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || "sb_publishable__m7Os3VT8pKtfuPQLKBK1w_7-OhftIj";

// Graceful check to inform developers in console about the environment variables
const isConfigured = 
  metaEnv.VITE_SUPABASE_URL !== undefined && 
  metaEnv.VITE_SUPABASE_ANON_KEY !== undefined;

if (!isConfigured) {
  console.warn(
    "⚠️ Supabase is running with placeholder credentials. " +
    "Please define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your env secrets for persistent cloud synchronization."
  );
}

// Initialize the client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseConfig = {
  isConfigured,
  url: supabaseUrl,
};

/**
 * 💡 STRUKTUR TABEL REKOMENDASI UNTUK SUPABASE
 * 
 * Jika Anda ingin melakukan integrasi database penuh, silakan buat tabel berikut di SQL Editor Supabase Anda:
 * 
 * -- 1. Tabel Loket Pelayanan
 * CREATE TABLE public.loket (
 *   id TEXT PRIMARY KEY,
 *   name TEXT NOT NULL,
 *   prefix VARCHAR(5) NOT NULL,
 *   service_name TEXT NOT NULL,
 *   is_active BOOLEAN DEFAULT TRUE
 * );
 * 
 * -- 2. Tabel Antrean (Queues)
 * CREATE TABLE public.queues (
 *   id TEXT PRIMARY KEY,
 *   number INTEGER NOT NULL,
 *   formatted_number TEXT NOT NULL,
 *   service_name TEXT NOT NULL,
 *   prefix VARCHAR(5) NOT NULL,
 *   status TEXT CHECK (status IN ('waiting', 'calling', 'completed', 'skipped')) NOT NULL DEFAULT 'waiting',
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   called_at TIMESTAMPTZ,
 *   completed_at TIMESTAMPTZ,
 *   loket_id TEXT REFERENCES public.loket(id),
 *   loket_name TEXT,
 *   pelanggan_nama TEXT,
 *   pelanggan_id TEXT,
 *   pelanggan_alamat TEXT,
 *   pelanggan_hp TEXT,
 *   pelanggan_keterangan TEXT
 * );
 * 
 * -- 3. Tabel Pengaturan Monitor & Cetakan (Optional)
 * CREATE TABLE public.settings (
 *   key TEXT PRIMARY KEY,
 *   value JSONB NOT NULL
 * );
 */
