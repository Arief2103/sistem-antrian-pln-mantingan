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
  headerText: string;
  subHeader: string;
  footerText: string;
  showLogo: boolean;
  paperWidth: string; // e.g. "58mm", "80mm"
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

