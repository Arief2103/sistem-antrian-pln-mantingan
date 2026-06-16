export type UserRole = "admin" | "petugas" | "display";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  username: string;
  password?: string;
}

export interface LoketItem {
  id: string;
  name: string;      // e.g., "Loket 1"
  prefix: string;    // e.g., "A" (for Pasang Baru) or "B" (for Pengaduan)
  serviceName: string; // e.g., "Pasang Baru / Perubahan Daya", "Pengaduan / Keluhan"
  isActive: boolean;
}

export interface QueueItem {
  id: string;
  number: number;       // e.g., 5 (translating to A005)
  formattedNumber: string; // e.g., "A005"
  serviceName: string;
  prefix: string;
  status: "waiting" | "calling" | "completed" | "skipped";
  createdAt: string;
  calledAt?: string;
  completedAt?: string;
  loketId?: string;     // Assigned counter
  loketName?: string;   // Assigned counter name
  pelangganNama?: string;
  pelangganId?: string;
  pelangganAlamat?: string;
  pelangganHp?: string;
  pelangganKeterangan?: string;
}

export interface PrintSettings {
  headerText?: string;
  subHeader?: string;
  footerText?: string;
  showLogo?: boolean;
  paperWidth?: string; // e.g. "58mm", "80mm"
  logoType?: "default" | "custom";
  customLogo?: string; // base64 string of high contrast logo
  logoPosition?: "top" | "side" | "none";
  headerSize?: string;
  headerStyle?: "normal" | "bold" | "italic" | "bold-italic";
  subHeaderSize?: string;
  subHeaderStyle?: "normal" | "bold" | "italic" | "bold-italic";
  footerSize?: string;
  footerStyle?: "normal" | "bold" | "italic" | "bold-italic";
  dateTimeSize?: string;
  dateTimeStyle?: "normal" | "bold" | "italic" | "bold-italic";
  useBluetoothPrintApp?: boolean;
  useWebBluetooth?: boolean;
  useRawBtApp?: boolean;
  alamat?: string;
  footerSatu?: string;
  footerDua?: string;
  showFooterDua?: boolean;
  feedLines?: number;
  cetakQr?: boolean;
  namaInstansi?: string;
  cabang?: string;
  footer?: string;
  logoSize?: number;
  sizeNamaInstansi?: number;
  sizeCabang?: number;
  sizeAlamat?: number;
  sizeFooterSatu?: number;
  sizeFooterDua?: number;
  sizeDateTime?: number;
  sizeTeksNomorAntrian?: number;
  sizeNomorAntrian?: number;
  sizeLayanan?: number;
}

export interface MonitorSettings {
  runningText: string;
  logoTitle: string;
  videoUrl: string; // e.g. youtube video ID or URL
  voiceLanguage: string; // Speech synthesis language code
  voiceRate: number; // voice speed
  colorCardA: string; // Hex color for counter A card
  colorCardB: string; // Hex color for counter B card
  colorBackground: string; // Screen background color code
  colorHeaderLeft: string; // Left header accent color
  colorHeaderRight: string; // Right header accent color
  colorText: string; // Global monitor text color
  nameAntrianA: string; // Name for Group A category
  nameAntrianB: string; // Name for Group B category
  textSizeRunning: number; // Font size of marquee text
  videoSourceType?: "youtube" | "local"; // Choice of video source
  localVideoName?: string; // Local video file name for display
  textHeaderLeft?: string; // Main text next to logo (default "PT PLN (Persero)")
  textHeaderSubtext?: string; // Subtext next to logo (default "ULP Mantingan")
  textBottomLabel?: string; // Running text label (default "INFO REKREASI")
  colorBottomBg?: string; // Running text background color (default "#FBBF24")
  colorBottomText?: string; // Running text text color (default "#090d16")
  videoUrls?: string[]; // Array of video links/IDs
  layoutMode?: "normal" | "video-only"; // "normal" multi-panel or "video-only" full screen video layout
  videoVolume?: number; // Volume for video source (0 - 100)
  voiceVolume?: number; // Volume for announcement voice (0 - 100)
  textSizeHeaderLeft?: number; // Font size of text header left (main brand, px)
  textSizeHeaderSubtext?: number; // Font size of text header subtext (unit, px)
  textSizeCardText?: number; // Font size of texts inside queue counter cards (px)
  textSizeBottomLabel?: number; // Font size of bottom marquee left label (px)
  logoSize?: number; // Logo image size in px (defaults to 44 or similar)
  textSizeClock?: number; // Font size of the digital clock (px)
  textClockTitle?: string; // Title text shown below/around clock (defaults to "JAM BUKA LAYANAN KAMI")
  textSizeClockTitle?: number; // Font size of the clock title text (px)
  textSizeDayDate?: number; // Font size of day and date text (px)
  clockFormatTemplate?: "HH.mm.ss" | "HH:mm:ss" | "HH.mm" | "HH:mm" | "HH.mm WIB"; // Selected clock format template
  logoUrl?: string; // Custom image logo url / base64 data URL
  colorClock?: string; // Digit text color for the clock (e.g. "#00D2FF")
  colorClockTitle?: string; // Subtitle text color (e.g., "#FBBF24")
  colorDayDate?: string; // Day Date text color (e.g. "#FFFFFF")
  slideImages?: string[]; // Up to 10 custom slide images for "Mode Gambar / Saver"
  textSizeCardHeader?: number; // Font size of card header (loket name) in px
  textSizeCardSubtitle?: number; // Font size of card subtitle ("NOMOR ANTRIAN") in px
  textSizeCardNumber?: number; // Font size of card number (e.g., A2) in px
  textSizeCardStatus?: number; // Font size of card status (e.g., MENUNGGU) in px
  colorCardHeader?: string; // Color of card header (loket name) text
  colorCardSubtitle?: string; // Color of card subtitle ("NOMOR ANTRIAN") text
  colorCardNumber?: string; // Color of card number text
  colorCardStatus?: string; // Color of card status text
  colorCardStatusCalling?: string; // Color of status when 'SEDANG DIPANGGIL'
  colorCardStatusWaiting?: string; // Color of status when 'MENUNGGU'
  colorCardStatusCompleted?: string; // Color of status when 'SELESAI'
  weatherRegion?: string; // Custom region text (e.g. "Ngawi" or "Mantingan")
  textSizeWeather?: number; // Size of weather status text
  textSizeRegion?: number; // Size of weather region/location text
  colorWeatherText?: string; // Color code for weather text
  colorWeatherTemp?: string; // Color code for temperature text
  colorWeatherRegion?: string; // Color code for region text
}

// Backend Server Types
export type TicketStatus = "waiting" | "calling" | "serving" | "completed" | "skipped";
export type ServiceCategory = "A" | "B" | "C";

export interface QueueTicket {
  id: string;
  numero: number;
  ticketCode: string;
  category: ServiceCategory;
  status: TicketStatus;
  counterId: number | null;
  timestamp: string;
  calledTime: string | null;
}

export interface CounterState {
  id: number;
  name: string;
  active: boolean;
  currentTicketId: string | null;
  currentTicketCode: string | null;
  servedCount: number;
}

// Indonesian Legacy Type Aliases for code-level compatibility
export type Pengguna = User & {
  nama?: string; // some templates expect .nama instead of .name
  loketId?: string;
  loketNama?: string;
};

export interface Loket {
  id: string;
  name: string;
  prefix: string;
  status?: string;
  layananIds?: string[];
  service_name?: string;
  serviceName?: string;
  is_active?: boolean;
  isActive?: boolean;
  petugasId?: string | null;
  petugasNama?: string | null;
  currentNumber?: number;
  currentCallingId?: string | null;
}

export type Layanan = {
  id: string;
  name: string;
  nama?: string;
  prefix: string;
  kode?: string;
  deskripsi?: string;
};

export interface Antrian {
  id: string;
  number: number;
  nomor?: string;
  nomorUrut?: number;
  formattedNumber: string;
  prefix: string;
  status: "menunggu" | "memanggil" | "selesai" | "dilewati" | "waiting" | "calling" | "completed" | "skipped";
  createdAt: string;
  created_at?: string;
  layananId: string;
  layananNama: string;
  layananKode?: string;
  namaPelanggan?: string;
  noHp?: string;
  keperluan?: string;
  calledAt?: string;
  completedAt?: string;
  loketId?: string;
  loketName?: string;
  pelangganNama?: string;
  pelangganId?: string;
  pelangganAlamat?: string;
  pelangganHp?: string;
  pelangganKeterangan?: string;
}

export type PrinterSettings = PrintSettings;



