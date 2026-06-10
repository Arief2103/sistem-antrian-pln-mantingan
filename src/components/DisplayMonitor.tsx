import React, { useEffect, useState, useRef } from "react";
import { MonitorSettings, LoketItem, QueueItem } from "../types";
import { Shield, Zap, Sparkles } from "lucide-react";
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
}

export default function DisplayMonitor({
  settings,
  loketList,
  activeQueues,
  isFullscreen = false,
}: DisplayMonitorProps) {
  const [time, setTime] = useState(new Date());
  const [currentSlide, setCurrentSlide] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);
  const lastCalledId = useRef<string | null>(null);
  const spokenCalls = useRef<Set<string>>(new Set());

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

  // Rotate slides every 10 seconds
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
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

  // Autoplay voice announcements
  useEffect(() => {
    const callingQueues = todayQueues.filter((q) => q.status === "calling");

    if (callingQueues.length > 0) {
      // Find calling queues that haven't been spoken yet (unique based on id and calledAt timestamp)
      const unspokenQueues = callingQueues.filter((q) => {
        if (!q.calledAt) return false;
        const key = `${q.id}-${q.calledAt}`;
        
        // If already spoken in this session, skip
        if (spokenCalls.current.has(key)) return false;

        // If the calling event is stale (older than 20 seconds), we treat it as already spoken
        // This avoids blaring old queues immediately when opening/refreshing the TV display tab
        const calledTime = new Date(q.calledAt).getTime();
        const ageInSeconds = (Date.now() - calledTime) / 1000;
        if (ageInSeconds > 20) {
          spokenCalls.current.add(key); // Register so we don't recalculate
          return false;
        }

        return true;
      });

      if (unspokenQueues.length > 0) {
        // Sort unspoken calling queues by calledAt ascending to get the absolute newest call
        const newestUnspoken = [...unspokenQueues].sort((a, b) => {
          const timeA = a.calledAt ? new Date(a.calledAt).getTime() : 0;
          const timeB = b.calledAt ? new Date(b.calledAt).getTime() : 0;
          return timeA - timeB;
        })[unspokenQueues.length - 1];

        if (newestUnspoken && newestUnspoken.calledAt) {
          const key = `${newestUnspoken.id}-${newestUnspoken.calledAt}`;
          spokenCalls.current.add(key);
          lastCalledId.current = newestUnspoken.id;
          if ("speechSynthesis" in window) {
            triggerVoiceAnnouncement(newestUnspoken);
          }
        }
      }
    }
  }, [todayQueues]);

  const triggerVoiceAnnouncement = (queue: QueueItem) => {
    // Generate standard Indonesian word-by-word spelled number instead of splitting individual digit chars
    const spokenNumber = convertNumberToIndonesianSpelling(queue.number);
    const counterName = queue.loketName || "Loket Petugas";
    // Indonesian formal call text pattern (separated by dots for natural system pauses)
    const textToSpeak = `Nomor antrean ${queue.prefix} ... ${spokenNumber} ... silakan menuju ke ${counterName}`;
    
    // Resolve custom active volumes
    const videoVol = settings.videoVolume !== undefined ? settings.videoVolume : 50;
    const voiceVol = settings.voiceVolume !== undefined ? settings.voiceVolume : 80;
    const voiceVolNormalized = voiceVol / 100;

    // Mute all videos before starting announcements/chimes
    muteVideos();

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playChimeTone = (freq: number, start: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.35 * voiceVolNormalized, start); // Respect custom voice volume scale for chime
        gain.gain.exponentialRampToValueAtTime(0.01 * voiceVolNormalized, start + duration);
        osc.start(start);
        osc.stop(start + duration);
      };

      playChimeTone(523.25, audioCtx.currentTime, 0.25); // C5
      playChimeTone(659.25, audioCtx.currentTime + 0.12, 0.25); // E5
      playChimeTone(783.99, audioCtx.currentTime + 0.24, 0.4); // G5

      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = "id-ID";
        utterance.rate = 0.76; // Slightly slower for more natural and articulate Indonesian calling pronunciation
        utterance.pitch = 1.05; // Slightly elevated pitch to cut through potential background noise
        utterance.volume = voiceVolNormalized; // Applied custom voice volume scale
        
        const voices = window.speechSynthesis.getVoices();
        // Priority 1: Google Indonesian Voice (frequently clearer & louder in browser runtime)
        // Priority 2: Standard local ID voice
        const indonesianVoice = voices.find((v) => v.name.includes("Google") && v.lang.startsWith("id"))
          || voices.find((v) => v.lang.startsWith("id"));

        if (indonesianVoice) {
          utterance.voice = indonesianVoice;
        }

        utterance.onend = () => {
          unmuteVideos(videoVol);
        };
        utterance.onerror = () => {
          unmuteVideos(videoVol);
        };

        window.speechSynthesis.speak(utterance);
      }, 650);
    } catch (e) {
      // Speech failover
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = "id-ID";
      utterance.rate = 0.76;
      utterance.pitch = 1.05;
      utterance.volume = voiceVolNormalized; // Applied custom voice volume scale
      
      const voices = window.speechSynthesis.getVoices();
      const indonesianVoice = voices.find((v) => v.name.includes("Google") && v.lang.startsWith("id"))
        || voices.find((v) => v.lang.startsWith("id"));

      if (indonesianVoice) {
        utterance.voice = indonesianVoice;
      }

      utterance.onend = () => {
        unmuteVideos(videoVol);
      };
      utterance.onerror = () => {
        unmuteVideos(videoVol);
      };
      window.speechSynthesis.speak(utterance);
    }

    // Safety fallback to unmute after 8 seconds in case browser speechSynthesis API gets frozen or interrupted
    setTimeout(() => {
      unmuteVideos(videoVol);
    }, 8000);
  };

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
            className="absolute inset-0 w-full h-full object-contain bg-slate-950"
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
        className={`flex items-center justify-between border-b relative z-10 ${
          isFullscreen ? "px-8 py-4 px" : "px-6 py-3"
        }`}
        style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: colorHeaderLeft }}
        id="tv-header"
      >
        <div className="flex items-center gap-3">
          {/* PLN Logo image */}
          <img 
            src="/logo-pln1.png" 
            alt="PLN Logo" 
            className={`${
              isFullscreen ? "h-12 w-12" : "h-10 w-10"
            } object-contain shrink-0`}
            referrerPolicy="no-referrer"
          />

          <div>
            <h1 className={`font-black tracking-tight text-white uppercase leading-none ${
              isFullscreen ? "text-base md:text-lg xl:text-xl" : "font-extrabold text-sm md:text-base"
            }`}>
              {textHeaderLeft}
            </h1>
            <p className={`font-bold uppercase text-cyan-400 mt-1 ${
              isFullscreen ? "text-xs tracking-widest" : "text-[10px] tracking-wider"
            }`}>
              {textHeaderSubtext}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Main Layout Content (Left is dominant video, Right is clock and 2 stacked cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 flex-1 w-full items-stretch" id="tv-layout-grid">
        
        {/* Left Column: Very dominant video container (occupied 8/12 - 2/3 of space) */}
        <div className="lg:col-span-8 flex flex-col justify-between" id="tv-video-dominant-column">
          <div className={`w-full h-full relative rounded-2xl overflow-hidden shadow-lg border border-white/5 bg-slate-100/5 flex flex-col justify-between ${
            isFullscreen ? "min-h-[300px]" : "min-h-[440px]"
          }`}>
            
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
                className="absolute inset-0 w-full h-full object-contain bg-slate-950 rounded-xl"
              />
            ) : settings.videoSourceType !== "local" && (settings.videoUrls?.length || settings.videoUrl) ? (
              (() => {
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
                return null;
              })()
            ) : (
              <div className="p-8 flex-1 flex flex-col justify-between z-10 bg-slate-950 rounded-xl">
                <div>
                  <div className="inline-flex items-center gap-2 text-white/50 text-[10px] font-bold tracking-widest uppercase mb-4">
                    Profil Edukasi Pelanggan
                  </div>
                  
                  <div className="flex items-start gap-4 mt-2">
                    <div className="p-4 bg-white/10 rounded-2xl shrink-0">
                      {slides[currentSlide].icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight text-white leading-snug">
                        {slides[currentSlide].title}
                      </h3>
                      <p className="text-sm text-white/80 mt-2 leading-relaxed">
                        {slides[currentSlide].description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Slides indicators dots */}
                <div className="flex gap-2 mt-4 self-end">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      className={`h-2 rounded-full transition-all duration-300 ${i === currentSlide ? "w-6 bg-white" : "w-2 bg-white/20"}`}
                      onClick={() => setCurrentSlide(i)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Clock Widget (top) + 2 Stacked Calling Cards (middle & bottom) */}
        <div className="lg:col-span-4 flex flex-col gap-4 justify-between" id="tv-right-column">
          
          {/* A. Clock widget at the top */}
          <div className={`bg-[#001726]/85 border border-white/10 rounded-2xl flex flex-col justify-center items-center text-center shadow-lg relative shrink-0 ${
            isFullscreen ? "p-5" : "p-4"
          }`}>
            {/* Big Hour-Minute-Second display using dot separators as in the screenshot */}
            <div className={`font-mono font-extrabold text-[#00D2FF] tracking-wider leading-none ${
              isFullscreen ? "text-5xl xl:text-6xl" : "text-4xl"
            }`}>
              {time.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }).replace(/:/g, ".")}
            </div>

            <div className={`font-black text-amber-300 uppercase tracking-widest mt-2 mb-0.5 ${
              isFullscreen ? "text-xs xl:text-sm" : "text-[9px]"
            }`}>
              JAM BUKA LAYANAN KAMI
            </div>

            {/* Formatted Date & Day */}
            <div className={`font-bold text-white/80 ${
              isFullscreen ? "text-sm xl:text-base" : "text-xs"
            }`}>
              {time.toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>

          {" "}
          {/* B. Stack of the 2 Calling Cards */}
          <div className="flex-1 flex flex-col gap-3 justify-stretch animate-none">
            
            {/* Card 1: Category A - Layanan Administrasi (BLUE) */}
            <div
              className="rounded-2xl border p-4 flex flex-col justify-between shadow-md transition-all duration-300 relative overflow-hidden flex-1 border-white/15"
              style={{ minHeight: isFullscreen ? "180px" : "160px", backgroundColor: colorCardA }}
              id="calling-card-prefix-a"
            >
              {/* Top title bar */}
              <div className="relative z-10 w-full">
                <h3 className={`font-black uppercase tracking-wider text-white leading-tight ${
                  isFullscreen ? "text-base md:text-lg xl:text-xl" : "text-xs md:text-sm"
                }`}>
                  {loketA?.serviceName || nameAntrianA}
                </h3>
                <p className={`uppercase font-mono tracking-widest text-[#CCE4F5] mt-1 font-bold ${
                  isFullscreen ? "text-xs" : "text-[9px]"
                }`}>
                  Nomor Antrean
                </p>
              </div>

              {/* Big central queue number */}
              <div className={isFullscreen ? "text-center py-2 lg:py-4" : "text-center py-1"}>
                <span className={`font-black font-mono text-center block text-white tracking-widest ${
                  isFullscreen ? "text-7xl xl:text-8xl 2xl:text-9xl py-1 md:py-2" : "text-6xl"
                }`} style={{ textShadow: "0 2px 5px rgba(0,0,0,0.2)" }}>
                  {lastCalledA ? lastCalledA.formattedNumber : "A--"}
                </span>
              </div>

              {/* Card Footer with assigned counter name */}
              <div className={`border-t border-[#CCE4F5]/20 pt-2 flex justify-between font-black uppercase text-white tracking-wider ${
                isFullscreen ? "text-sm md:text-base pt-3" : "text-[10px]"
              }`}>
                <span>{lastCalledA ? lastCalledA.loketName || loketA?.name || "LOKET A" : (loketA?.name || "LOKET 1")}</span>
                <span className={currentTicketA ? "text-amber-200" : "text-sky-200"}>
                  {currentTicketA ? "SEDANG DIPANGGIL" : "MENUNGGU"}
                </span>
              </div>
            </div>

            {/* Card 2: Category B - Layanan Teknis / Perizinan (GREEN) */}
            <div
              className="rounded-2xl border p-4 flex flex-col justify-between shadow-md transition-all duration-300 relative overflow-hidden flex-1 border-white/15"
              style={{ minHeight: isFullscreen ? "180px" : "160px", backgroundColor: colorCardB }}
              id="calling-card-prefix-b"
            >
              {/* Top title bar */}
              <div className="relative z-10 w-full">
                <h3 className={`font-black uppercase tracking-wider text-white leading-tight ${
                  isFullscreen ? "text-base md:text-lg xl:text-xl" : "text-xs md:text-sm"
                }`}>
                  {loketB?.serviceName || nameAntrianB}
                </h3>
                <p className={`uppercase font-mono tracking-widest text-[#D1FAE5] mt-1 font-bold ${
                  isFullscreen ? "text-xs" : "text-[9px]"
                }`}>
                  Nomor Antrean
                </p>
              </div>

              {/* Big central queue number */}
              <div className={isFullscreen ? "text-center py-2 lg:py-4" : "text-center py-1"}>
                <span className={`font-black font-mono text-center block text-white tracking-widest ${
                  isFullscreen ? "text-7xl xl:text-8xl 2xl:text-9xl py-1 md:py-2" : "text-6xl"
                }`} style={{ textShadow: "0 2px 5px rgba(0,0,0,0.2)" }}>
                  {lastCalledB ? lastCalledB.formattedNumber : "B--"}
                </span>
              </div>

              {/* Card Footer with assigned counter name */}
              <div className={`border-t border-[#D1FAE5]/20 pt-2 flex justify-between font-black uppercase text-white tracking-wider ${
                isFullscreen ? "text-sm md:text-base pt-3" : "text-[10px]"
              }`}>
                <span>{lastCalledB ? lastCalledB.loketName || loketB?.name || "LOKET B" : (loketB?.name || "LOKET P2TL")}</span>
                <span className={currentTicketB ? "text-amber-200" : "text-emerald-200"}>
                  {currentTicketB ? "SEDANG DIPANGGIL" : "MENUNGGU"}
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* 3. Bottom Running Text (Marquee footer track - slightly more compact) */}
      <div
        className="py-2.5 px-5 font-bold tracking-normal relative overflow-hidden shrink-0 border-t border-slate-900 flex items-center shadow-lg"
        style={{ 
          fontSize: `max(14px, ${textSizeRunning - 4}px)`,
          backgroundColor: colorBottomBg,
          color: colorBottomText,
        }} 
        id="marquee-footer-track"
      >
        <div 
          className="absolute left-0 top-0 bottom-0 text-white font-black text-[10px] px-4 flex items-center justify-center shrink-0 uppercase tracking-widest z-10 border-r"
          style={{ 
            backgroundColor: colorHeaderLeft, // use Header color as tag accent identifier, matching corporate identity 
            borderColor: "rgba(255,255,255,0.15)"
          }}
        >
          {textBottomLabel}
        </div>

        <div className="whitespace-nowrap overflow-hidden inline-block w-full pl-32 relative">
          <div 
            className="inline-block animate-[marquee_35s_linear_infinite] pl-[5%] uppercase tracking-wide font-extrabold"
            style={{ color: colorBottomText }}
          >
            {settings.runningText || "SELAMAT DATANG DI PLN ULP MANTINGAN - PELAYANAN BEBAS PUNGLI JANGAN BERI TIP KEPADA PETUGAS KAMI - LAPORKAN DI NOMOR GANGGUAN 123 ATAS HALAMAN LAINNYA."}
          </div>
        </div>
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
