import React, { useState } from "react";
import { MonitorSettings } from "../../types";
import { 
  Tv, 
  Sparkles, 
  Upload, 
  Video, 
  Trash2, 
  CheckCircle2, 
  Sliders, 
  Palette, 
  Info,
  Type,
  Plus,
  Volume2,
  Volume1,
  Volume,
  VolumeX,
  Play
} from "lucide-react";
import { saveVideoBlob, deleteVideoBlob } from "../../lib/VideoDB";

interface PengaturanMonitorProps {
  monitorSettings: MonitorSettings;
  onUpdateMonitorSettings: (settings: MonitorSettings) => void;
}

export default function PengaturanMonitor({
  monitorSettings,
  onUpdateMonitorSettings,
}: PengaturanMonitorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Local state buffer to store changes before performing high-cost network Supabase upserts on keystrokes/slider movements
  const [localSettings, setLocalSettings] = useState<MonitorSettings>(monitorSettings);
  const [showToast, setShowToast] = useState(false);

  // Keep in sync with external changes (e.g. initial loads from Supabase)
  React.useEffect(() => {
    setLocalSettings(monitorSettings);
  }, [monitorSettings]);

  // Mute memory and interactive speaker testing handlers
  const [lastVideoVol, setLastVideoVol] = useState(50);
  const [lastVoiceVol, setLastVoiceVol] = useState(80);

  const toggleMuteVideo = () => {
    const current = localSettings.videoVolume !== undefined ? localSettings.videoVolume : 50;
    if (current > 0) {
      setLastVideoVol(current);
      setLocalSettings(prev => ({ ...prev, videoVolume: 0 }));
    } else {
      setLocalSettings(prev => ({ ...prev, videoVolume: lastVideoVol || 50 }));
    }
  };

  const toggleMuteVoice = () => {
    const current = localSettings.voiceVolume !== undefined ? localSettings.voiceVolume : 80;
    if (current > 0) {
      setLastVoiceVol(current);
      setLocalSettings(prev => ({ ...prev, voiceVolume: 0 }));
    } else {
      setLocalSettings(prev => ({ ...prev, voiceVolume: lastVoiceVol || 80 }));
    }
  };

  const handleTestAudio = () => {
    try {
      const voiceVol = localSettings.voiceVolume !== undefined ? localSettings.voiceVolume : 80;
      const voiceVolNormalized = voiceVol / 100;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
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

      // Play chime notes at specified volumes
      playChimeTone(523.25, audioCtx.currentTime, 0.25); // C5
      playChimeTone(659.25, audioCtx.currentTime + 0.12, 0.25); // E5
      playChimeTone(783.99, audioCtx.currentTime + 0.24, 0.4); // G5

      // Speak Indonesian Text-To-Speech queue testing sample
      setTimeout(() => {
        if ("speechSynthesis" in window) {
          const textToSpeak = "Nomor antrean A, nol nol satu. Silakan menuju ke Loket satu.";
          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          utterance.lang = "id-ID";
          utterance.rate = 0.76;
          utterance.pitch = 1.05;
          utterance.volume = voiceVolNormalized;

          const voices = window.speechSynthesis.getVoices();
          const indonesianVoice = voices.find((v) => v.name.includes("Google") && v.lang.startsWith("id")) || 
                                  voices.find((v) => v.lang.startsWith("id"));
          if (indonesianVoice) {
            utterance.voice = indonesianVoice;
          }
          window.speechSynthesis.speak(utterance);
        } else {
          console.warn("Speech synthesis API not supported on this browser context.");
        }
      }, 700);
    } catch (e) {
      console.error("Gagal melakukan pengetesan suara audio:", e);
    }
  };

  // Parse playlist array with default fallback
  const videoUrls = localSettings.videoUrls && localSettings.videoUrls.length > 0
    ? localSettings.videoUrls
    : [localSettings.videoUrl || "https://www.youtube.com/watch?v=dQw4w9WgXcQ"];

  const handlePlaylistChange = (index: number, value: string) => {
    const updated = [...videoUrls];
    updated[index] = value;
    setLocalSettings(prev => ({
      ...prev,
      videoUrls: updated,
      // Fallback single url
      videoUrl: index === 0 ? value : prev.videoUrl,
    }));
  };

  const handleAddPlaylistItem = () => {
    if (videoUrls.length >= 10) return;
    const updated = [...videoUrls, ""];
    setLocalSettings(prev => ({
      ...prev,
      videoUrls: updated,
    }));
  };

  const handleRemovePlaylistItem = (index: number) => {
    if (videoUrls.length <= 1) return;
    const updated = videoUrls.filter((_, idx) => idx !== index);
    setLocalSettings(prev => ({
      ...prev,
      videoUrls: updated,
      // Fallback single url
      videoUrl: updated[0] || "",
    }));
  };

  const handleMonitorInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setLocalSettings(prev => ({
      ...prev,
      [name]: name === "textSizeRunning" ? (parseInt(value) || 12) : value,
    }));
  };

  const handleSaveSettings = () => {
    onUpdateMonitorSettings(localSettings);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  // Safe Fallbacks
  const textHeaderLeft = localSettings.textHeaderLeft !== undefined ? localSettings.textHeaderLeft : "PT PLN (PERSERO)";
  const textHeaderSubtext = localSettings.textHeaderSubtext !== undefined ? localSettings.textHeaderSubtext : "ULP MANTINGAN";
  const textBottomLabel = localSettings.textBottomLabel !== undefined ? localSettings.textBottomLabel : "INFO REKREASI";
  const colorBottomBg = localSettings.colorBottomBg !== undefined ? localSettings.colorBottomBg : "#facc15";
  const colorBottomText = localSettings.colorBottomText !== undefined ? localSettings.colorBottomText : "#020617";
  const videoVolume = localSettings.videoVolume !== undefined ? localSettings.videoVolume : 50;
  const voiceVolume = localSettings.voiceVolume !== undefined ? localSettings.voiceVolume : 80;

  return (
    <div className="space-y-6" id="panel-monitor-tab">
      <div className="border-b pb-3 border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div>
          <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
            <Tv className="w-4.5 h-4.5 text-emerald-500" />
            PENGATURAN MONITOR TV (KUSTOMISASI TOTAL LAYOUT & WARNA)
          </h3>
          <p className="text-slate-400 text-xs mt-1">
            Gunakan pengontrol di bawah ini untuk kustomisasi logo, teks header, warna navbar, running text, warna kartu, hingga format media info.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form adjustments */}
        <div className="lg:col-span-2 space-y-5">

          {/* Section 1: HEADER & NAVBAR (ATAS) */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-100 p-4 space-y-4 shadow-sm" id="sec-header-settings">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
              <span className="w-5 h-5 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">1</span>
              <h4 className="text-[11px] font-black tracking-wider text-slate-700 uppercase flex items-center gap-1">
                <Type className="w-3.5 h-3.5" /> BAGIAN HEADER & NAVBAR (ATAS TV)
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Teks Utama Header (Atas Kiri)</label>
                <input
                  type="text"
                  name="textHeaderLeft"
                  value={textHeaderLeft}
                  onChange={handleMonitorInputChange}
                  className="w-full bg-white border border-slate-200 text-xs rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Contoh: PT PLN (PERSERO)"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Sub-Teks Header (Unit Kerja)</label>
                <input
                  type="text"
                  name="textHeaderSubtext"
                  value={textHeaderSubtext}
                  onChange={handleMonitorInputChange}
                  className="w-full bg-white border border-slate-200 text-xs rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Contoh: ULP MANTINGAN"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Warna Latar Background Header/Navbar</label>
                <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl p-1.5">
                  <input
                    type="color"
                    name="colorHeaderLeft"
                    value={localSettings.colorHeaderLeft}
                    onChange={handleMonitorInputChange}
                    className="w-10 h-8 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                  />
                  <span className="text-[11px] font-mono font-bold text-slate-600">{localSettings.colorHeaderLeft}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Warna Header Cadangan / Accent Right</label>
                <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl p-1.5">
                  <input
                    type="color"
                    name="colorHeaderRight"
                    value={localSettings.colorHeaderRight}
                    onChange={handleMonitorInputChange}
                    className="w-10 h-8 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                  />
                  <span className="text-[11px] font-mono font-bold text-slate-600">{localSettings.colorHeaderRight}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: KARTU PANGGILAN ANTREAN (TENGAH KANAN) */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-100 p-4 space-y-4 shadow-sm" id="sec-cards-settings">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
              <span className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">2</span>
              <h4 className="text-[11px] font-black tracking-wider text-slate-700 uppercase flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5" /> KARTU PANGGILAN ANTREAN (TENGAH KANAN TV)
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card A */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between border-b pb-1.5 border-slate-100">
                  <span className="text-[10px] font-extrabold text-sky-600 uppercase">Grup Layanan A</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Nama Antrean A</label>
                  <input
                    type="text"
                    name="nameAntrianA"
                    value={localSettings.nameAntrianA}
                    onChange={handleMonitorInputChange}
                    className="w-full bg-slate-55 border border-slate-200 text-xs rounded-lg p-2 font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Warna Latar Kartu A</label>
                  <div className="flex items-center gap-2 bg-slate-55 border border-slate-100 rounded-lg p-1.5">
                    <input
                      type="color"
                      name="colorCardA"
                      value={localSettings.colorCardA}
                      onChange={handleMonitorInputChange}
                      className="w-8 h-7 rounded-md cursor-pointer border-0"
                    />
                    <span className="text-[11px] font-mono font-bold text-slate-600">{localSettings.colorCardA}</span>
                  </div>
                </div>
              </div>

              {/* Card B */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between border-b pb-1.5 border-slate-100">
                  <span className="text-[10px] font-extrabold text-emerald-600 uppercase">Grup Layanan B</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Nama Antrean B</label>
                  <input
                    type="text"
                    name="nameAntrianB"
                    value={localSettings.nameAntrianB}
                    onChange={handleMonitorInputChange}
                    className="w-full bg-slate-55 border border-slate-200 text-xs rounded-lg p-2 font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Warna Latar Kartu B</label>
                  <div className="flex items-center gap-2 bg-slate-55 border border-slate-100 rounded-lg p-1.5">
                    <input
                      type="color"
                      name="colorCardB"
                      value={localSettings.colorCardB}
                      onChange={handleMonitorInputChange}
                      className="w-8 h-7 rounded-md cursor-pointer border-0"
                    />
                    <span className="text-[11px] font-mono font-bold text-slate-600">{localSettings.colorCardB}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: MEDIA INFORMASI & VIDEO (TENGAH KIRI) */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-100 p-4 space-y-4 shadow-sm" id="sec-media-settings">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
              <span className="w-5 h-5 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-xs">3</span>
              <h4 className="text-[11px] font-black tracking-wider text-slate-700 uppercase flex items-center gap-1">
                <Video className="w-3.5 h-3.5" /> PLAYER MEDIA & DISPLAY MONITOR (TENGAH KIRI TV)
              </h4>
            </div>

             {/* Layout Mode Selector (Normal vs Full Screen Video Only) */}
            <div className="space-y-2 border-b border-slate-200/60 pb-4">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mode Tampilan Layar Utama TV</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="layout-mode-selector">
                <button
                  type="button"
                  onClick={() => {
                    setLocalSettings(prev => ({
                      ...prev,
                      layoutMode: "normal"
                    }));
                  }}
                  className={`flex flex-col items-start gap-1 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    (localSettings.layoutMode || "normal") === "normal"
                      ? "bg-slate-905 border-emerald-400 ring-2 ring-emerald-550/20 text-slate-800"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <span className={`w-2.5 h-2.5 rounded-full ${ (localSettings.layoutMode || "normal") === "normal" ? "bg-emerald-500" : "bg-slate-300" }`}></span>
                    <span>Tampilan Normal</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal font-medium">
                    Video, jam analog/digital, banner hari & tanggal, nomor antrean, dan running text.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLocalSettings(prev => ({
                      ...prev,
                      layoutMode: "video-only"
                    }));
                  }}
                  className={`flex flex-col items-start gap-1 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    localSettings.layoutMode === "video-only"
                      ? "bg-slate-905 border-sky-400 ring-2 ring-sky-550/20 text-slate-800"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <span className={`w-2.5 h-2.5 rounded-full ${ localSettings.layoutMode === "video-only" ? "bg-sky-500" : "bg-slate-300" }`}></span>
                    <span>Tampilan Video Saja (Full Screen)</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal font-medium">
                    Memutar video secara penuh melintasi seluruh layar monitor TV (menyembunyikan komponen lain).
                  </p>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase">Sumber File / Link Video</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="video-source-selector">
                <button
                  type="button"
                  onClick={() => {
                    setLocalSettings(prev => ({
                      ...prev,
                      videoSourceType: "youtube"
                    }));
                  }}
                  className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    (localSettings.videoSourceType || "youtube") === "youtube"
                      ? "bg-sky-50 border-sky-300 text-sky-700 shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Video className="w-4 h-4 text-red-500" />
                  <span>Streaming YouTube (.Link URL)</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setLocalSettings(prev => ({
                      ...prev,
                      videoSourceType: "local"
                    }));
                  }}
                  className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    localSettings.videoSourceType === "local"
                      ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Upload File Video MP4 Lokal ✨</span>
                </button>
              </div>
            </div>

            {/* Conditionally reveal inputs based on source type */}
            {localSettings.videoSourceType === "local" ? (
              <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100/60 space-y-3">
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-700">
                  <Video className="w-3.5 h-3.5 text-emerald-600" />
                  <span>UPLOAD FILE VIDEO MANDIRI (.MP4 / .WEBM)</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-[9px] text-slate-400 font-bold mb-1 uppercase">Pilih File Video</label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            setIsUploading(true);
                            setUploadError(null);
                            await saveVideoBlob(file);
                            setLocalSettings(prev => ({
                              ...prev,
                              videoSourceType: "local",
                              localVideoName: file.name
                            }));
                          } catch (err: any) {
                            setUploadError(err.message || "Gagal mengunggah video.");
                          } finally {
                            setIsUploading(false);
                          }
                        }
                      }}
                      className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                    />
                  </div>

                  <div>
                    {isUploading && (
                      <div className="flex items-center gap-2 text-xs text-slate-550">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                        <span>Menyimpan ke browser...</span>
                      </div>
                    )}
                    {uploadError && (
                      <p className="text-xs text-red-600 font-semibold">{uploadError}</p>
                    )}
                    {!isUploading && localSettings.localVideoName && (
                      <div className="bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-between gap-2 max-w-full">
                        <div className="flex items-center gap-1.5 overflow-hidden text-xs text-slate-700">
                           <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="slice-text truncate font-semibold" style={{ maxWidth: "160px" }}>{localSettings.localVideoName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await deleteVideoBlob();
                              setLocalSettings(prev => ({
                                ...prev,
                                localVideoName: undefined
                              }));
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className="text-red-500 hover:text-red-700 p-1 shrink-0 transition"
                          title="Hapus video ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 leading-normal">
                  *Catatan: Video disimpan langsung di database lokal browser Anda secara offline menggunakan IndexedDB, sangat cepat tanpa membebani server/kuota internet saat diputar!
                </p>
              </div>
            ) : (
              <div className="p-3.5 bg-sky-50/50 rounded-2xl border border-sky-100/60 space-y-3">
                <div className="flex items-center justify-between border-b border-sky-100/50 pb-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-700">
                    <Video className="w-3.5 h-3.5 text-red-500" />
                    <span>PLAYLIST STREAMING VIDEO YOUTUBE (BERURUTAN & LOOPING)</span>
                  </div>
                  <span className="text-[10px] text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md font-bold">
                    {videoUrls.length} Video
                  </span>
                </div>

                <p className="text-[10px] text-slate-405 leading-normal pb-1">
                  Masukkan link/alamat video YouTube yang ingin diputar di monitor TV ruang tunggu. Sistem akan otomatis menyambungkan dan memutarnya berurutan secara looping otomatis.
                </p>

                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1" id="youtube-playlist-fields">
                  {videoUrls.map((url, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <div className="bg-sky-100/80 text-sky-850 font-bold border border-sky-200 text-[10px] w-7 h-7 rounded-lg flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => handlePlaylistChange(idx, e.target.value)}
                        className="flex-1 bg-white border border-slate-200 text-xs rounded-xl p-2 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="Contoh: https://www.youtube.com/watch?v=dQw4w9WgXcQ atau dQw4w9WgXcQ"
                      />
                      {videoUrls.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePlaylistItem(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1.5 hover:bg-rose-55 rounded-lg shrink-0 transition cursor-pointer"
                          title="Hapus baris video"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {videoUrls.length < 10 && (
                  <button
                    type="button"
                    onClick={handleAddPlaylistItem}
                    className="flex items-center justify-center gap-1 py-1.5 px-3 bg-white border border-sky-200 text-sky-700 rounded-lg text-[11px] font-bold hover:bg-sky-55 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Link Video (+{10 - videoUrls.length} Tersisa)</span>
                  </button>
                )}
              </div>
            )}
          </div>          {/* Section 4: RUNNING TEXT & FOOTER BAR (BAWAH) */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-100 p-4 space-y-4 shadow-sm" id="sec-running-settings">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
              <span className="w-5 h-5 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">4</span>
              <h4 className="text-[11px] font-black tracking-wider text-slate-700 uppercase flex items-center gap-1">
                <Type className="w-3.5 h-3.5" /> INFO RUNNING TEXT & BANNER (BAWAH TV)
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Isi / Teks Berjalan</label>
                <textarea
                  name="runningText"
                  rows={2}
                  value={localSettings.runningText}
                  onChange={handleMonitorInputChange}
                  className="w-full bg-white border border-slate-200 text-[11px] font-semibold rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Info pengumuman berjalan di monitor..."
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Label Teks Berjalan (Kiri)</label>
                  <input
                    type="text"
                    name="textBottomLabel"
                    value={textBottomLabel}
                    onChange={handleMonitorInputChange}
                    className="w-full bg-white border border-slate-200 text-xs rounded-xl p-2 font-bold text-slate-800"
                    placeholder="default: INFO REKREASI"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Ukuran Huruf Running Text (Pixel / PX)</label>
                  <input
                    type="number"
                    name="textSizeRunning"
                    value={localSettings.textSizeRunning}
                    onChange={handleMonitorInputChange}
                    className="w-full bg-white border border-slate-200 text-xs rounded-xl p-2 font-bold text-slate-850"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Warna Pita Background Running Text</label>
                <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl p-1.5 border-amber-300">
                  <input
                    type="color"
                    name="colorBottomBg"
                    value={colorBottomBg}
                    onChange={handleMonitorInputChange}
                    className="w-10 h-8 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                  />
                  <span className="text-[11px] font-mono font-bold text-slate-600">{colorBottomBg}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Warna Teks Running Text</label>
                <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl p-1.5 border-slate-350">
                  <input
                    type="color"
                    name="colorBottomText"
                    value={colorBottomText}
                    onChange={handleMonitorInputChange}
                    className="w-10 h-8 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                  />
                  <span className="text-[11px] font-mono font-bold text-slate-600">{colorBottomText}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: WARNA UTAMA & BACKGROUND TV */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-100 p-4 space-y-4 shadow-sm" id="sec-global-settings">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
              <span className="w-5 h-5 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs">5</span>
              <h4 className="text-[11px] font-black tracking-wider text-slate-700 uppercase flex items-center gap-1">
                <Palette className="w-3.5 h-3.5" /> LATAR BELAKANG & TEKS TV (GLOBAL)
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Warna Background TV Global</label>
                <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl p-1.5">
                  <input
                    type="color"
                    name="colorBackground"
                    value={localSettings.colorBackground}
                    onChange={handleMonitorInputChange}
                    className="w-10 h-8 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                  />
                  <span className="text-[11px] font-mono font-bold text-slate-600">{localSettings.colorBackground}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Warna Teks TV Utama</label>
                <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl p-1.5">
                  <input
                    type="color"
                    name="colorText"
                    value={localSettings.colorText}
                    onChange={handleMonitorInputChange}
                    className="w-10 h-8 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                  />
                  <span className="text-[11px] font-mono font-bold text-slate-600">{localSettings.colorText}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 6: PENGATURAN SUARA & VOLUME */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-100 p-4 space-y-4 shadow-sm" id="sec-volume-settings">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">6</span>
                <h4 className="text-[11px] font-black tracking-wider text-slate-700 uppercase flex items-center gap-1">
                  PENGATURAN SUARA & VOLUME (SPEAKER MONITORS)
                </h4>
              </div>
              <button
                type="button"
                onClick={handleTestAudio}
                className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-wide transition-all shadow-sm active:scale-95 cursor-pointer"
                title="Uji coba bunyikan bel dan suara panggilan antrean di komputer Anda"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>TES BUNYI</span>
              </button>
            </div>

            <p className="text-[10px] text-slate-400 leading-normal">
              Atur tingkat volume suara untuk pemutaran video media informasi dan suara pemanggilan nomor antrean oleh sistem. Cepat uji keselarasan bunyi dengan mengklik tombol <b>TES BUNYI</b> di atas.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Volume 1: Suara Video */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Volume Suara Video Berjalan</label>
                  {videoVolume === 0 && <span className="text-[9px] font-bold text-red-500 uppercase">MUTED</span>}
                </div>
                <div className="bg-[#2D3139] text-white rounded-2xl px-4 py-3 flex items-center gap-4 border border-slate-700/50 shadow-md">
                  <button
                    type="button"
                    onClick={toggleMuteVideo}
                    className="shrink-0 transition-transform active:scale-90 hover:opacity-80"
                    title={videoVolume > 0 ? "Mute suara video" : "Unmute suara video"}
                  >
                    {videoVolume === 0 ? (
                      <VolumeX className="w-5 h-5 text-red-400 shrink-0" />
                    ) : videoVolume < 35 ? (
                      <Volume className="w-5 h-5 text-slate-350 shrink-0" />
                    ) : videoVolume < 70 ? (
                      <Volume1 className="w-5 h-5 text-sky-400 shrink-0" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-sky-500 shrink-0" />
                    )}
                  </button>
                  <div className="flex-1 relative flex items-center group">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={videoVolume}
                      onChange={(e) => {
                        setLocalSettings(prev => ({
                          ...prev,
                          videoVolume: parseInt(e.target.value)
                        }));
                      }}
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-600 accent-sky-400 focus:outline-none focus:ring-0"
                      style={{
                        background: `linear-gradient(to right, #38bdf8 0%, #38bdf8 ${videoVolume}%, #475569 ${videoVolume}%, #475569 100%)`
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold tracking-wide w-8 text-center select-none font-mono text-slate-100">
                    {videoVolume}
                  </span>
                </div>
              </div>

              {/* Volume 2: Suara Pemanggilan Antrean */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Volume Suara Panggilan Antrean</label>
                  {voiceVolume === 0 && <span className="text-[9px] font-bold text-red-500 uppercase">MUTED</span>}
                </div>
                <div className="bg-[#2D3139] text-white rounded-2xl px-4 py-3 flex items-center gap-4 border border-slate-700/50 shadow-md">
                  <button
                    type="button"
                    onClick={toggleMuteVoice}
                    className="shrink-0 transition-transform active:scale-90 hover:opacity-80"
                    title={voiceVolume > 0 ? "Mute suara panggilan" : "Unmute suara panggilan"}
                  >
                    {voiceVolume === 0 ? (
                      <VolumeX className="w-5 h-5 text-red-400 shrink-0" />
                    ) : voiceVolume < 35 ? (
                      <Volume className="w-5 h-5 text-slate-355 shrink-0" />
                    ) : voiceVolume < 70 ? (
                      <Volume1 className="w-5 h-5 text-sky-400 shrink-0" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-sky-500 shrink-0" />
                    )}
                  </button>
                  <div className="flex-1 relative flex items-center group">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={voiceVolume}
                      onChange={(e) => {
                        setLocalSettings(prev => ({
                          ...prev,
                          voiceVolume: parseInt(e.target.value)
                        }));
                      }}
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-600 accent-sky-400 focus:outline-none focus:ring-0"
                      style={{
                        background: `linear-gradient(to right, #38bdf8 0%, #38bdf8 ${voiceVolume}%, #475569 ${voiceVolume}%, #475569 100%)`
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold tracking-wide w-8 text-center select-none font-mono text-slate-100">
                    {voiceVolume}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 7: ACTION BAR TO PERSIST CHANGES TO CLOUD */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm" id="sec-save-monitor">
            <div className="flex gap-3 items-start text-left">
              <span className="p-2 rounded-xl bg-emerald-500 text-white shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-xs font-extrabold text-emerald-800 uppercase tracking-tight">Simpan Perubahan Monitor</h4>
                <p className="text-[10px] text-emerald-600 leading-normal mt-0.5 font-medium">
                  Klik tombol simpan untuk menyinkronkan seluruh perubahan layout, playlist video, warna kustom, dan volume suara monitor ke database cloud.
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleSaveSettings}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-md shrink-0 cursor-pointer"
            >
              SIMPAN SETELAN MONITOR
            </button>
          </div>

        </div>

      </div>

      {/* Floating Success Notification Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-700/60 text-white font-bold text-xs px-4 py-3 rounded-2xl flex items-center gap-2.5 shadow-2xl z-50 animate-bounce">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Setelan monitor TV berhasil disimpan dan disinkronkan ke cloud!</span>
        </div>
      )}
    </div>
  );
}
