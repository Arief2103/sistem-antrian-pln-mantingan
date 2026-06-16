import React, { useEffect, useState, useRef } from "react";
import { MonitorSettings, LoketItem, QueueItem } from "../types";
import { Shield, Zap, Sparkles, Cpu, Image, Tv, Video, Sun, Cloud, CloudRain, CloudLightning, CloudSun, CloudDrizzle, Thermometer } from "lucide-react";
import { getVideoBlob } from "../lib/VideoDB";

// Helper to spell Indonesian numbers dynamically and correctly (terbilang format)
function getIndonesianTerbilang(n: number): string {
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
}

function convertNumberToIndonesianSpelling(n: number): string {
  if (n === 0) return "nol";
  return getIndonesianTerbilang(n).replace(/\s+/g, " ").trim();
}

function formatClock(d: Date, template?: string): string {
  const pad = (num: number) => String(num).padStart(2, "0");
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());

  switch (template) {
    case "HH:mm:ss":
      return `${hh}:${mm}:${ss}`;
    case "HH.mm":
      return `${hh}.${mm}`;
    case "HH:mm":
      return `${hh}:${mm}`;
    case "HH.mm WIB":
      return `${hh}.${mm} WIB`;
    case "HH.mm.ss":
    default:
      return `${hh}.${mm}.${ss}`;
  }
}

const muteVideos = () => {
  // Mute and Pause all local HTML5 videos
  const localVideos = document.querySelectorAll("video");
  localVideos.forEach((video) => {
    try {
      video.muted = true;
      video.volume = 0;
      video.pause();
    } catch (e) {
      console.error(e);
    }
  });

  // Mute and Pause YouTube iframe using safe postMessage API
  const iframes = document.querySelectorAll("iframe");
  iframes.forEach((iframe) => {
    try {
      // Send multiple formats to cover different API versions of postMessage support
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "mute", args: [] }),
        "*"
      );
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "mute" }),
        "*"
      );
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
        "*"
      );
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "pauseVideo" }),
        "*"
      );
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "setVolume", args: [0] }),
        "*"
      );
    } catch (e) {
      console.warn("Failed to send mute/pause commands to YouTube iframe:", e);
    }
  });
};

const unmuteVideos = (videoVolumePercent: number = 50) => {
  const normVol = videoVolumePercent / 100;
  // Unmute and Play all local HTML5 videos
  const localVideos = document.querySelectorAll("video");
  localVideos.forEach((video) => {
    try {
      video.muted = false;
      video.volume = normVol;
      video.play().catch((err) => console.log("Video play was interrupted: ", err));
    } catch (e) {
      console.error(e);
    }
  });

  // Unmute and Play YouTube iframe using safe postMessage API
  const iframes = document.querySelectorAll("iframe");
  iframes.forEach((iframe) => {
    try {
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "unMute", args: [] }),
        "*"
      );
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "unMute" }),
        "*"
      );
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "playVideo", args: [] }),
        "*"
      );
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "playVideo" }),
        "*"
      );
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "setVolume", args: [videoVolumePercent] }),
        "*"
      );
    } catch (e) {
      console.warn("Failed to send unmute/play commands to YouTube iframe:", e);
    }
  });
};

interface DisplayMonitorProps {
  settings: MonitorSettings;
  loketList: LoketItem[];
  activeQueues: QueueItem[];
  isFullscreen?: boolean;
  onExitFullscreen?: () => void;
}

export default function DisplayMonitor({
  settings,
  loketList,
  activeQueues,
  isFullscreen = false,
  onExitFullscreen,
}: DisplayMonitorProps) {
  const [time, setTime] = useState(new Date());
  const [currentSlide, setCurrentSlide] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);
  const lastCalledId = useRef<string | null>(null);
  const spokenCalls = useRef<Set<string>>(new Set());

  const [weatherState, setWeatherState] = useState<{ text: string; temp: number; code: number } | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Coords for Mantingan, Ngawi, Jawa Timur: -7.3551, 111.1610
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=-7.3551&longitude=111.1610&current=temperature_2m,weather_code&timezone=Asia%2FJakarta"
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.current) {
            const temp = Math.round(data.current.temperature_2m);
            const code = data.current.weather_code;
            let text = "Berawan";
            if (code === 0) text = "Cerah";
            else if (code >= 1 && code <= 3) text = "Cerah Berawan";
            else if (code === 45 || code === 48) text = "Kabut";
            else if (code >= 51 && code <= 55) text = "Gerimis";
            else if (code >= 61 && code <= 65) text = "Hujan Ringan";
            else if (code >= 80 && code <= 82) text = "Hujan";
            else if (code >= 95 && code <= 99) text = "Hujan Petir";
            
            setWeatherState({ text, temp, code });
          }
        }
      } catch (e) {
        console.warn("Failed to fetch BMKG weather details:", e);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 600000); // refresh weather every 10 min
    return () => clearInterval(interval);
  }, []);

  const finalWeather = weatherState || { text: "Cerah Berawan", temp: 29, code: 2 };

  const getWeatherIcon = (code: number) => {
    if (code === 0) {
      return <Sun className="w-4 h-4 text-amber-300 shrink-0" />;
    } else if (code >= 1 && code <= 3) {
      return <CloudSun className="w-4 h-4 text-slate-300 shrink-0" />;
    } else if (code === 45 || code === 48) {
      return <Cloud className="w-4 h-4 text-slate-400 shrink-0" />;
    } else if (code >= 51 && code <= 55) {
      return <CloudDrizzle className="w-4 h-4 text-blue-300 shrink-0" />;
    } else if (code >= 61 && code <= 65) {
      return <CloudRain className="w-4 h-4 text-blue-400 shrink-0" />;
    } else if (code >= 80 && code <= 82) {
      return <CloudRain className="w-4 h-4 text-blue-500 shrink-0" />;
    } else if (code >= 95 && code <= 99) {
      return <CloudLightning className="w-4 h-4 text-yellow-400 shrink-0" />;
    }
    return <Cloud className="w-4 h-4 text-slate-300 shrink-0" />;
  };

  // Split ratio for Left (Video) and Right (Cards) columns
  const [layoutWidth, setLayoutWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("pln_tv_layout_width");
      return saved ? parseInt(saved, 10) : 67;
    } catch {
      return 67;
    }
  });

  // Scale format for videos / images to eliminate black bars
  const [videoFit, setVideoFit] = useState<"contain" | "cover" | "fill">(() => {
    try {
      const saved = localStorage.getItem("pln_tv_video_fit");
      return (saved as "contain" | "cover" | "fill") || "contain";
    } catch {
      return "contain";
    }
  });

  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const cycleLayoutWidth = () => {
    setLayoutWidth((prev) => {
      let next = 67;
      if (prev === 67) next = 72;
      else if (prev === 72) next = 78;
      else if (prev === 78) next = 84;
      else next = 67;

      try {
        localStorage.setItem("pln_tv_layout_width", next.toString());
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const cycleVideoFit = () => {
    setVideoFit((prev) => {
      let next: "contain" | "cover" | "fill" = "contain";
      if (prev === "contain") next = "cover";
      else if (prev === "cover") next = "fill";
      else next = "contain";

      try {
        localStorage.setItem("pln_tv_video_fit", next);
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Memory/CPU Saver Mode to prevent low-spec TV browsers from hanging due to video decoding
  const [isSaverMode, setIsSaverMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("pln_tv_saver_mode");
      return saved === "true" || window.location.search.includes("saver=true") || window.location.search.includes("lite=true");
    } catch {
      return false;
    }
  });

  const toggleSaverMode = () => {
    setIsSaverMode((prev) => {
      const newVal = !prev;
      try {
        localStorage.setItem("pln_tv_saver_mode", newVal ? "true" : "false");
      } catch (e) {
        console.error(e);
      }
      return newVal;
    });
  };

  // Load custom video blob from IndexedDB if selected
  useEffect(() => {
    let isMounted = true;
    let urlToRevoke: string | null = null;

    if (settings.videoSourceType === "local" && settings.localVideoName) {
      getVideoBlob()
        .then((data) => {
          if (data && isMounted) {
            const url = URL.createObjectURL(data.blob);
            urlToRevoke = url;
            setLocalVideoUrl(url);
          }
        })
        .catch((err) => {
          console.error("Gagal memuat file video lokal:", err);
        });
    } else {
      setLocalVideoUrl(null);
    }

    return () => {
      isMounted = false;
      if (urlToRevoke) {
        URL.revokeObjectURL(urlToRevoke);
      }
    };
  }, [settings.videoSourceType, settings.localVideoName]);

  // Synchronize dynamic volume changes to active HTML5 videos and YouTube iframes
  const syncIframeAudioConfig = (iframe: HTMLIFrameElement, targetVol?: number) => {
    const videoVol = targetVol !== undefined ? targetVol : (settings.videoVolume !== undefined ? settings.videoVolume : 50);
    try {
      if (videoVol > 0) {
        // Send unMute and setting volume together to ensure YouTube isn't kept in muted state
        iframe.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: "unMute", args: [] }),
          "*"
        );
        iframe.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: "setVolume", args: [videoVol] }),
          "*"
        );
      } else {
        iframe.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: "mute", args: [] }),
          "*"
        );
        iframe.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: "setVolume", args: [0] }),
          "*"
        );
      }
    } catch (e) {
      console.warn("Failed to set volume/mute config on YouTube iframe:", e);
    }
  };

  useEffect(() => {
    const videoVol = settings.videoVolume !== undefined ? settings.videoVolume : 50;
    const localTargetVolume = videoVol / 100;

    // Apply to local HTML5 videos
    const localVideos = document.querySelectorAll("video");
    localVideos.forEach((video) => {
      try {
        video.volume = localTargetVolume;
      } catch (e) {
        console.error("Failed to update video volume:", e);
      }
    });

    // Apply to YouTube iframe using safe postMessage API
    const iframes = document.querySelectorAll("iframe");
    iframes.forEach((iframe) => {
      syncIframeAudioConfig(iframe, videoVol);
    });
  }, [settings.videoVolume]);

  // Dynamic values with elegant fallbacks from settings panel
  const colorBackground = settings.colorBackground || "#0d9488";
  const colorCardA = settings.colorCardA || "#0ea5e9";
  const colorCardB = settings.colorCardB || "#84cc16";
  const colorHeaderLeft = settings.colorHeaderLeft || "#0284c7";
  const colorHeaderRight = settings.colorHeaderRight || "#16a34a";
  const colorText = settings.colorText || "#ffffff";
  const nameAntrianA = settings.nameAntrianA || "LAYANAN ADMINISTRASI";
  const nameAntrianB = settings.nameAntrianB || "LAYANAN TEKNIS / PERIZINAN";
  const textSizeRunning = settings.textSizeRunning || 18;
  const textHeaderLeft = settings.textHeaderLeft || "PT PLN (PERSERO)";
  const textHeaderSubtext = settings.textHeaderSubtext || "ULP MANTINGAN";
  const textBottomLabel = settings.textBottomLabel || "INFO";
  const colorBottomBg = settings.colorBottomBg || "#facc15";
  const colorBottomText = settings.colorBottomText || "#020617";

  // Informative slides
  const slides = [
    {
      title: "LAYANAN PLN BEBAS PUNGLI",
      description: "Semua proses transaksi keuangan di lingkungan PLN hanya menggunakan nomor registrasi resmi dan dibayar via online, ATM, atau merchant resmi. Petugas kami tidak menerima pembayaran tunai di tempat.",
      icon: <Shield className="w-8 h-8 text-amber-400" />,
    },
    {
      title: "KESELAMATAN KETENAGALISTRIKAN (K2)",
      description: "Gunakan peralatan listrik berstandar SNI. Hindari mendirikan bangunan atau menanam pohon dekat jaringan kabel listrik utama demi keselamatan bersama.",
      icon: <Zap className="w-8 h-8 text-sky-400" />,
    },
    {
      title: "KEMUDAHAN LAYANAN VIA PLN MOBILE",
      description: "Lakukan pasang baru, perubahan daya, catat meter mandiri, dan pengaduan gangguan teknis secara transparan langsung dari genggaman Anda melalui aplikasi PLN Mobile.",
      icon: <Sparkles className="w-8 h-8 text-emerald-400" />,
    },
  ];

  // Up to 10 custom sliding images for TV Image Mode / RAM Saver
  const activeSlideImages = settings.slideImages && settings.slideImages.filter(url => url.trim().length > 0).length > 0
    ? settings.slideImages.filter(url => url.trim().length > 0)
    : [
        "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=1200&auto=format&fit=crop", // Ketenagalistrikan / Energy
        "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1200&auto=format&fit=crop", // Customer service/office
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop"  // Business PLN
      ];

  // Rotate slides every 10 seconds (up to 3600 to serve as a clean common multiple for any array size up to 10)
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3600);
    }, 10000);
    return () => clearInterval(slideInterval);
  }, []);

  // Update clock every second
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Speech support check & voice preloading
  useEffect(() => {
    if ("speechSynthesis" in window) {
      setSpeechSupported(true);
      // Warm up TTS engine & preload voice buffer
      window.speechSynthesis.getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
  }, []);

  // Daily Reset visual isolation for the TV display monitor
  const todayStr = time.toDateString();
  const todayQueues = activeQueues.filter((q) => {
    if (!q.createdAt) return false;
    return new Date(q.createdAt).toDateString() === todayStr;
  });

  // Vocal announcements are removed from the display monitor so they only play locally on the calling officer's device.

  // Determine standard contrast safely
  const getLightOrDarkContrast = (hex: string) => {
    if (!hex) return "text-white";
    const cleanHex = hex.replace("#", "");
    if (cleanHex.length !== 6) return "text-white";
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.65 ? "text-slate-900" : "text-white";
  };

  // Filter active lokets
  const activeLokets = loketList.filter((l) => l.isActive);

  // Retrieve current active calling ticket for a given Loket
  const getCallingTicketForLoket = (loketId: string): QueueItem | null => {
    const list = todayQueues.filter((q) => q.status === "calling" && q.loketId === loketId);
    if (list.length === 0) return null;
    return list[list.length - 1];
  };

  // Retrieve current active calling ticket for a given prefix (Category A and B)
  const getCallingTicketForPrefix = (prefix: string): QueueItem | null => {
    const list = todayQueues.filter((q) => q.status === "calling" && q.prefix === prefix);
    if (list.length === 0) return null;
    return list[list.length - 1];
  };

  // Retrieve the latest ticket for a prefix that has been called (either calling, completed, or skipped)
  const getLastCalledTicketForPrefix = (prefix: string): QueueItem | null => {
    const list = todayQueues.filter((q) => q.status !== "waiting" && q.prefix === prefix);
    if (list.length === 0) return null;
    return [...list].sort((a, b) => {
      const timeA = a.calledAt ? new Date(a.calledAt).getTime() : new Date(a.createdAt).getTime();
      const timeB = b.calledAt ? new Date(b.calledAt).getTime() : new Date(b.createdAt).getTime();
      return timeA - timeB;
    })[list.length - 1];
  };

  const currentTicketA = getCallingTicketForPrefix("A");
  const currentTicketB = getCallingTicketForPrefix("B");

  const lastCalledA = getLastCalledTicketForPrefix("A");
  const lastCalledB = getLastCalledTicketForPrefix("B");

  const loketA = loketList.find((l) => l.prefix === "A" && l.isActive) || loketList.find((l) => l.prefix === "A");
  const loketB = loketList.find((l) => l.prefix === "B" && l.isActive) || loketList.find((l) => l.prefix === "B");

  const getStatusTextAndColorForPrefix = (prefix: "A" | "B") => {
    const lastCalled = prefix === "A" ? lastCalledA : lastCalledB;

    if (!lastCalled) {
      return {
        text: "MENUNGGU",
        color: settings.colorCardStatusWaiting || settings.colorCardStatus || "rgba(255,255,255,0.85)"
      };
    }

    const statusStr = lastCalled.status as string;

    if (statusStr === "calling" || statusStr === "memanggil") {
      return {
        text: "SEDANG DILAYANI",
        color: settings.colorCardStatusCalling || settings.colorCardStatus || "#facc15"
      };
    }

    if (statusStr === "completed" || statusStr === "selesai") {
      return {
        text: "SELESAI",
        color: settings.colorCardStatusCompleted || settings.colorCardStatus || "#34d399"
      };
    }

    // Default fallback
    return {
      text: "MENUNGGU",
      color: settings.colorCardStatusWaiting || settings.colorCardStatus || "rgba(255,255,255,0.85)"
    };
  };

  // Helper to parse multiple YouTube video IDs and construct playlist parameter
  const getEmbedUrlForPlaylist = () => {
    const urls = settings.videoUrls && settings.videoUrls.length > 0
      ? settings.videoUrls
      : [settings.videoUrl || "https://www.youtube.com/watch?v=dQw4w9WgXcQ"];

    const getYoutubeIds = (links: string[]): string[] => {
      return links
        .map((url) => {
          if (!url) return "";
          const trimmed = url.trim();
          if (trimmed.length === 11) return trimmed;
          try {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = trimmed.match(regExp);
            if (match && match[2].length === 11) {
              return match[2];
            }
          } catch (e) {
            console.error(e);
          }
          return "";
        })
        .filter((id) => id.length === 11);
    };

    const ids = getYoutubeIds(urls);
    if (ids.length > 0) {
      const firstId = ids[0];
      const playlistParam = ids.join(",");
      // Secure local origin parameter to authorize iframe API postMessage controlling
      const originParam = encodeURIComponent(window.location.origin);
      // Set mute=0 so videos play with sound by default (and will be auto-muted during voice queue paging!)
      return `https://www.youtube.com/embed/${firstId}?autoplay=1&mute=0&loop=1&playlist=${playlistParam}&enablejsapi=1&origin=${originParam}`;
    }
    
    return "";
  };

  const isVideoOnly = settings.layoutMode === "video-only";

  if (isVideoOnly) {
    const embedUrl = getEmbedUrlForPlaylist();
    return (
      <div 
        className={`overflow-hidden w-full bg-slate-950 relative select-none ${
          isFullscreen ? "h-screen w-full rounded-none border-0 shadow-none" : "rounded-3xl border-4 border-slate-900 shadow-2xl"
        }`}
        style={{ 
          height: isFullscreen ? "100vh" : undefined,
          minHeight: isFullscreen ? "100vh" : "720px",
        }}
        id="display-monitor-canvas-full-video"
      >
        {settings.videoSourceType === "local" && localVideoUrl ? (
          <video
            key={localVideoUrl}
            src={localVideoUrl}
            autoPlay
            loop
            playsInline
            onPlay={(e) => {
              const vol = settings.videoVolume !== undefined ? settings.videoVolume : 50;
              e.currentTarget.volume = vol / 100;
            }}
            className="absolute inset-0 w-full h-full bg-slate-950"
            style={{ objectFit: videoFit }}
          />
        ) : embedUrl ? (
          <iframe
            className="absolute inset-0 w-full h-full pointer-events-none"
            src={embedUrl}
            title="PLN Corporate Media"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={(e) => {
              const el = e.currentTarget;
              syncIframeAudioConfig(el);
              // Retry shortly after loading to ensure YouTube API is fully listening
              setTimeout(() => syncIframeAudioConfig(el), 500);
              setTimeout(() => syncIframeAudioConfig(el), 1500);
              setTimeout(() => syncIframeAudioConfig(el), 3000);
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-semibold text-lg bg-slate-950">
            Belum ada video atau playlist yang dikonfigurasi
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden flex flex-col justify-between transition-all duration-300 relative font-sans select-none ${
        isFullscreen ? "h-screen w-full rounded-none border-0 shadow-none" : "rounded-3xl border-4 border-slate-900 shadow-2xl"
      }`}
      style={{
        backgroundColor: colorBackground, // Dynamic monitor background setting
        height: isFullscreen ? "100vh" : undefined,
        minHeight: isFullscreen ? "100vh" : "720px",
        color: colorText,
      }}
      id="display-monitor-canvas"
    >
      {/* 1. Header/Navbar (PT PLN (Persero) ULP Mantingan with Logo) */}
      <div 
        className={`flex items-center justify-between border-b relative z-10 group ${
          isFullscreen ? "px-8 py-4" : "px-6 py-3"
        }`}
        style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: colorHeaderLeft }}
        id="tv-header"
      >
        <div className="flex items-center gap-3">
          {/* PLN Logo image */}
          <img 
            src={settings.logoUrl || "/logo-pln1.png"} 
            alt="Logo" 
            className="object-contain shrink-0"
            style={
              settings.logoSize 
                ? { width: `${settings.logoSize}px`, height: `${settings.logoSize}px` } 
                : { width: isFullscreen ? "48px" : "40px", height: isFullscreen ? "48px" : "40px" }
            }
            referrerPolicy="no-referrer"
          />

          <div>
            <h1 
              className={`font-black tracking-tight text-white uppercase leading-none ${
                isFullscreen ? "text-base md:text-lg xl:text-xl" : "font-extrabold text-sm md:text-base"
              }`}
              style={settings.textSizeHeaderLeft ? { fontSize: `${settings.textSizeHeaderLeft}px` } : undefined}
            >
              {textHeaderLeft}
            </h1>
            <p 
              className={`font-bold uppercase text-cyan-400 mt-1 ${
                isFullscreen ? "text-xs tracking-widest" : "text-[10px] tracking-wider"
              }`}
              style={settings.textSizeHeaderSubtext ? { fontSize: `${settings.textSizeHeaderSubtext}px` } : undefined}
            >
              {textHeaderSubtext}
            </p>
          </div>
        </div>

        {/* TV Display Configuration controls (Scaling, Width, RAM optimizer) */}
        <div className="flex flex-wrap items-center gap-2 opacity-0 group-hover:opacity-100 hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300" id="tv-header-controls">
          {/* 1. Video/Image Scale Control */}
          <button
            onClick={cycleVideoFit}
            className="cursor-pointer flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-extrabold uppercase rounded-lg bg-white/5 hover:bg-white/10 text-cyan-200 hover:text-cyan-100 border border-white/10 shrink-0 outline-none select-none transition-all"
            title="Mengatur skala video atau gambar agar penuh tanpa sisa warna hitam"
          >
            <span>SKALA: </span>
            <span className="text-white font-black bg-white/10 px-1.5 py-0.5 rounded">
              {videoFit === "contain" ? "PROPORSIONAL" : videoFit === "cover" ? "POTONG PENUH" : "PAS PENUH"}
            </span>
          </button>

          {/* 2. Video Column Width Split */}
          <button
            onClick={cycleLayoutWidth}
            className="cursor-pointer flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-extrabold uppercase rounded-lg bg-white/5 hover:bg-white/10 text-sky-200 hover:text-sky-100 border border-white/10 shrink-0 outline-none select-none transition-all"
            title="Mengatur lebar kolom video / memperkecil kolom kartu antrean"
          >
            <span>LEBAR MEDIA: </span>
            <span className="text-white font-black bg-white/10 px-1.5 py-0.5 rounded">
              {layoutWidth}%
            </span>
          </button>

          {/* 3. Mode TV: Video vs Gambar Slide */}
          <button
            onClick={toggleSaverMode}
            className={`cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all border shrink-0 outline-none select-none ${
              isSaverMode
                ? "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30 font-bold"
                : "bg-white/5 hover:bg-white/10 text-white/95 border-white/10"
            }`}
            title={isSaverMode ? "Ubah ke Mode Putar Video Utama" : "Ubah ke Mode Slide Gambar (Ringan RAM / TV Hemat Hang)"}
          >
            {isSaverMode ? (
              <Image className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <Tv className="w-3.5 h-3.5 text-sky-305 text-sky-300 shrink-0" />
            )}
            <span>MODE TV: {isSaverMode ? "TAMPIL GAMBAR 🖼️" : "PUTAR VIDEO 📺"}</span>
          </button>
        </div>
      </div>

      {/* 2. Main Layout Content (Left is custom-width video/slide container, Right is clock and cards) */}
      <div className="flex flex-col lg:flex-row gap-5 p-5 flex-1 w-full items-stretch" id="tv-layout-flex">
        
        {/* Left Column: Custom-width configuration video container */}
        <div 
          className="flex flex-col justify-between transition-all duration-300 w-full shrink-0" 
          id="tv-video-dominant-column"
          style={isDesktop ? { width: `${layoutWidth}%`, flex: `0 0 ${layoutWidth}%` } : undefined}
        >
          <div className={`w-full h-full relative rounded-2xl overflow-hidden shadow-lg border border-white/5 bg-slate-100/5 flex flex-col justify-between ${
            isFullscreen ? "min-h-[300px]" : "min-h-[440px]"
          }`}>
                 {(() => {
              const isNoVideo = 
                (settings.videoSourceType === "local" && !localVideoUrl) ||
                (settings.videoSourceType !== "local" && !settings.videoUrl && (!settings.videoUrls || settings.videoUrls.length === 0));

              const showImageSlideshow = isSaverMode || isNoVideo;

              if (showImageSlideshow) {
                return (
                  // Mode Tampilan Gambar / Slide Media 16:9 (Zero CPU Video Decoding / Zero Memory Leak)
                  <div className="absolute inset-0 w-full h-full bg-[#020b12] rounded-xl overflow-hidden flex flex-col justify-between" id="tv-image-slideshow-container">
                    {/* Image display with active transition */}
                    <img
                      key={currentSlide % activeSlideImages.length}
                      src={activeSlideImages[currentSlide % activeSlideImages.length]}
                      alt="Slide Monitor"
                      className="absolute inset-0 w-full h-full select-none animate-fade-in"
                      referrerPolicy="no-referrer"
                      style={{ objectFit: videoFit }}
                    />

                    {/* Slight premium bottom gradient overlay for readability of footer info */}
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#020b12] via-black/30 to-transparent pointer-events-none z-10" />

                    {/* Title badge or corner tag */}
                    {/* <div className="absolute top-5 left-5 z-20 flex flex-col gap-2">
                      <div className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase px-3 py-1.5 bg-black/70 backdrop-blur-md border border-white/10 rounded-full shadow-lg text-emerald-400">
                        <Image className="w-3.5 h-3.5 text-emerald-400 animate-pulse animate-duration-1000" />
                        <span>Mode Gambar {isSaverMode ? "(Hemat Energi/RAM)" : "(Otomatis: Video Off)"}</span>
                      </div>
                    </div> */}

                    {/* Subinfo block or text overlay at the bottom */}
                    <div className="absolute bottom-5 inset-x-5 z-20 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4">
                      {/* <div className="bg-black/70 backdrop-blur-md px-3.5 py-1.5 border border-white/10 rounded-xl flex items-center gap-1.5">
                        <span className="text-[10px] text-white/95 font-black uppercase tracking-wider">
                          Slide { (currentSlide % activeSlideImages.length) + 1 } dari { activeSlideImages.length } • Auto-Slide
                        </span>
                      </div> */}

                      {/* Indicator dots for navigation */}
                      <div className="flex gap-2 bg-black/75 backdrop-blur-md px-3 py-2 rounded-full border border-white/10 shadow-lg">
                        {activeSlideImages.map((_, i) => (
                          <button
                            key={i}
                            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                              i === (currentSlide % activeSlideImages.length) ? "w-6 bg-emerald-400" : "w-2 bg-white/25 hover:bg-white/40"
                            }`}
                            onClick={() => setCurrentSlide(i)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              if (settings.videoSourceType === "local" && localVideoUrl) {
                return (
                  <video
                    key={localVideoUrl}
                    src={localVideoUrl}
                    autoPlay
                    loop
                    playsInline
                    onPlay={(e) => {
                      const vol = settings.videoVolume !== undefined ? settings.videoVolume : 50;
                      e.currentTarget.volume = vol / 100;
                    }}
                    className="absolute inset-0 w-full h-full bg-slate-950 rounded-xl"
                    style={{ objectFit: videoFit }}
                  />
                );
              }

              if (settings.videoSourceType !== "local" && (settings.videoUrls?.length || settings.videoUrl)) {
                const embedUrl = getEmbedUrlForPlaylist();
                if (embedUrl) {
                  return (
                    <iframe
                      className="absolute inset-0 w-full h-full pointer-events-none rounded-xl"
                      src={embedUrl}
                      title="PLN Corporate Media"
                      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      onLoad={(e) => {
                        const el = e.currentTarget;
                        syncIframeAudioConfig(el);
                        // Retry shortly after loading to ensure YouTube API is fully listening
                        setTimeout(() => syncIframeAudioConfig(el), 500);
                        setTimeout(() => syncIframeAudioConfig(el), 1500);
                        setTimeout(() => syncIframeAudioConfig(el), 3000);
                      }}
                    />
                  );
                }
              }

              return null;
            })()}
          </div>
        </div>

        {/* Right Column: Clock Widget (top) + 2 Stacked Calling Cards (middle & bottom) */}
        <div 
          className="flex flex-col gap-4 justify-between transition-all duration-300 w-full" 
          id="tv-right-column"
          style={isDesktop ? { width: `${100 - layoutWidth}%`, flex: `1 1 ${100 - layoutWidth}%` } : undefined}
        >
          
          {/* A. Clock widget at the top */}
          <div className={`bg-[#001726]/85 border border-white/10 rounded-2xl flex flex-col justify-center items-center text-center shadow-lg relative shrink-0 ${
            isFullscreen ? "p-5" : "p-4"
          }`}>
            {/* Big Hour-Minute-Second display using customizable template or defaults */}
            <div 
              className={`font-mono font-extrabold text-[#00D2FF] tracking-wider leading-none ${
                isFullscreen ? "text-5xl xl:text-6xl" : "text-4xl"
              }`}
              style={{
                ...(settings.textSizeClock ? { fontSize: `${settings.textSizeClock}px` } : {}),
                ...(settings.colorClock ? { color: settings.colorClock } : {})
              }}
            >
              {formatClock(time, settings.clockFormatTemplate)}
            </div>

            <div 
              className={`font-black text-amber-300 uppercase tracking-widest mt-2 mb-0.5 ${
                isFullscreen ? "text-xs xl:text-sm" : "text-[9px]"
              }`}
              style={{
                ...(settings.textSizeClockTitle ? { fontSize: `${settings.textSizeClockTitle}px` } : {}),
                ...(settings.colorClockTitle ? { color: settings.colorClockTitle } : {})
              }}
            >
              {settings.textClockTitle || "JAM BUKA LAYANAN KAMI"}
            </div>

            {/* Formatted Date & Day and Weather widget in clean BMKG style - unified background with watch */}
            <div className="mt-2.5 flex flex-col items-center gap-1">
              {/* Weather & Temp line (cuaca | Suhu) */}
              <div 
                className={`font-bold flex flex-wrap items-center justify-center gap-2 select-none ${
                  isFullscreen ? "text-[13px] xl:text-[14px]" : "text-[11px]"
                }`}
                style={{
                  ...(settings.textSizeWeather ? { fontSize: `${settings.textSizeWeather}px` } : {}),
                }}
              >
                <div className="flex items-center gap-1.5">
                  {getWeatherIcon(finalWeather.code)}
                  <span 
                    className="tracking-wide"
                    style={{ color: settings.colorWeatherText || "#f1f5f9" }}
                  >
                    {finalWeather.text ? finalWeather.text.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : ""}
                  </span>
                </div>
                
                <span className="text-white/20 font-light select-none">|</span>
                
                <div className="flex items-center gap-0.5">
                  <Thermometer className="w-4 h-4 shrink-0 transition-all" style={{ color: settings.colorWeatherTemp || "#fbbf24" }} />
                  <span 
                    className="font-black"
                    style={{ color: settings.colorWeatherTemp || "#fbbf24" }}
                  >
                    {finalWeather.temp}°C
                  </span>
                </div>
                
                <span className="text-white/20 font-light select-none">|</span>
                
                <span 
                  className="font-bold tracking-wide"
                  style={{ 
                    color: settings.colorWeatherRegion || "#cbd5e1",
                    ...(settings.textSizeRegion ? { fontSize: `${settings.textSizeRegion}px` } : {}) 
                  }}
                >
                  {settings.weatherRegion || "Ngawi"}
                </span>
              </div>

              {/* Day & Date line */}
              <div 
                className={`font-medium text-slate-300 ${
                  isFullscreen ? "text-sm xl:text-base" : "text-xs"
                }`}
                style={{
                  ...(settings.textSizeDayDate ? { fontSize: `${settings.textSizeDayDate}px` } : {}),
                  ...(settings.colorDayDate ? { color: settings.colorDayDate } : {})
                }}
              >
                {time.toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>

          {" "}
          {/* B. Stack of the 2 Calling Cards */}
          <div className="flex-1 flex flex-col gap-4 justify-stretch animate-none">
            
            {/* Card 1: Category A - Layanan Administrasi (BLUE) */}
            <div
              className="rounded-[2.5rem] border-4 p-5 flex flex-col justify-between shadow-2xl transition-all duration-300 relative overflow-hidden flex-1 border-white/10 text-center"
              style={{ minHeight: isFullscreen ? "210px" : "180px", backgroundColor: colorCardA }}
              id="calling-card-prefix-a"
            >
              <div className="flex flex-col items-center justify-center flex-1 w-full">
                {/* Top title - Loket Name taken from name, not serviceName */}
                <h3 
                  className="font-black uppercase tracking-wider text-white leading-tight"
                  style={{
                    fontSize: settings.textSizeCardHeader 
                      ? `${settings.textSizeCardHeader}px` 
                      : (isFullscreen ? "24px" : "18px"),
                    color: settings.colorCardHeader || "#ffffff"
                  }}
                >
                  {lastCalledA ? lastCalledA.loketName || loketA?.name || (loketA as any)?.nama || "LOKET 1" : (loketA?.name || (loketA as any)?.nama || "LOKET 1")}
                </h3>

                {/* Subtitle: NOMOR ANTRIAN */}
                <p 
                  className="uppercase font-sans tracking-widest font-extrabold mt-2.5"
                  style={{
                    fontSize: settings.textSizeCardSubtitle 
                      ? `${settings.textSizeCardSubtitle}px` 
                      : (isFullscreen ? "13px" : "10px"),
                    color: settings.colorCardSubtitle || "rgba(255,255,255,0.75)"
                  }}
                >
                  NOMOR ANTRIAN
                </p>

                {/* Big central queue number */}
                <span 
                  className="font-black font-mono text-center block tracking-tight leading-none mt-3.5 select-none"
                  style={{ 
                    textShadow: "0 4px 8px rgba(0,0,0,0.15)",
                    fontSize: settings.textSizeCardNumber 
                      ? `${settings.textSizeCardNumber}px` 
                      : (isFullscreen ? "110px" : "75px"),
                    color: settings.colorCardNumber || "#ffffff"
                  }}
                >
                  {lastCalledA ? lastCalledA.formattedNumber : "A--"}
                </span>
              </div>

              {/* Line separator */}
              <div className="w-full border-t border-white/20 mt-4 mb-3" />

              {/* Card Footer with auto status */}
              <div 
                className="font-black uppercase tracking-wider text-center"
                style={{
                  fontSize: settings.textSizeCardStatus 
                    ? `${settings.textSizeCardStatus}px` 
                    : (isFullscreen ? "18px" : "14px"),
                  color: getStatusTextAndColorForPrefix("A").color
                }}
              >
                {getStatusTextAndColorForPrefix("A").text}
              </div>
            </div>

            {/* Card 2: Category B - Layanan Teknis / Perizinan (GREEN) */}
            <div
              className="rounded-[2.5rem] border-4 p-5 flex flex-col justify-between shadow-2xl transition-all duration-300 relative overflow-hidden flex-1 border-white/10 text-center"
              style={{ minHeight: isFullscreen ? "210px" : "180px", backgroundColor: colorCardB }}
              id="calling-card-prefix-b"
            >
              <div className="flex flex-col items-center justify-center flex-1 w-full">
                {/* Top title - Loket Name taken from name, not serviceName */}
                <h3 
                  className="font-black uppercase tracking-wider text-white leading-tight"
                  style={{
                    fontSize: settings.textSizeCardHeader 
                      ? `${settings.textSizeCardHeader}px` 
                      : (isFullscreen ? "24px" : "18px"),
                    color: settings.colorCardHeader || "#ffffff"
                  }}
                >
                  {lastCalledB ? lastCalledB.loketName || loketB?.name || (loketB as any)?.nama || "LOKET P2TL" : (loketB?.name || (loketB as any)?.nama || "LOKET P2TL")}
                </h3>

                {/* Subtitle: NOMOR ANTRIAN */}
                <p 
                  className="uppercase font-sans tracking-widest font-extrabold mt-2.5"
                  style={{
                    fontSize: settings.textSizeCardSubtitle 
                      ? `${settings.textSizeCardSubtitle}px` 
                      : (isFullscreen ? "13px" : "10px"),
                    color: settings.colorCardSubtitle || "rgba(255,255,255,0.75)"
                    }}
                >
                  NOMOR ANTRIAN
                </p>

                {/* Big central queue number */}
                <span 
                  className="font-black font-mono text-center block tracking-tight leading-none mt-3.5 select-none"
                  style={{ 
                    textShadow: "0 4px 8px rgba(0,0,0,0.15)",
                    fontSize: settings.textSizeCardNumber 
                      ? `${settings.textSizeCardNumber}px` 
                      : (isFullscreen ? "110px" : "75px"),
                    color: settings.colorCardNumber || "#ffffff"
                  }}
                >
                  {lastCalledB ? lastCalledB.formattedNumber : "B--"}
                </span>
              </div>

              {/* Line separator */}
              <div className="w-full border-t border-white/20 mt-4 mb-3" />

              {/* Card Footer with auto status */}
              <div 
                className="font-black uppercase tracking-wider text-center"
                style={{
                  fontSize: settings.textSizeCardStatus 
                    ? `${settings.textSizeCardStatus}px` 
                    : (isFullscreen ? "18px" : "14px"),
                  color: getStatusTextAndColorForPrefix("B").color
                }}
              >
                {getStatusTextAndColorForPrefix("B").text}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* 3. Bottom Running Text (Marquee footer track - slightly more compact) */}
      <div
        className="py-2.5 px-5 font-bold tracking-normal relative overflow-hidden shrink-0 border-t border-slate-900 flex items-center shadow-lg"
        style={{ 
          fontSize: settings.textSizeRunning ? `${settings.textSizeRunning}px` : `max(14px, ${textSizeRunning - 4}px)`,
          backgroundColor: colorBottomBg,
          color: colorBottomText,
        }} 
        id="marquee-footer-track"
      >
        <div 
          className="absolute left-0 top-0 bottom-0 text-white font-black px-4 flex items-center justify-center shrink-0 uppercase tracking-widest z-10 border-r"
          style={{ 
            backgroundColor: colorHeaderLeft, // use Header color as tag accent identifier, matching corporate identity 
            borderColor: "rgba(255,255,255,0.15)",
            fontSize: settings.textSizeBottomLabel ? `${settings.textSizeBottomLabel}px` : "10px"
          }}
        >
          {textBottomLabel}
        </div>

        <div className="whitespace-nowrap overflow-hidden inline-block w-full pl-32 pr-28 relative">
          <div 
            className="inline-block animate-[marquee_35s_linear_infinite] pl-[5%] uppercase tracking-wide font-extrabold"
            style={{ color: colorBottomText }}
          >
            {settings.runningText || "SELAMAT DATANG DI PLN ULP MANTINGAN - PELAYANAN BEBAS PUNGLI JANGAN BERI TIP KEPADA PETUGAS KAMI - LAPORKAN DI NOMOR GANGGUAN 123 ATAS HALAMAN LAINNYA."}
          </div>
        </div>

        {onExitFullscreen && (
          <button
            onClick={onExitFullscreen}
            className="absolute right-0 top-0 bottom-0 px-4 z-40 flex items-center justify-center text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-black/10 border-l transition-all select-none opacity-30 hover:opacity-100"
            style={{ 
              backgroundColor: colorBottomBg,
              color: colorBottomText,
              borderColor: "rgba(0,0,0,0.12)"
            }}
            title="Keluar Layar Penuh"
            id="tv-exit-fullscreen-footer-btn"
          >
            ✖ Keluar
          </button>
        )}
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-100%, 0, 0); }
        }
      `}</style>
    </div>
  );
}
