import React, { useState, useEffect } from "react";
import { User, LoketItem, QueueItem, PrintSettings, MonitorSettings } from "./types";
import LoginScreen from "./components/LoginScreen";
import OfficerDashboard from "./pages/petugaspages/OfficerDashboard";
import AdminDashboard from "./pages/adminpages/AdminDashboard";
import DisplayMonitor from "./components/DisplayMonitor";
import TicketPrinter from "./components/TicketPrinter";
import Navbar from "./components/Navbar";
import { supabase } from "./config/supabase";
import { LayoutDashboard, Users, Tv, Printer, LogOut, CheckCircle, Flame, Shield, Award, HelpCircle } from "lucide-react";

export const DEFAULT_MONITOR_SETTINGS: MonitorSettings = {
  runningText: "SELAMAT DATANG DI PLN ULP MANTINGAN - PELAYANAN BEBAS PUNGLI JANGAN BERI TIP KEPADA PETUGAS KAMI - LAPORKAN JIKA ADA GANGGUAN VIA APLIKASI PLN MOBILE",
  logoTitle: "PLN ULP MANTINGAN",
  videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  voiceLanguage: "id-ID",
  voiceRate: 0.85,
  colorCardA: "#0284C7", // Bright corporate blue for Category A
  colorCardB: "#10B981", // Vibrant emerald green for Category B
  colorBackground: "#0d9488", // Teal backdrop
  colorHeaderLeft: "#0284c7", // Sky header left
  colorHeaderRight: "#16a34a", // Green header right
  colorText: "#ffffff", // White text
  nameAntrianA: "LAYANAN ADMINISTRASI",
  nameAntrianB: "LAYANAN TEKNIS / PERIZINAN",
  textSizeRunning: 18,
  textHeaderLeft: "PT PLN (PERSERO)",
  textHeaderSubtext: "ULP MANTINGAN",
  textBottomLabel: "INFO REKREASI",
  colorBottomBg: "#facc15", // default yellow-400
  colorBottomText: "#020617", // default deep slate
  videoUrls: ["https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
  layoutMode: "normal",
  videoVolume: 50,
  voiceVolume: 80,
  colorCardStatusWaiting: "#ffffff",
  colorCardStatusCalling: "#facc15",
  colorCardStatusCompleted: "#34d399",
  weatherRegion: "Ngawi",
  textSizeWeather: 14,
  textSizeRegion: 12,
  colorWeatherText: "#f1f5f9", // slate-100
  colorWeatherTemp: "#fbbf24", // amber-400
  colorWeatherRegion: "#cbd5e1", // slate-300
  slideImages: [
    "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=1200&auto=format&fit=crop", // Ketenagalistrikan / Energy
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1200&auto=format&fit=crop", // Office / Customer service
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop"  // Business PLN
  ]
};

export default function App() {
  // 1. Session state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("pln_queue_user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to parse pln_queue_user:", e);
      return null;
    }
  });

  const [isFullscreenDisplay, setIsFullscreenDisplay] = useState(false);
  const [adminSidebarOpen, setAdminSidebarOpen] = useState(true);

  // 1.5. User Accounts State
  const [usersList, setUsersList] = useState<User[]>(() => {
    const defaultUsers = [
      { id: "u1", name: "Administrator Utama", role: "admin", username: "admin", password: "plnmantingan" },
      { id: "u2", name: "Petugas Loket Pelanggan", role: "petugas", username: "petugas1", password: "plnmantingan" },
      { id: "u3", name: "Petugas Loket P2TL", role: "petugas", username: "petugas2", password: "plnmantingan" },
    ];
    try {
      const saved = localStorage.getItem("pln_queue_users_list2");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse pln_queue_users_list2:", e);
    }
    return defaultUsers;
  });

  // 2. Queue & Loket States
  const [loketList, setLoketList] = useState<LoketItem[]>(() => {
    try {
      const saved = localStorage.getItem("pln_queue_loket");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse pln_queue_loket:", e);
    }
    return [];
  });

  const [queues, setQueues] = useState<QueueItem[]>(() => {
    try {
      const saved = localStorage.getItem("pln_queue_items");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse pln_queue_items:", e);
      return [];
    }
  });

  const [lastCreatedQueue, setLastCreatedQueue] = useState<QueueItem | null>(() => {
    try {
      const saved = localStorage.getItem("pln_queue_last_created");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to parse pln_queue_last_created:", e);
      return null;
    }
  });

  // 3. Configurations States
  const [printSettings, setPrintSettings] = useState<PrintSettings>(() => {
    const defaultPrint = {
      headerText: "PLN ULP MANTINGAN",
      subHeader: "Jl. Raya Mantingan, Ngawi, Jawa Timur",
      footerText: "Terima kasih telah menggunakan pelayanan kami. Jauhi bahaya listrik untuk keluarga tercinta.",
      showLogo: true,
      paperWidth: "58mm",
      useBluetoothPrintApp: false,
    };
    try {
      const saved = localStorage.getItem("pln_print_settings");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse pln_print_settings:", e);
    }
    return defaultPrint;
  });

  const [monitorSettings, setMonitorSettings] = useState<MonitorSettings>(() => {
    const saved = localStorage.getItem("pln_monitor_settings");
    if (saved) {
      try {
        return { ...DEFAULT_MONITOR_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_MONITOR_SETTINGS;
      }
    }
    return DEFAULT_MONITOR_SETTINGS;
  });

  // Admin exclusive viewport sub-tab within the admin panel
  const [adminSubTab, setAdminSubTab] = useState<"dashboard" | "kiosk" | "tv">("dashboard");
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);

  // Load initial data from Supabase & Subscribe to changes in realtime
  useEffect(() => {
    async function loadData() {
      try {
        console.log("Fetching list of queues from Supabase...");
        const { data: qData, error: qError } = await supabase
          .from("queues")
          .select("*")
          .order("created_at", { ascending: true });
        
        if (qError) {
          console.warn("Supabase queues query fail:", qError.message);
        } else {
          console.log("Successfully loaded queues from Supabase:", qData);
          const loadedQueues: QueueItem[] = (qData || []).map((item: any) => ({
            id: item.id,
            number: item.number,
            formattedNumber: item.formatted_number || item.formattedNumber,
            serviceName: item.service_name || item.serviceName,
            prefix: item.prefix,
            status: item.status,
            createdAt: item.created_at || item.createdAt,
            calledAt: item.called_at || item.calledAt,
            completedAt: item.completed_at || item.completedAt,
            loketId: item.loket_id || item.loketId,
            loketName: item.loket_name || item.loketName,
            pelangganNama: item.pelanggan_nama || item.pelangganNama || "",
            pelangganId: item.pelanggan_id || item.pelangganId || "",
            pelangganAlamat: item.pelanggan_alamat || item.pelangganAlamat || "",
            pelangganHp: item.pelanggan_hp || item.pelangganHp || "",
            pelangganKeterangan: item.pelanggan_keterangan || item.pelangganKeterangan || "",
          }));
          setQueues(loadedQueues);
          const waitingOnes = loadedQueues.filter((q) => q.status === "waiting");
          if (waitingOnes.length > 0) {
            setLastCreatedQueue(waitingOnes[waitingOnes.length - 1]);
          } else {
            setLastCreatedQueue(null);
          }
        }
      } catch (e) {
        console.error("Failed to load initial data from Supabase:", e);
      }

      // Load loket
      try {
        const { data: lData, error: lError } = await supabase
          .from("loket")
          .select("*");
        if (lError) {
          console.warn("Supabase loket query fail:", lError.message);
        } else if (lData) {
          const loadedLokets: LoketItem[] = lData.map((item: any) => ({
            id: item.id,
            name: item.name,
            prefix: item.prefix,
            serviceName: item.service_name || item.serviceName,
            isActive: item.is_active !== undefined ? item.is_active : item.isActive,
          }));
          setLoketList(loadedLokets);
        }
      } catch (e) {
        console.error("Failed to load loket from Supabase", e);
      }

      // Load settings
      try {
        const { data: sData, error: sError } = await supabase
          .from("settings")
          .select("*");
        if (sError) {
          console.warn("Supabase settings query fail:", sError.message);
        } else if (sData && sData.length > 0) {
          const monitorObj = sData.find((s: any) => s.key === "monitor_settings") as any;
          if (monitorObj && monitorObj.value) {
            setMonitorSettings({ ...DEFAULT_MONITOR_SETTINGS, ...monitorObj.value });
          }
          const printObj = sData.find((s: any) => s.key === "print_settings") as any;
          if (printObj && printObj.value) {
            setPrintSettings(printObj.value);
          }
          const usersObj = sData.find((s: any) => s.key === "users_list") as any;
          if (usersObj && usersObj.value) {
            setUsersList(usersObj.value);
          }
        }
      } catch (e) {
        console.error("Failed to load settings from Supabase", e);
      } finally {
        setIsInitialDataLoaded(true);
      }
    }
    
    loadData();

    // Subscribe to realtime channels
    const queuesChannel = supabase
      .channel("queues-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queues" },
        (payload) => {
          console.log("Realtime queues change received:", payload);
          const { eventType, new: newRow, old: oldRow } = payload;
          if (eventType === "INSERT") {
            const newItem: QueueItem = {
              id: newRow.id,
              number: newRow.number,
              formattedNumber: newRow.formatted_number || newRow.formattedNumber,
              serviceName: newRow.service_name || newRow.serviceName,
              prefix: newRow.prefix,
              status: newRow.status,
              createdAt: newRow.created_at || newRow.createdAt,
              calledAt: newRow.called_at || newRow.calledAt,
              completedAt: newRow.completed_at || newRow.completedAt,
              loketId: newRow.loket_id || newRow.loketId,
              loketName: newRow.loket_name || newRow.loketName,
              pelangganNama: newRow.pelanggan_nama || newRow.pelangganNama || "",
              pelangganId: newRow.pelanggan_id || newRow.pelangganId || "",
              pelangganAlamat: newRow.pelanggan_alamat || newRow.pelangganAlamat || "",
              pelangganHp: newRow.pelanggan_hp || newRow.pelangganHp || "",
              pelangganKeterangan: newRow.pelanggan_keterangan || newRow.pelangganKeterangan || "",
            };
            setQueues((prev) => {
              if (prev.some((q) => q.id === newItem.id)) return prev;
              const next = [...prev, newItem];
              if (newItem.status === "waiting") {
                setLastCreatedQueue(newItem);
              }
              return next;
            });
          } else if (eventType === "UPDATE") {
            const updatedItem: QueueItem = {
              id: newRow.id,
              number: newRow.number,
              formattedNumber: newRow.formatted_number || newRow.formattedNumber,
              serviceName: newRow.service_name || newRow.serviceName,
              prefix: newRow.prefix,
              status: newRow.status,
              createdAt: newRow.created_at || newRow.createdAt,
              calledAt: newRow.called_at || newRow.calledAt,
              completedAt: newRow.completed_at || newRow.completedAt,
              loketId: newRow.loket_id || newRow.loketId,
              loketName: newRow.loket_name || newRow.loketName,
              pelangganNama: newRow.pelanggan_nama || newRow.pelangganNama || "",
              pelangganId: newRow.pelanggan_id || newRow.pelangganId || "",
              pelangganAlamat: newRow.pelanggan_alamat || newRow.pelangganAlamat || "",
              pelangganHp: newRow.pelanggan_hp || newRow.pelangganHp || "",
              pelangganKeterangan: newRow.pelanggan_keterangan || newRow.pelangganKeterangan || "",
            };
            setQueues((prev) =>
              prev.map((q) => (q.id === updatedItem.id ? updatedItem : q))
            );
          } else if (eventType === "DELETE") {
            setQueues((prev) => prev.filter((q) => q.id !== oldRow.id));
          }
        }
      )
      .subscribe();

    const loketChannel = supabase
      .channel("loket-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "loket" },
        (payload) => {
          console.log("Realtime loket change received:", payload);
          const { eventType, new: newRow, old: oldRow } = payload;
          if (eventType === "INSERT" || eventType === "UPDATE") {
            const newItem: LoketItem = {
              id: newRow.id,
              name: newRow.name,
              prefix: newRow.prefix,
              serviceName: newRow.service_name || newRow.serviceName,
              isActive: newRow.is_active !== undefined ? newRow.is_active : newRow.isActive,
            };
            setLoketList((prev) => {
              const idx = prev.findIndex((l) => l.id === newItem.id);
              if (idx !== -1) {
                const next = [...prev];
                next[idx] = newItem;
                return next;
              }
              return [...prev, newItem];
            });
          } else if (eventType === "DELETE") {
            setLoketList((prev) => prev.filter((l) => l.id !== oldRow.id));
          }
        }
      )
      .subscribe();

    const settingsChannel = supabase
      .channel("settings-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "settings" },
        (payload) => {
          console.log("Realtime settings change received:", payload);
          const newRow = payload.new as any;
          if (newRow && newRow.key === "monitor_settings") {
            setMonitorSettings({ ...DEFAULT_MONITOR_SETTINGS, ...newRow.value });
          } else if (newRow && newRow.key === "print_settings") {
            setPrintSettings(newRow.value);
          } else if (newRow && newRow.key === "users_list") {
            setUsersList(newRow.value);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(queuesChannel);
      supabase.removeChannel(loketChannel);
      supabase.removeChannel(settingsChannel);
    };
  }, []);

  // Save states to localStorage upon changes
  useEffect(() => {
    localStorage.setItem("pln_queue_loket", JSON.stringify(loketList));
  }, [loketList]);

  useEffect(() => {
    localStorage.setItem("pln_queue_items", JSON.stringify(queues));
  }, [queues]);

  useEffect(() => {
    localStorage.setItem("pln_queue_last_created", JSON.stringify(lastCreatedQueue));
  }, [lastCreatedQueue]);

  useEffect(() => {
    localStorage.setItem("pln_print_settings", JSON.stringify(printSettings));
  }, [printSettings]);

  useEffect(() => {
    localStorage.setItem("pln_monitor_settings", JSON.stringify(monitorSettings));
  }, [monitorSettings]);

  useEffect(() => {
    localStorage.setItem("pln_queue_users_list2", JSON.stringify(usersList));
  }, [usersList]);

  // Synchronize localStorage changes across tabs dynamically (e.g., between Admin tab and TV display tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "pln_monitor_settings" && e.newValue) {
        try {
          setMonitorSettings(JSON.parse(e.newValue));
        } catch (err) {
          console.error("Failed to parse synced monitor settings from storage event:", err);
        }
      }
      if (e.key === "pln_print_settings" && e.newValue) {
        try {
          setPrintSettings(JSON.parse(e.newValue));
        } catch (err) {
          console.error("Failed to parse synced print settings from storage event:", err);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Dedicated handlers to update settings and sync to Supabase (Only called when admin explicitly saves them!)
  const handleUpdatePrintSettings = async (settings: PrintSettings) => {
    setPrintSettings(settings);
    localStorage.setItem("pln_print_settings", JSON.stringify(settings));
    try {
      await supabase.from("settings").upsert({
        key: "print_settings",
        value: settings,
      });
    } catch (err) {
      console.error("Failed to sync print settings to Supabase:", err);
    }
  };

  const handleUpdateMonitorSettings = async (settings: MonitorSettings) => {
    setMonitorSettings(settings);
    localStorage.setItem("pln_monitor_settings", JSON.stringify(settings));
    try {
      await supabase.from("settings").upsert({
        key: "monitor_settings",
        value: settings,
      });
    } catch (err) {
      console.error("Failed to sync monitor settings to Supabase:", err);
    }
  };

  const handleUpdateUsersList = async (users: User[]) => {
    setUsersList(users);
    localStorage.setItem("pln_queue_users_list2", JSON.stringify(users));
    try {
      await supabase.from("settings").upsert({
        key: "users_list",
        value: users,
      });
    } catch (err) {
      console.error("Failed to sync users_list to Supabase:", err);
    }
  };

  // Dedicated helper to persist loket list changes directly to Supabase and update local state
  const handleUpdateLoketList = async (newList: LoketItem[]) => {
    // 1. Update React state & local storage immediately
    setLoketList(newList);
    localStorage.setItem("pln_queue_loket", JSON.stringify(newList));

    // 2. Perform direct and predictable Supabase updates/deletes
    try {
      const currentIds = newList.map((l) => l.id);
      
      // Select existing keys to figure out which are deleted from newList
      const { data: dbLokets, error: fetchErr } = await supabase.from("loket").select("id");
      if (!fetchErr && dbLokets) {
        const toDeleteIds = dbLokets
          .map((item: any) => item.id)
          .filter((id) => !currentIds.includes(id));
        
        if (toDeleteIds.length > 0) {
          console.log("Admin pruned deleted loket from Supabase:", toDeleteIds);
          await supabase.from("loket").delete().in("id", toDeleteIds);
        }
      }

      // Upsert current lokets
      for (const l of newList) {
        await supabase.from("loket").upsert({
          id: l.id,
          name: l.name,
          prefix: l.prefix,
          service_name: l.serviceName,
          is_active: l.isActive,
        });
      }
    } catch (err) {
      console.error("Failed to sync loket changes to Supabase:", err);
    }
  };

  // Handle Logouts
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("pln_queue_user");
    setIsFullscreenDisplay(false);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("pln_queue_user", JSON.stringify(user));
  };

  // Helper action: Add dynamic new queue ticket
  const handleAddNewQueue = (
    prefix: string, 
    serviceName: string,
    customerData?: {
      pelangganNama?: string;
      pelangganId?: string;
      pelangganAlamat?: string;
      pelangganHp?: string;
      pelangganKeterangan?: string;
    }
  ): QueueItem => {
    // Generate consecutive increment number per target prefix for TODAY (daily reset)
    const todayStr = new Date().toDateString();
    const todayPrefixQueues = queues.filter((q) => {
      if (!q.createdAt) return false;
      return q.prefix === prefix && new Date(q.createdAt).toDateString() === todayStr;
    });
    const nextNum = todayPrefixQueues.length + 1;
    const formattedNum = `${prefix}${nextNum}`;

    const newTicket: QueueItem = {
      id: "q_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      number: nextNum,
      formattedNumber: formattedNum,
      serviceName: serviceName,
      prefix: prefix,
      status: "waiting",
      createdAt: new Date().toISOString(),
      pelangganNama: customerData?.pelangganNama || "",
      pelangganId: customerData?.pelangganId || "",
      pelangganAlamat: customerData?.pelangganAlamat || "",
      pelangganHp: customerData?.pelangganHp || "",
      pelangganKeterangan: customerData?.pelangganKeterangan || "",
    };

    const updated = [...queues, newTicket];
    setQueues(updated);
    setLastCreatedQueue(newTicket);

    // Sync insertion to Supabase (also sends pelanggan attributes if columns are ready on DB side)
    supabase.from("queues").insert({
      id: newTicket.id,
      number: newTicket.number,
      formatted_number: newTicket.formattedNumber,
      service_name: newTicket.serviceName,
      prefix: newTicket.prefix,
      status: newTicket.status,
      created_at: newTicket.createdAt,
      pelanggan_nama: newTicket.pelangganNama,
      pelanggan_id: newTicket.pelangganId,
      pelanggan_alamat: newTicket.pelangganAlamat,
      pelanggan_hp: newTicket.pelangganHp,
      pelanggan_keterangan: newTicket.pelangganKeterangan,
    }).then(({ error }) => {
      if (error) {
        console.warn("Supabase insert queue fail (some columns might be missing):", error.message);
        // Fallback retry without customer columns if they haven't run the migration yet, to maintain DB synchrony
        if (error.message.includes("column") || error.message.includes("pelanggan")) {
          console.log("Retrying insertion with basic properties only...");
          supabase.from("queues").insert({
            id: newTicket.id,
            number: newTicket.number,
            formatted_number: newTicket.formattedNumber,
            service_name: newTicket.serviceName,
            prefix: newTicket.prefix,
            status: newTicket.status,
            created_at: newTicket.createdAt,
          });
        }
      }
    });

    return newTicket;
  };

  // Helper to spell Indonesian numbers dynamically and correctly (terbilang format) for local Officer device calling voice
  const getIndonesianTerbilang = (n: number): string => {
    if (n === 0) return "";
    const units = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
    if (n < 12) {
      return units[n];
    } else if (n < 20) {
      return units[n - 10] + " belas";
    } else if (n < 100) {
      const tens = Math.floor(n / 10);
      const remainder = n % 10;
      return units[tens] + " puluh " + getIndonesianTerbilang(remainder);
    } else if (n < 200) {
      return "seratus " + getIndonesianTerbilang(n - 100);
    } else if (n < 1000) {
      const hundreds = Math.floor(n / 100);
      const remainder = n % 100;
      return units[hundreds] + " ratus " + getIndonesianTerbilang(remainder);
    }
    return n.toString();
  };

  const convertNumberToIndonesianSpelling = (n: number): string => {
    if (n === 0) return "nol";
    return getIndonesianTerbilang(n).replace(/\s+/g, " ").trim();
  };

  const playCallAudioLocally = (
    prefix: string,
    number: number,
    loketName: string,
    voiceVolume: number = 80
  ) => {
    const voiceVolNormalized = voiceVolume / 100;
    const spokenNumber = convertNumberToIndonesianSpelling(number);
    // Use deep deliberative pauses before and after the ticket prefix and code for premium queue announcements
    const textToSpeak = `Nomor antrean, ... ... ... ${prefix.toUpperCase()} ${spokenNumber}. ... ... ... Silakan menuju ke ${loketName}`;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        const playChimeTone = (freq: number, start: number, duration: number) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.35 * voiceVolNormalized, start);
          gain.gain.exponentialRampToValueAtTime(0.01 * voiceVolNormalized, start + duration);
          osc.start(start);
          osc.stop(start + duration);
        };

        playChimeTone(523.25, audioCtx.currentTime, 0.25); // C5
        playChimeTone(659.25, audioCtx.currentTime + 0.12, 0.25); // E5
        playChimeTone(783.99, audioCtx.currentTime + 0.24, 0.4); // G5
      }

      setTimeout(() => {
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          utterance.lang = "id-ID";
          utterance.rate = 1.05;
          utterance.pitch = 1.05;
          utterance.volume = voiceVolNormalized;

          const voices = window.speechSynthesis.getVoices();
          const indonesianVoice = voices.find((v) => v.name.includes("Google") && v.lang.startsWith("id")) || 
                                  voices.find((v) => v.lang.startsWith("id"));
          if (indonesianVoice) {
            utterance.voice = indonesianVoice;
          }
          window.speechSynthesis.speak(utterance);
        }
      }, 650);
    } catch (e) {
      console.warn("Failed to play local calling audio:", e);
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = "id-ID";
        utterance.rate = 1.05;
        utterance.pitch = 1.05;
        utterance.volume = voiceVolNormalized;
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // Helper action: Call/announce queue item on a Counter
  const handleCallQueue = (queueId: string, loketId: string, loketName: string) => {
    const callingTime = new Date().toISOString();
    
    // Play audio call announcement locally on the officer's browser
    const targetQueue = queues.find((q) => q.id === queueId);
    if (targetQueue) {
      const vol = monitorSettings.voiceVolume !== undefined ? monitorSettings.voiceVolume : 80;
      playCallAudioLocally(targetQueue.prefix, targetQueue.number, loketName, vol);
    }

    const updated = queues.map((q) => {
      // If of status calling elsewhere, we can leave it
      if (q.id === queueId) {
        return {
          ...q,
          status: "calling" as const,
          loketId: loketId,
          loketName: loketName,
          calledAt: callingTime,
        };
      }
      // If it was calling on this exact counter earlier, mark completed so it doesn't conflict
      if (q.status === "calling" && q.loketId === loketId) {
        return { ...q, status: "completed" as const, completedAt: callingTime };
      }
      return q;
    });

    setQueues(updated);

    // Sync update to Supabase
    const previousCalling = queues.find((q) => q.status === "calling" && q.loketId === loketId);
    if (previousCalling) {
      supabase.from("queues").update({
        status: "completed",
        completed_at: callingTime,
      }).eq("id", previousCalling.id).then(({ error }) => {
        if (error) console.warn("Supabase complete past queue error", error.message);
      });
    }

    supabase.from("queues").update({
      status: "calling",
      loket_id: loketId,
      loket_name: loketName,
      called_at: callingTime,
    }).eq("id", queueId).then(({ error }) => {
      if (error) console.warn("Supabase call queue error", error.message);
    });
  };

  // Helper action: Mark queue as service completed
  const handleCompleteQueue = (queueId: string) => {
    const completionTime = new Date().toISOString();
    const updated = queues.map((q) => {
      if (q.id === queueId) {
        return {
          ...q,
          status: "completed" as const,
          completedAt: completionTime,
        };
      }
      return q;
    });
    setQueues(updated);

    supabase.from("queues").update({
      status: "completed",
      completed_at: completionTime,
    }).eq("id", queueId).then(({ error }) => {
      if (error) console.warn("Supabase complete queue update fail:", error.message);
    });
  };

  // Helper action: Skip/Skipped queue
  const handleSkipQueue = (queueId: string) => {
    const skippedTime = new Date().toISOString();
    const updated = queues.map((q) => {
      if (q.id === queueId) {
        return {
          ...q,
          status: "skipped" as const,
          completedAt: skippedTime,
        };
      }
      return q;
    });
    setQueues(updated);

    supabase.from("queues").update({
      status: "skipped",
      completed_at: skippedTime,
    }).eq("id", queueId).then(({ error }) => {
      if (error) console.warn("Supabase skip queue update fail:", error.message);
    });
  };

  // Helper action: Reset all queue logs back to clean daily status
  const handleResetQueues = () => {
    // Save current today's statistics to history before resetting
    const todayStr = new Date().toDateString();
    const todayQueues = queues.filter((q) => {
      if (!q.createdAt) return false;
      return new Date(q.createdAt).toDateString() === todayStr;
    });

    if (todayQueues.length > 0) {
      try {
        const countA = todayQueues.filter((q) => q.prefix === "A").length;
        const countB = todayQueues.filter((q) => q.prefix === "B").length;
        const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const now = new Date();
        const dateStringFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        
        const savedHistoryStr = localStorage.getItem("pln_queue_history_days") || "[]";
        const currentHistory = JSON.parse(savedHistoryStr);
        
        const newArchive = {
          textA: String(countA),
          textB: String(countB),
          date: dateStringFormatted,
        };
        localStorage.setItem("pln_queue_history_days", JSON.stringify([newArchive, ...currentHistory]));
      } catch (err) {
        console.error("Failed to archive queues:", err);
      }
    }

    setQueues([]);
    setLastCreatedQueue(null);
    localStorage.removeItem("pln_queue_items");
    localStorage.removeItem("pln_queue_last_created");

    supabase.from("queues").delete().neq("id", "placeholder").then(({ error }) => {
      if (error) console.warn("Supabase delete queues fail:", error.message);
    });
  };

  // Helper action: Delete a single queue customer record
  const handleDeleteQueue = (id: string) => {
    // Delete locally
    setQueues((prev) => prev.filter((q) => q.id !== id));
    
    // Check and update last created queue if applicable
    if (lastCreatedQueue?.id === id) {
      setLastCreatedQueue(null);
    }

    try {
      const saved = localStorage.getItem("pln_queue_items");
      if (saved) {
        const parsed: QueueItem[] = JSON.parse(saved);
        const filtered = parsed.filter((q) => q.id !== id);
        localStorage.setItem("pln_queue_items", JSON.stringify(filtered));
      }
    } catch (e) {
      console.error("Local storage delete sync issue:", e);
    }

    // Delete remotely on Supabase with precise id
    supabase
      .from("queues")
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.warn("Supabase queue delete item fail:", error.message);
      });
  };

  const isDirectDisplayURL = typeof window !== "undefined" && (
    window.location.search.includes("mode=display") || 
    window.location.search.includes("tv=") || 
    window.location.search.includes("lite=true") ||
    window.location.pathname.endsWith("/display")
  );

  if (isDirectDisplayURL) {
    return (
      <div className="w-screen h-screen bg-slate-950 overflow-hidden relative select-none animate-fade-in" id="direct-tv-canvas">
        <DisplayMonitor
          settings={monitorSettings}
          loketList={loketList}
          activeQueues={queues}
          isFullscreen={true}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased" id="main-applet-container">
      
      {/* If TV Fullscreen Mode is selected */}
      {isFullscreenDisplay ? (
        <div className="w-screen h-screen bg-slate-950 overflow-hidden relative select-none" id="fullscreen-tv-canvas">
          <DisplayMonitor
            settings={monitorSettings}
            loketList={loketList}
            activeQueues={queues}
            isFullscreen={true}
            onExitFullscreen={() => setIsFullscreenDisplay(false)}
          />
        </div>
      ) : !currentUser ? (
        // 1. Rendering Login screen when not authenticated
        <div className="h-screen w-screen overflow-hidden fixed inset-0 z-50 bg-[#0d1e2d]" id="unauthenticated-view">        
          <LoginScreen
            usersList={usersList}
            onLoginSuccess={handleLoginSuccess}
            onSelectDisplayMode={() => setIsFullscreenDisplay(true)}
          />
        </div>
      ) : (
        // 2. Authenticated Viewport (Always renders ONE Unified Top-Most Navbar for everyone)
        <div className="flex flex-col min-h-screen animate-fade-in" id="authenticated-view">
          
          {/* MODULAR NAVBAR COMPONENT - The single top-most dashboard header as requested */}
          <Navbar
            currentUser={currentUser}
            onLogout={handleLogout}
            isSidebarOpen={adminSidebarOpen}
            onToggleSidebar={() => setAdminSidebarOpen(!adminSidebarOpen)}
          />

          {currentUser.role === "admin" ? (
            // Admin Dashboard gets full screen flex layout underneath the unified Navbar
            <AdminDashboard
              loketList={loketList}
              queues={queues}
              printSettings={printSettings}
              monitorSettings={monitorSettings}
              usersList={usersList}
              onUpdateUsersList={handleUpdateUsersList}
              onUpdateLoket={handleUpdateLoketList}
              onUpdatePrintSettings={handleUpdatePrintSettings}
              onUpdateMonitorSettings={handleUpdateMonitorSettings}
              onResetQueues={handleResetQueues}
              onAddNewQueue={handleAddNewQueue}
              lastCreatedQueue={lastCreatedQueue}
              setIsFullscreenDisplay={setIsFullscreenDisplay}
              onLogout={handleLogout}
              isSidebarOpen={adminSidebarOpen}
              setIsSidebarOpen={setAdminSidebarOpen}
              onDeleteQueue={handleDeleteQueue}
            />
          ) : (
            // Officer Desktop remains standard boxed layout
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full" id="workspace-main">
              
              <div className="space-y-6" id="officer-viewport">
                
                <OfficerDashboard
                  loketList={loketList}
                  queues={queues}
                  currentUser={currentUser}
                  onCallQueue={handleCallQueue}
                  onCompleteQueue={handleCompleteQueue}
                  onSkipQueue={handleSkipQueue}
                  onAddQueue={handleAddNewQueue}
                  onLogout={handleLogout}
                  printSettings={printSettings}
                />
              </div>

            </main>
          )}

          {/* Footer branding illustrated for non-admin views */}
          {currentUser.role !== "admin" && (
            <footer className="bg-white border-t border-slate-100 mt-12 py-6 text-center text-slate-400 text-xs shrink-0" id="global-footer">
              <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <p>© 2026 PLN ULP Mantingan. Hak Cipta Dilindungi Undang-Undang.</p>
                <p className="text-[10px] text-slate-400">Sistem Informasi Manajemen Antrean Terpadu</p>
              </div>
            </footer>
          )}

        </div>
      )}

    </div>
  );
}
