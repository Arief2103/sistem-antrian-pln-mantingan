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

  // Custom Word-style font size control generator (Supports manual typing and selection dropdown)
  const renderFontSizeControl = (
    label: string, 
    name: keyof MonitorSettings, 
    defaultValue: number,
    description?: string
  ) => {
    const currentVal = localSettings[name] !== undefined ? Number(localSettings[name]) : defaultValue;
    return (
      <div className="space-y-1">
        <label className="block text-xs font-bold text-slate-700 tracking-wide">{label}</label>
        {description && <p className="text-[11px] text-slate-400 font-medium mb-1">{description}</p>}
        <div className="flex items-center gap-2">
          {/* Manual numeric input */}
          <input
            type="number"
            min="1"
            max="120"
            value={currentVal}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 12;
              setLocalSettings(prev => ({ ...prev, [name]: val }));
            }}
            className="w-16 bg-white border border-slate-300 text-xs rounded-lg p-2 font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
          {/* Quick preset selector */}
          <select
            value={currentVal}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (val) {
                setLocalSettings(prev => ({ ...prev, [name]: val }));
              }
            }}
            className="bg-white border border-slate-300 text-xs rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-500 shrink-0"
          >
            {Array.from({ length: 32 }, (_, i) => i + 1).map(sz => (
              <option key={sz} value={sz}>{sz} px</option>
            ))}
            <option value="36">36 px</option>
            <option value="40">40 px</option>
            <option value="48">48 px</option>
            <option value="64">64 px</option>
            <option value="72">72 px</option>
          </select>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" id="panel-monitor-tab">

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Bagian 8: Button Simpan Permanen */}
          <div
            className="bg-slate-50 border border-slate-200 rounded-lg p-5 flex justify-center items-center"
            id="sec-save-monitor"
          >
            <button
              type="button"
              onClick={handleSaveSettings}
              className="w-full sm:w-auto px-6 py-4 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition duration-150 shadow shrink-0 cursor-pointer"
            >
              Simpan Setelan Monitor
            </button>
          </div>
        <div className="space-y-6">

          {/* Bagian 1: Header Atas TV */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4 shadow-sm" id="sec-header-settings">
            <div className="pb-2 border-b border-slate-200">
              <h4 className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                1. Bagian Header Atas (Nama Unit & Brand)
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                Mengonfigurasi teks instansi dan sub-judul instansi yang tampil di bagian paling atas monitor TV ruang antrean.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teks Utama Header</label>
                  <input
                    type="text"
                    name="textHeaderLeft"
                    value={textHeaderLeft}
                    onChange={handleMonitorInputChange}
                    className="w-full bg-white border border-slate-300 text-xs rounded-lg p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    placeholder="Contoh: PT PLN (PERSERO)"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Slogan atau nama instansi utama sebelah kiri logo.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sub-Teks Header</label>
                  <input
                    type="text"
                    name="textHeaderSubtext"
                    value={textHeaderSubtext}
                    onChange={handleMonitorInputChange}
                    className="w-full bg-white border border-slate-300 text-xs rounded-lg p-2.5 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    placeholder="Contoh: ULP MANTINGAN"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Keterangan unit kerja atau lokasi detail di bawah nama instansi.</p>
                </div>

                <div className="md:col-span-2 border-t border-slate-100 pt-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Logo Instansi Kustom (Untuk Header TV)</label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                    <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center p-1.5 border border-slate-200 overflow-hidden shrink-0 shadow-sm">
                      <img
                        src={localSettings.logoUrl || "/logo-pln1.png"}
                        alt="Preview Logo"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] px-3.5 py-2 rounded-lg cursor-pointer transition shadow-sm inline-flex items-center gap-1.5">
                          <span>📁 Upload File Logo Baru</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setLocalSettings(prev => ({
                                    ...prev,
                                    logoUrl: reader.result as string
                                  }));
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {localSettings.logoUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setLocalSettings(prev => ({
                                ...prev,
                                logoUrl: ""
                              }));
                            }}
                            className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-[11px] px-3.5 py-2 rounded-lg transition shadow-sm"
                          >
                            Reset ke Logo Default PLN
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Mendukung JPG, PNG, atau SVG. Disarankan gambar dengan background transparan (PNG) atau berukuran persegi agar tampil simetris di pojok kiri atas monitor TV.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                {renderFontSizeControl("Ukuran Huruf Utama", "textSizeHeaderLeft", 18, "Ukuran teks utama instansi")}
                {renderFontSizeControl("Ukuran Huruf Sub-Teks", "textSizeHeaderSubtext", 12, "Ukuran teks unit kerja")}
                {renderFontSizeControl("Ukuran Logo Instansi (px)", "logoSize", 40, "Lebar & tinggi gambar logo PLN")}
                
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">Warna Latar Header</label>
                  <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg p-1.5">
                    <input
                      type="color"
                      name="colorHeaderLeft"
                      value={localSettings.colorHeaderLeft}
                      onChange={handleMonitorInputChange}
                      className="w-10 h-8 rounded cursor-pointer border-0 p-0 overflow-hidden"
                    />
                    <span className="text-[11px] font-mono font-bold text-slate-600">{localSettings.colorHeaderLeft}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">Warna Latar Aksen Kanan</label>
                  <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg p-1.5">
                    <input
                      type="color"
                      name="colorHeaderRight"
                      value={localSettings.colorHeaderRight}
                      onChange={handleMonitorInputChange}
                      className="w-10 h-8 rounded cursor-pointer border-0 p-0 overflow-hidden"
                    />
                    <span className="text-[11px] font-mono font-bold text-slate-600">{localSettings.colorHeaderRight}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bagian 2: Kartu Loket Antrean */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4 shadow-sm" id="sec-cards-settings">
            <div className="pb-2 border-b border-slate-200">
              <h4 className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                2. Kartu Loket Antrean (Kategori & Ukuran Teks Kartu)
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                Mengatur label layanan masing-masing kode prefix antrean dan kustomisasi warna kartu panggil yang aktif di monitor TV.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Kartu A */}
              <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b pb-1 border-slate-200">
                  <span className="text-xs font-bold text-slate-700">Grup Antrean A (Prefix A)</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">Nama Layanan A</label>
                  <input
                    type="text"
                    name="nameAntrianA"
                    value={localSettings.nameAntrianA}
                    onChange={handleMonitorInputChange}
                    className="w-full bg-white border border-slate-300 text-xs rounded-lg p-2 font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">Warna Latar Kartu A</label>
                  <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg p-1.5">
                    <input
                      type="color"
                      name="colorCardA"
                      value={localSettings.colorCardA}
                      onChange={handleMonitorInputChange}
                      className="w-8 h-7 rounded cursor-pointer border-0"
                    />
                    <span className="text-[11px] font-mono font-bold text-slate-600">{localSettings.colorCardA}</span>
                  </div>
                </div>
              </div>

              {/* Kartu B */}
              <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b pb-1 border-slate-200">
                  <span className="text-xs font-bold text-slate-700">Grup Antrean B (Prefix B)</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">Nama Layanan B</label>
                  <input
                    type="text"
                    name="nameAntrianB"
                    value={localSettings.nameAntrianB}
                    onChange={handleMonitorInputChange}
                    className="w-full bg-white border border-slate-300 text-xs rounded-lg p-2 font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">Warna Latar Kartu B</label>
                  <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg p-1.5">
                    <input
                      type="color"
                      name="colorCardB"
                      value={localSettings.colorCardB}
                      onChange={handleMonitorInputChange}
                      className="w-8 h-7 rounded cursor-pointer border-0"
                    />
                    <span className="text-[11px] font-mono font-bold text-slate-600">{localSettings.colorCardB}</span>
                  </div>
                </div>
              </div>

              {/* Ukuran Huruf di dalam Kartu */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-center">
                {renderFontSizeControl("Ukuran Huruf Teks Kartu", "textSizeCardText", 14, "Mempengaruhi judul layanan dan label nomor di dalam kartu loket pada layar monitor.")}
              </div>
            </div>
          </div>

          {/* Bagian 3: Media Player Video */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4 shadow-sm" id="sec-media-settings">
            <div className="pb-2 border-b border-slate-200">
              <h4 className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                3. Playlist Media Player & Layout Layar Video
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                Mengatur mode monitor (Tampilan Terbagi vs Video Penuh) dan memuat link YouTube atau file video MP4 offline.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Mode Tampilan Layar Utama TV</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="layout-mode-selector">
                  <button
                    type="button"
                    onClick={() => setLocalSettings(prev => ({ ...prev, layoutMode: "normal" }))}
                    className={`flex flex-col items-start gap-1 p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                      (localSettings.layoutMode || "normal") === "normal"
                        ? "bg-slate-105 border-slate-400 font-bold"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-xs font-bold">Tampilan Layar Terbagi (Normal)</span>
                    <p className="text-[10px] text-slate-500 font-normal">Menampilkan Video, Jam/Tanggal, Info Antrean, dan Teks Berjalan terbagi rapi.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLocalSettings(prev => ({ ...prev, layoutMode: "video-only" }))}
                    className={`flex flex-col items-start gap-1 p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                      localSettings.layoutMode === "video-only"
                        ? "bg-slate-105 border-slate-400 font-bold"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-xs font-bold">Tampilan Video Saja (Full Screen)</span>
                    <p className="text-[10px] text-slate-500 font-normal">Memutar media secara penuh melintasi seluruh layar monitor TV (menyembunyikan widget lain).</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Sumber Video Monitor</label>
                <div className="grid grid-cols-2 gap-3" id="video-source-selector">
                  <button
                    type="button"
                    onClick={() => setLocalSettings(prev => ({ ...prev, videoSourceType: "youtube" }))}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold text-center transition-all cursor-pointer ${
                      (localSettings.videoSourceType || "youtube") === "youtube"
                        ? "bg-slate-105 border-slate-400 text-slate-800"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Streaming YouTube Link
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setLocalSettings(prev => ({ ...prev, videoSourceType: "local" }))}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold text-center transition-all cursor-pointer ${
                      localSettings.videoSourceType === "local"
                        ? "bg-slate-105 border-slate-400 text-slate-800"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Upload File Video MP4 Lokal
                  </button>
                </div>
              </div>

              {localSettings.videoSourceType === "local" ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Pilih File Video Berjalan (.MP4)</label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
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
                      className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-slate-300 file:text-[11px] file:bg-white file:text-slate-800 hover:file:bg-slate-50 cursor-pointer"
                    />
                    
                    {isUploading && (
                      <span className="text-xs text-slate-500">Sedang menyimpan video ke penyimpanan browser...</span>
                    )}
                    {uploadError && (
                      <span className="text-xs text-red-650 font-bold">{uploadError}</span>
                    )}
                    {!isUploading && localSettings.localVideoName && (
                      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700">
                        <span className="font-semibold">{localSettings.localVideoName}</span>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await deleteVideoBlob();
                              setLocalSettings(prev => ({ ...prev, localVideoName: undefined }));
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className="text-red-500 hover:text-red-700 font-bold"
                        >
                          Hapus
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-700">Daftar Putar Video YouTube</span>
                    <span className="text-[10px] text-slate-500">{videoUrls.length} Video Terdaftar</span>
                  </div>

                  <div className="space-y-2" id="youtube-playlist-fields">
                    {videoUrls.map((url, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400 w-5">{idx + 1}.</span>
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => handlePlaylistChange(idx, e.target.value)}
                          className="flex-1 bg-white border border-slate-300 text-xs rounded-lg p-2 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-500"
                          placeholder="Masukkan ID Video atau URL YouTube..."
                        />
                        {videoUrls.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePlaylistItem(idx)}
                            className="text-red-500 hover:text-red-700 text-xs p-1 font-semibold"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {videoUrls.length < 10 && (
                    <button
                      type="button"
                      onClick={handleAddPlaylistItem}
                      className="py-1 px-3 bg-white border border-slate-300 text-slate-700 rounded text-xs hover:bg-slate-50 transition cursor-pointer"
                    >
                      + Tambah Baris Baris Baru
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bagian 4: Running Text & Banner Bawah */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4 shadow-sm" id="sec-running-settings">
            <div className="pb-2 border-b border-slate-200">
              <h4 className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                4. Informasi Running Text & Tag Label (Bagian Bawah TV)
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                Mengonfigurasi pita pesan berjalan (running text) yang bergeser konstan di area paling bawah monitorTV.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pesan Berjalan (Isi Utama)</label>
                  <textarea
                    name="runningText"
                    rows={2}
                    value={localSettings.runningText}
                    onChange={handleMonitorInputChange}
                    className="w-full bg-white border border-slate-300 text-xs rounded-lg p-2 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    placeholder="Contoh: SELAMAT DATANG DI PLN ULP MANTINGAN..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Label Pita Berjalan (Format Teks Tag Kiri)</label>
                  <input
                    type="text"
                    name="textBottomLabel"
                    value={textBottomLabel}
                    onChange={handleMonitorInputChange}
                    className="w-full bg-white border border-slate-300 text-xs rounded-lg p-2 font-bold text-slate-800"
                    placeholder="Contoh: INFO REKREASI / POLRI INFO"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Tag label statis yang menempel di ujung kiri pita berjalan.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                {renderFontSizeControl("Ukuran Huruf Label Kiri", "textSizeBottomLabel", 10, "Ukuran huruf tag label kiri")}
                {renderFontSizeControl("Ukuran Huruf Teks Berjalan", "textSizeRunning", 18, "Ukuran huruf pita pesan berjalan")}

                <div>
                  <label className="block text-[11px] font-bold text-slate-650 mb-1 uppercase">Warna Latar Pita</label>
                  <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg p-1">
                    <input
                      type="color"
                      name="colorBottomBg"
                      value={colorBottomBg}
                      onChange={handleMonitorInputChange}
                      className="w-10 h-8 rounded border-0 p-0 cursor-pointer"
                    />
                    <span className="text-[11px] font-mono font-bold text-slate-600">{colorBottomBg}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-650 mb-1 uppercase">Warna Teks Berjalan</label>
                  <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg p-1">
                    <input
                      type="color"
                      name="colorBottomText"
                      value={colorBottomText}
                      onChange={handleMonitorInputChange}
                      className="w-10 h-8 rounded border-0 p-0 cursor-pointer"
                    />
                    <span className="text-[11px] font-mono font-bold text-slate-600">{colorBottomText}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bagian 5: Pengaturan Jam, Judul Layanan & Tanggal */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4 shadow-sm" id="sec-clock-settings">
            <div className="pb-2 border-b border-slate-200">
              <h4 className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                5. Widget Jam, Judul Layanan & Hari Tanggal
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                Kustomisasi template tampilan format jam (5 contoh variasi), tulisan sub-judul jam buka layanan, beserta ukuran huruf masing-masing elemen penunjuk waktu di TV.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pilihan Template Format Jam</label>
                  <select
                    name="clockFormatTemplate"
                    value={localSettings.clockFormatTemplate || "HH.mm.ss"}
                    onChange={handleMonitorInputChange}
                    className="w-full bg-white border border-slate-300 text-xs rounded-lg p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-500 cursor-pointer"
                  >
                    <option value="HH.mm.ss">12.30.53 — Jam, Menit, Detik (Titik)</option>
                    <option value="HH:mm:ss">17:15:09 — Jam, Menit, Detik (Titik Dua)</option>
                    <option value="HH.mm">12.50 — Jam & Menit Saja (Titik)</option>
                    <option value="HH:mm">12:50 — Jam & Menit Saja (Titik Dua)</option>
                    <option value="HH.mm WIB">12.45 WIB — Jam, Menit & Teken WIB</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Pilih format waktu digital di atas monitor TV Anda.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tulisan Di Bawah Jam (Sub-Teks Layanan)</label>
                  <input
                    type="text"
                    name="textClockTitle"
                    value={localSettings.textClockTitle !== undefined ? localSettings.textClockTitle : "JAM BUKA LAYANAN KAMI"}
                    onChange={handleMonitorInputChange}
                    className="w-full bg-white border border-slate-300 text-xs rounded-lg p-2.5 font-bold text-slate-800"
                    placeholder="Contoh: JAM BUKA LAYANAN KAMI"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Pita keterangan kecil di atas hari & tanggal lengkap.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                {renderFontSizeControl("Ukuran Huruf Jam (px)", "textSizeClock", 38, "Mempengaruhi ukuran digit waktu digital utama")}
                {renderFontSizeControl("Ukuran Huruf Sub-Teks", "textSizeClockTitle", 10, "Mempengaruhi tulisan sub-judul jam buka")}
                {renderFontSizeControl("Ukuran Huruf Hari & Tanggal", "textSizeDayDate", 12, "Mempengaruhi tanggal lengkap bagian paling bawah")}
              </div>
            </div>

            {/* Kustomisasi Pewarnaan Teks Jam, Sub-Teks, & Hari Tanggal */}
            <div className="border-t border-slate-100 pt-4 mt-2">
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Kustomisasi Pewarnaan Teks Widget Jam</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">Warna Huruf Jam</label>
                  <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg p-1.5 shadow-sm">
                    <input
                      type="color"
                      name="colorClock"
                      value={localSettings.colorClock || "#00D2FF"}
                      onChange={handleMonitorInputChange}
                      className="w-10 h-8 rounded border-0 p-0 cursor-pointer overflow-hidden"
                    />
                    <span className="text-[11px] font-mono font-bold text-slate-600">{localSettings.colorClock || "#00D2FF"}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1">Mengubah warna angka penunjuk jam utama (default: cyan).</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">Warna Sub-Teks Layanan</label>
                  <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg p-1.5 shadow-sm">
                    <input
                      type="color"
                      name="colorClockTitle"
                      value={localSettings.colorClockTitle || "#FBBF24"}
                      onChange={handleMonitorInputChange}
                      className="w-10 h-8 rounded border-0 p-0 cursor-pointer overflow-hidden"
                    />
                    <span className="text-[11px] font-mono font-bold text-slate-600">{localSettings.colorClockTitle || "#FBBF24"}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1">Mengubah warna teks sub-judul waktu (default: kuning/amber-300).</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">Warna Hari & Tanggal</label>
                  <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg p-1.5 shadow-sm">
                    <input
                      type="color"
                      name="colorDayDate"
                      value={localSettings.colorDayDate || "#E2E8F0"}
                      onChange={handleMonitorInputChange}
                      className="w-10 h-8 rounded border-0 p-0 cursor-pointer overflow-hidden"
                    />
                    <span className="text-[11px] font-mono font-bold text-slate-600">{localSettings.colorDayDate || "#E2E8F0"}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1">Mengubah warna tulisan penanda hari dan tanggal (default: perak/putih).</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bagian 6: Latar Belakang & Teks Global */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4 shadow-sm" id="sec-global-settings">
            <div className="pb-2 border-b border-slate-200">
              <h4 className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                6. Latar Belakang TV & Warna Teks (Global)
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                Mengatur warna dasar global di luar panel-panel penting TV antrean.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-755 mb-1">Warna Background Global TV</label>
                <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg p-1.5">
                  <input
                    type="color"
                    name="colorBackground"
                    value={localSettings.colorBackground}
                    onChange={handleMonitorInputChange}
                    className="w-10 h-8 rounded cursor-pointer border-0 p-0"
                  />
                  <span className="text-xs font-mono font-bold text-slate-600">{localSettings.colorBackground}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-755 mb-1">Warna Teks Global TV</label>
                <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg p-1.5">
                  <input
                    type="color"
                    name="colorText"
                    value={localSettings.colorText}
                    onChange={handleMonitorInputChange}
                    className="w-10 h-8 rounded cursor-pointer border-0 p-0"
                  />
                  <span className="text-xs font-mono font-bold text-slate-600">{localSettings.colorText}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bagian 7: Pengaturan Suara & Volume TV */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4 shadow-sm" id="sec-volume-settings">
            <div className="pb-2 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                  7. Pengaturan Tingkat Volume Suara (Speaker)
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                  Atur tingkat kekerasan video informasi dan uji coba suara pemanggilan antrean di perangkat lokal.
                </p>
              </div>
              <button
                type="button"
                onClick={handleTestAudio}
                className="bg-slate-800 hover:bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition duration-150 cursor-pointer"
              >
                Tes Contoh Panggilan Lokal
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Volume Suara Video Berjalan ({videoVolume}%)</label>
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
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Volume Suara Panggilan Antrean ({voiceVolume}%)</label>
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
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer focus:outline-none"
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white font-bold text-xs px-4 py-3 rounded-lg shadow-2xl z-50">
          <span>Setelan monitor TV telah berhasil disimpan dan disinkronkan ke cloud!</span>
        </div>
      )}
    </div>
  );
}
