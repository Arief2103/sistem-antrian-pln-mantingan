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

// Legacy db client emulator for Indonesian panel pages and ticket kiosk components
export const db = {
  pengguna: {
    get: () => {
      try {
        const saved = localStorage.getItem("pln_queue_users_list2");
        if (saved) {
          const parsed = JSON.parse(saved);
          return parsed.map((u: any) => ({
            ...u,
            nama: u.name || u.nama,
          }));
        }
      } catch (e) {
        console.error("pln_queue_users_list2 parse error:", e);
      }
      return [
        { id: "u1", name: "Administrator Utama", nama: "Administrator Utama", role: "admin", username: "admin", password: "plnmantingan" },
        { id: "u2", name: "Petugas Loket Pelanggan", nama: "Petugas Loket Pelanggan", role: "petugas", username: "petugas1", password: "plnmantingan" },
        { id: "u3", name: "Petugas Loket P2TL", nama: "Petugas Loket P2TL", role: "petugas", username: "petugas2", password: "plnmantingan" },
      ];
    },
    tambah: (usernameLower: string, newNama: string, newRole: "admin" | "petugas", newLoket?: string) => {
      const current = db.pengguna.get();
      const newUser = {
        id: "u_" + Date.now(),
        name: newNama,
        nama: newNama,
        username: usernameLower,
        role: newRole,
        password: "plnmantingan",
        loketId: newLoket,
      };
      const next = [...current, newUser];
      localStorage.setItem("pln_queue_users_list2", JSON.stringify(next));
      try {
        supabase.from("settings").upsert({
          key: "users_list",
          value: next
        }).then(({ error }) => { if (error) console.warn(error); });
      } catch (_) {}
    },
    hapus: (id: string) => {
      const current = db.pengguna.get();
      const next = current.filter((u: any) => u.id !== id);
      localStorage.setItem("pln_queue_users_list2", JSON.stringify(next));
      try {
        supabase.from("settings").upsert({
          key: "users_list",
          value: next
        }).then(({ error }) => { if (error) console.warn(error); });
      } catch (_) {}
    }
  },
  loket: {
    get: () => {
      try {
        const saved = localStorage.getItem("pln_queue_loket");
        if (saved) {
          const parsed = JSON.parse(saved);
          return parsed.map((l: any) => ({
            ...l,
            status: l.status || (l.isActive || l.is_active ? 'aktif' : 'nonaktif'),
            layananIds: l.layananIds || (l.prefix === 'A' ? ['ly1'] : ['ly2']),
          }));
        }
      } catch (e) {
        console.error("pln_queue_loket parse error:", e);
      }
      return [
        { id: "l1", name: "Loket 1", prefix: "A", serviceName: "LAYANAN ADMINISTRASI", service_name: "LAYANAN ADMINISTRASI", isActive: true, status: "aktif", layananIds: ["ly1"] },
        { id: "l2", name: "Loket 2", prefix: "B", serviceName: "LAYANAN TEKNIS / PERIZINAN", service_name: "LAYANAN TEKNIS / PERIZINAN", isActive: true, status: "aktif", layananIds: ["ly2"] },
      ];
    },
    updateStatus: (id: string, newStatus: string | boolean) => {
      const isAktif = newStatus === 'aktif' || newStatus === true;
      const current = db.loket.get();
      const updated = current.map((l: any) => l.id === id ? { 
        ...l, 
        isActive: isAktif, 
        is_active: isAktif,
        status: isAktif ? 'aktif' : 'nonaktif' 
      } : l);
      localStorage.setItem("pln_queue_loket", JSON.stringify(updated));
      try {
        for (const l of updated) {
          supabase.from("loket").upsert({
            id: l.id,
            name: l.name,
            prefix: l.prefix,
            service_name: l.serviceName || l.service_name,
            is_active: l.isActive,
          }).then(({ error }) => { if (error) console.warn(error); });
        }
      } catch (_) {}
    },
    assignPetugas: (loketId: string, petugasId: string | null, petugasNama: string | null) => {
      const current = db.loket.get();
      const updated = current.map((l: any) => l.id === loketId ? { ...l, petugasId, petugasNama } : l);
      localStorage.setItem("pln_queue_loket", JSON.stringify(updated));
    },
    save: (updated: any[]) => {
      const normalized = updated.map((l) => ({
        ...l,
        isActive: l.isActive !== undefined ? l.isActive : l.is_active,
        serviceName: l.serviceName || l.service_name,
      }));
      localStorage.setItem("pln_queue_loket", JSON.stringify(normalized));
      try {
        for (const l of normalized) {
          supabase.from("loket").upsert({
            id: l.id,
            name: l.name,
            prefix: l.prefix,
            service_name: l.serviceName,
            is_active: l.isActive,
          }).then(({ error }) => { if (error) console.warn(error); });
        }
      } catch (_) {}
    }
  },
  layanan: {
    get: () => {
      return [
        { id: "ly1", name: "LAYANAN ADMINISTRASI", prefix: "A", deskripsi: "Pendaftaran Pasang Baru / Perubahan Daya Listrik" },
        { id: "ly2", name: "LAYANAN TEKNIS / PERIZINAN", prefix: "B", deskripsi: "Pengaduan Gangguan / P2TL / Keluhan Pelanggan" }
      ];
    }
  },
  antrian: {
    get: () => {
      try {
        const saved = localStorage.getItem("pln_queue_items");
        if (saved) {
          const parsed = JSON.parse(saved);
          return parsed.map((item: any) => ({
            ...item,
            status: item.status === "waiting" ? "menunggu" : item.status === "calling" ? "memanggil" : item.status === "completed" ? "selesai" : item.status === "skipped" ? "dilewati" : item.status,
            layananId: item.prefix === "A" ? "ly1" : "ly2",
            layananNama: item.serviceName || item.service_name || "",
          }));
        }
      } catch (e) {
        console.error("pln_queue_items parse error:", e);
      }
      return [];
    },
    buat: (layananId: string) => {
      const layanans = db.layanan.get();
      const targetLayanan = layanans.find((l: any) => l.id === layananId) || layanans[0];
      const prefix = targetLayanan.prefix;
      
      const currentAll = db.antrian.get();
      const todayStr = new Date().toDateString();
      const todayPrefixQueues = currentAll.filter((q: any) => {
        return q.prefix === prefix && new Date(q.createdAt).toDateString() === todayStr;
      });
      const nextNum = todayPrefixQueues.length + 1;
      const formattedNum = `${prefix}${String(nextNum).padStart(3, "0")}`;

      const newTicket: any = {
        id: "q_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        number: nextNum,
        formattedNumber: formattedNum,
        prefix: prefix,
        status: "menunggu",
        createdAt: new Date().toISOString(),
        layananId: layananId,
        layananNama: targetLayanan.name,
        serviceName: targetLayanan.name,
      };

      const normalForm = {
        id: newTicket.id,
        number: newTicket.number,
        formattedNumber: newTicket.formattedNumber,
        serviceName: newTicket.serviceName,
        prefix: newTicket.prefix,
        status: "waiting" as const,
        createdAt: newTicket.createdAt,
      };

      try {
        const savedRaw = localStorage.getItem("pln_queue_items");
        const parsed = savedRaw ? JSON.parse(savedRaw) : [];
        const nextList = [...parsed, normalForm];
        localStorage.setItem("pln_queue_items", JSON.stringify(nextList));
        localStorage.setItem("pln_queue_last_created", JSON.stringify(normalForm));
        
        supabase.from("queues").insert({
          id: normalForm.id,
          number: normalForm.number,
          formatted_number: normalForm.formattedNumber,
          service_name: normalForm.serviceName,
          prefix: normalForm.prefix,
          status: normalForm.status,
          created_at: normalForm.createdAt,
        }).then(({ error }) => { if (error) console.warn(error); });
      } catch (e) {
        console.error("Failed to persist printed queue ticket:", e);
      }

      return newTicket;
    }
  },
  printerSettings: {
    get: () => {
      try {
        const saved = localStorage.getItem("pln_print_settings");
        if (saved) {
          const parsed = JSON.parse(saved);
          
          // Fallbacks with exact casing (mixed case) defaults
          const headerVal = parsed.namaInstansi || parsed.headerText || "PT PLN (Persero) UP3 Madiun";
          const subHeaderVal = parsed.cabang || parsed.subHeader || "ULP Mantingan";
          const alamatVal = parsed.alamat || "Jl. Raya Mantingan, Ngawi, Jawa Timur";
          const footer1Val = parsed.footerSatu || "Terima kasih atas kunjungan anda.";
          const footer2Val = parsed.footerDua || "Jauhi bahaya listrik demi keselamatan keluarga tercinta.";
          const footerVal = parsed.footer || parsed.footerText || "Terima kasih...";
          
          return {
            namaInstansi: headerVal,
            cabang: subHeaderVal,
            alamat: alamatVal,
            footerSatu: footer1Val,
            footerDua: footer2Val,
            footer: footerVal,
            headerText: headerVal,
            subHeader: subHeaderVal,
            footerText: footerVal,
            
            // New fine-grained sizing controls (in px / pt)
            logoSize: parsed.logoSize !== undefined ? Number(parsed.logoSize) : 48,
            sizeNamaInstansi: parsed.sizeNamaInstansi !== undefined ? Number(parsed.sizeNamaInstansi) : 14,
            sizeCabang: parsed.sizeCabang !== undefined ? Number(parsed.sizeCabang) : 11,
            sizeAlamat: parsed.sizeAlamat !== undefined ? Number(parsed.sizeAlamat) : 8,
            sizeFooterSatu: parsed.sizeFooterSatu !== undefined ? Number(parsed.sizeFooterSatu) : 8,
            sizeFooterDua: parsed.sizeFooterDua !== undefined ? Number(parsed.sizeFooterDua) : 8,
            sizeDateTime: parsed.sizeDateTime !== undefined ? Number(parsed.sizeDateTime) : 8,
            sizeTeksNomorAntrian: parsed.sizeTeksNomorAntrian !== undefined ? Number(parsed.sizeTeksNomorAntrian) : 9,
            sizeNomorAntrian: parsed.sizeNomorAntrian !== undefined ? Number(parsed.sizeNomorAntrian) : 40,
            sizeLayanan: parsed.sizeLayanan !== undefined ? Number(parsed.sizeLayanan) : 10,

            showLogo: parsed.showLogo !== undefined ? parsed.showLogo : true,
            logoType: parsed.logoType || "default",
            customLogo: parsed.customLogo || "",
            showFooterDua: parsed.showFooterDua !== undefined ? parsed.showFooterDua : true,
            feedLines: parsed.feedLines !== undefined ? Number(parsed.feedLines) : 1,
            paperWidth: parsed.paperWidth || "58mm",
            cetakQr: parsed.cetakQr !== undefined ? parsed.cetakQr : false, // disabled by default based on request
            useBluetoothPrintApp: parsed.useBluetoothPrintApp !== undefined ? parsed.useBluetoothPrintApp : false,
            useWebBluetooth: parsed.useWebBluetooth !== undefined ? parsed.useWebBluetooth : true, // direct bluetooth is the priority
            useRawBtApp: parsed.useRawBtApp !== undefined ? parsed.useRawBtApp : false,
          };
        }
      } catch (e) {}
      return {
        namaInstansi: "PT PLN (Persero) UP3 Madiun",
        cabang: "ULP Mantingan",
        alamat: "Jl. Raya Mantingan, Ngawi, Jawa Timur",
        footerSatu: "Terima kasih atas kunjungan anda.",
        footerDua: "Jauhi bahaya listrik demi keselamatan keluarga tercinta.",
        footer: "Terima kasih atas kunjungan anda. Jauhi bahaya listrik demi keselamatan keluarga tercinta.",
        headerText: "PT PLN (Persero) UP3 Madiun",
        subHeader: "ULP Mantingan",
        footerText: "Terima kasih atas kunjungan anda. Jauhi bahaya listrik demi keselamatan keluarga tercinta.",
        
        // Sizing defaults
        logoSize: 48,
        sizeNamaInstansi: 14,
        sizeCabang: 11,
        sizeAlamat: 8,
        sizeFooterSatu: 8,
        sizeFooterDua: 8,
        sizeDateTime: 8,
        sizeTeksNomorAntrian: 9,
        sizeNomorAntrian: 40,
        sizeLayanan: 10,

        showLogo: true,
        logoType: "default",
        customLogo: "",
        showFooterDua: true,
        feedLines: 1,
        paperWidth: "58mm",
        cetakQr: false, // disabled by default
        useBluetoothPrintApp: false,
        useWebBluetooth: true, // direct bluetooth default
        useRawBtApp: false,
      };
    },
    save: (settings: any) => {
      const mapped = {
        headerText: settings.namaInstansi,
        subHeader: settings.cabang,
        namaInstansi: settings.namaInstansi,
        cabang: settings.cabang,
        alamat: settings.alamat,
        footerSatu: settings.footerSatu,
        footerDua: settings.footerDua,
        footer: settings.footer || settings.footerText,
        footerText: settings.footer || settings.footerText,
        
        // Sizes
        logoSize: settings.logoSize !== undefined ? Number(settings.logoSize) : 48,
        sizeNamaInstansi: settings.sizeNamaInstansi !== undefined ? Number(settings.sizeNamaInstansi) : 14,
        sizeCabang: settings.sizeCabang !== undefined ? Number(settings.sizeCabang) : 11,
        sizeAlamat: settings.sizeAlamat !== undefined ? Number(settings.sizeAlamat) : 8,
        sizeFooterSatu: settings.sizeFooterSatu !== undefined ? Number(settings.sizeFooterSatu) : 8,
        sizeFooterDua: settings.sizeFooterDua !== undefined ? Number(settings.sizeFooterDua) : 8,
        sizeDateTime: settings.sizeDateTime !== undefined ? Number(settings.sizeDateTime) : 8,
        sizeTeksNomorAntrian: settings.sizeTeksNomorAntrian !== undefined ? Number(settings.sizeTeksNomorAntrian) : 9,
        sizeNomorAntrian: settings.sizeNomorAntrian !== undefined ? Number(settings.sizeNomorAntrian) : 40,
        sizeLayanan: settings.sizeLayanan !== undefined ? Number(settings.sizeLayanan) : 10,

        showLogo: settings.showLogo !== undefined ? settings.showLogo : true,
        logoType: settings.logoType || "default",
        customLogo: settings.customLogo || "",
        showFooterDua: settings.showFooterDua !== undefined ? settings.showFooterDua : true,
        feedLines: settings.feedLines !== undefined ? Number(settings.feedLines) : 1,
        paperWidth: settings.paperWidth || "58mm",
        cetakQr: settings.cetakQr !== undefined ? settings.cetakQr : false,
        useBluetoothPrintApp: settings.useBluetoothPrintApp !== undefined ? settings.useBluetoothPrintApp : false,
        useWebBluetooth: settings.useWebBluetooth !== undefined ? settings.useWebBluetooth : true,
        useRawBtApp: settings.useRawBtApp !== undefined ? settings.useRawBtApp : false,
      };
      localStorage.setItem("pln_print_settings", JSON.stringify(mapped));
      try {
        supabase.from("settings").upsert({
          key: "print_settings",
          value: mapped
        }).then(({ error }) => { if (error) console.warn(error); });
      } catch (_) {}
    }
  }
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
