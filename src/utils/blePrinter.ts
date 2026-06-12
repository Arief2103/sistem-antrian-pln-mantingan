/**
 * Helper utility to manage native Web Bluetooth integration for thermal printers
 * allowing true one-click/direct physical printing without any intermediate print dialogs or app-switching.
 */

let deviceConn: any = null;
let printerCharacteristic: any = null;
let isConnecting = false;

// Standard Bluetooth thermal printer profiles
const PRINTER_SERVICE_UUIDS = [
  "000018f0-0000-1000-8000-00805f9b34fb", // Custom POS Service (compatible with 0x18f0 / 18f0)
  "00004953-5343-fe7d-4100-391459762085", // ISSC BLE Service (Very common in cheap PT-210)
  "0000e7e1-0000-1000-8000-00805f9b34fb", // Alternate General Serial/POS Service
  "0000fe01-0000-1000-8000-00805f9b34fb", // FE01 Service (common in generic thermal block)
  "0000ff00-0000-1000-8000-00805f9b34fb"  // FF00 Service (often used by custom printers)
];

const PRINTER_CHAR_UUIDS = [
  "00002af1-0000-1000-8000-00805f9b34fb", // POS characteristic (compatible with 0x2af1 / 2af1)
  "00004953-5343-fe7d-4100-391459762085", // ISSC BLE Characteristic
  "0000e7e2-0000-1000-8000-00805f9b34fb", // Alternate Serial TX Characteristic
  "0000fe02-0000-1000-8000-00805f9b34fb", // FE02 Characteristic
  "0000ff01-0000-1000-8000-00805f9b34fb"  // FF01 Custom Serial TX
];

export const blePrinterManager = {
  isConnected() {
    return !!printerCharacteristic && deviceConn?.gatt?.connected;
  },

  getDeviceName() {
    return deviceConn ? deviceConn.name || "Printer Bluetooth" : null;
  },

  async connect() {
    if (isConnecting) return null;
    isConnecting = true;

    try {
      if (!(navigator as any).bluetooth) {
        throw new Error("Web Bluetooth tidak didukung di browser ini. Harap gunakan Google Chrome di Android/PC.");
      }

      console.log("Requesting Bluetooth devices...");
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_SERVICE_UUIDS
      });

      console.log(`Connecting to GATT server on: ${device.name}`);
      const server = await device.gatt.connect();

      // Attempt to locate services
      let service = null;
      for (const uuid of PRINTER_SERVICE_UUIDS) {
        try {
          service = await server.getPrimaryService(uuid);
          if (service) break;
        } catch (e) {
          console.warn(`Service ${uuid} not found, trying next...`, e);
        }
      }

      if (!service) {
        // Fallback: request default characteristic/service if available
        throw new Error("Layanan printer Bluetooth tidak ditemukan. Pastikan printer Anda adalah printer thermal Bluetooth.");
      }

      // Find characteristic
      let characteristic = null;
      for (const uuid of PRINTER_CHAR_UUIDS) {
        try {
          characteristic = await service.getCharacteristic(uuid);
          if (characteristic) break;
        } catch (e) {
          console.warn(`Characteristic ${uuid} not found, trying next...`);
        }
      }

      if (!characteristic) {
        // Try getting first available characteristic
        const characteristics = await service.getCharacteristics();
        if (characteristics.length > 0) {
          characteristic = characteristics[0];
        } else {
          throw new Error("Karakteristik transfer data printer tidak ditemukan.");
        }
      }

      deviceConn = device;
      printerCharacteristic = characteristic;

      // Handle disconnection event
      device.addEventListener("gattserverdisconnected", () => {
        console.warn("Bluetooth printer disconnected!");
        deviceConn = null;
        printerCharacteristic = null;
      });

      isConnecting = false;
      return device.name || "Bluetooth Printer";
    } catch (e: any) {
      isConnecting = false;
      console.error("Bluetooth Connection Error:", e);
      throw e;
    }
  },

  disconnect() {
    try {
      if (deviceConn?.gatt?.connected) {
        deviceConn.gatt.disconnect();
      }
    } catch (e) {
      console.error(e);
    }
    deviceConn = null;
    printerCharacteristic = null;
  },

  /**
   * Sends raw ESC/POS commands over Web Bluetooth in 20-byte chunks
   */
  async printRaw(bytes: Uint8Array) {
    if (!this.isConnected()) {
      throw new Error("Printer tidak tersambung. Harap hubungkan melalui panel pengaturan.");
    }

    const chunkLimit = 20; // BLE typical MTU payload segment limit
    for (let i = 0; i < bytes.length; i += chunkLimit) {
      const chunk = bytes.slice(i, i + chunkLimit);
      try {
        if (typeof printerCharacteristic.writeValueWithoutResponse === "function") {
          await printerCharacteristic.writeValueWithoutResponse(chunk);
        } else if (typeof printerCharacteristic.writeValue === "function") {
          await printerCharacteristic.writeValue(chunk);
        } else {
          throw new Error("Metode transfer data tidak didukung oleh karakteristik printer ini.");
        }
      } catch (e) {
        console.warn("Fallback to writeValue:", e);
        try {
          await printerCharacteristic.writeValue(chunk);
        } catch (err) {
          console.error("Critical Bluetooth write failed:", err);
          throw err;
        }
      }
      // Wait minor delay to avoid packet overflow in hardware queue
      await new Promise(resolve => setTimeout(resolve, 15));
    }
  },

  /**
   * Helper to compile and print standard ESC/POS queue ticket slip directly
   */
  async printTicketDirect(item: any, settings: any) {
    const encoder = new TextEncoder();
    
    // ESC/POS command sequences
    const INIT = new Uint8Array([0x1B, 0x40]);                     // Initialize
    const CENTER = new Uint8Array([0x1B, 0x61, 0x01]);               // Align Center
    const LEFT = new Uint8Array([0x1B, 0x61, 0x00]);                 // Align Left
    const BOLD_ON = new Uint8Array([0x1B, 0x45, 0x01]);              // Bold On
    const BOLD_OFF = new Uint8Array([0x1B, 0x45, 0x00]);             // Bold Off
    const FEED_AND_CUT = new Uint8Array([0x1D, 0x56, 0x41, 0x03]);   // Full cut & feed
    const LINE_SPACING_DEFAULT = new Uint8Array([0x1B, 0x32]);       // Default spacing

    let buffer: number[] = [];

    const pushBytes = (bytes: Uint8Array) => {
      bytes.forEach(b => buffer.push(b));
    };

    const pushText = (text: string) => {
      const encoded = encoder.encode(text);
      encoded.forEach(b => buffer.push(b));
    };

    // Helper to print a line with Carriage Return + Line Feed (CRLF) for thermal compatibility
    const pushLine = (text: string) => {
      pushText(text + "\r\n");
    };

    // Dynamic sizing helper using ESC/POS font size modifier command (GS ! n)
    // Width can be 1 to 4, Height can be 1 to 4
    const setFontSize = (width: number, height: number) => {
      const w = Math.min(4, Math.max(1, width)) - 1;
      const h = Math.min(4, Math.max(1, height)) - 1;
      const sizeByte = (w << 4) | h;
      pushBytes(new Uint8Array([0x1D, 0x21, sizeByte]));
    };

    // Default sizes fallback mapping (from pt/px to ESC/POS multipliers)
    const getEscPosMultiplier = (pxSize: number | undefined, defaultPx: number): number => {
      const val = pxSize !== undefined ? Number(pxSize) : defaultPx;
      if (val >= 36) return 4;
      if (val >= 24) return 3;
      if (val >= 14) return 2;
      return 1;
    };

    // Begin ESC/POS formatting
    pushBytes(INIT);
    pushBytes(LINE_SPACING_DEFAULT);
    pushBytes(CENTER);

    // Optional Centered Logo (Rendered as robust lightning/PLN tag above title)
    if (settings.showLogo !== false) {
      const logoMult = getEscPosMultiplier(settings.logoSize, 48);
      setFontSize(logoMult, logoMult);
      pushBytes(BOLD_ON);
      pushLine("[⚡]");
      pushBytes(BOLD_OFF);
    }

    // Header Instansi (Custom Font Size)
    const instansiMult = getEscPosMultiplier(settings.sizeNamaInstansi, 14);
    setFontSize(instansiMult, instansiMult);
    pushBytes(BOLD_ON);
    pushLine(`${settings.namaInstansi || settings.headerText || "PT PLN (Persero) UP3 Madiun"}`);
    pushBytes(BOLD_OFF);

    // Cabang (Custom Font Size)
    const cabangMult = getEscPosMultiplier(settings.sizeCabang, 11);
    setFontSize(cabangMult, cabangMult);
    if (settings.cabang || settings.subHeader) {
      pushLine(`${settings.cabang || settings.subHeader}`);
    }
    
    // Alamat (Custom Font Size)
    const alamatMult = getEscPosMultiplier(settings.sizeAlamat, 8);
    setFontSize(alamatMult, alamatMult);
    if (settings.alamat) {
      pushLine(`${settings.alamat}`);
    }

    // Divider
    setFontSize(1, 1);
    pushLine("--------------------------------");

    // Teks "NOMOR ANTRIAN ANDA" (Custom Font Size)
    const teksAntrianMult = getEscPosMultiplier(settings.sizeTeksNomorAntrian, 9);
    setFontSize(teksAntrianMult, teksAntrianMult);
    pushBytes(BOLD_ON);
    pushLine("NOMOR ANTRIAN ANDA");
    pushBytes(BOLD_OFF);

    // Actual Queue Number (Large Custom Font Size!)
    const numMult = getEscPosMultiplier(settings.sizeNomorAntrian, 40);
    setFontSize(numMult, numMult);
    pushBytes(BOLD_ON);
    pushLine(`${item.nomor || item.formattedNumber || "A-000"}`);
    pushBytes(BOLD_OFF);

    // Layanan yang dipilih (Custom Font Size)
    const layananMult = getEscPosMultiplier(settings.sizeLayanan, 10);
    setFontSize(layananMult, layananMult);
    pushBytes(BOLD_ON);
    pushLine(`${item.layananNama || item.serviceName || "Layanan PLN"}`);
    pushBytes(BOLD_OFF);

    setFontSize(1, 1);
    pushLine("--------------------------------");

    // Timestamp (Custom Font Size)
    const dateTimeMult = getEscPosMultiplier(settings.sizeDateTime, 8);
    setFontSize(dateTimeMult, dateTimeMult);
    let timeStr = "";
    try {
      const d = new Date(item.created_at || item.createdAt);
      timeStr = d.toLocaleString("id-ID", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      });
    } catch {
      timeStr = new Date().toLocaleString();
    }
    pushLine(`Waktu: ${timeStr} WIB`);
    
    setFontSize(1, 1);
    pushLine("--------------------------------");

    // Catatan Kaki 1 (Custom Font Size)
    const footer1Mult = getEscPosMultiplier(settings.sizeFooterSatu, 8);
    setFontSize(footer1Mult, footer1Mult);
    if (settings.footerSatu) {
      pushLine(`${settings.footerSatu}`);
    }

    // Catatan Kaki 2 (Custom Font Size)
    if (settings.showFooterDua !== false) {
      const footer2Mult = getEscPosMultiplier(settings.sizeFooterDua, 8);
      setFontSize(footer2Mult, footer2Mult);
      if (settings.footerDua) {
        pushLine(`${settings.footerDua}`);
      } else if (settings.footer || settings.footerText) {
        pushLine(`${settings.footer || settings.footerText}`);
      }
    }

    // Space / feed for cutter and print completion
    setFontSize(1, 1);
    const feedCount = settings.feedLines !== undefined ? Number(settings.feedLines) : 1;
    for (let i = 0; i < feedCount; i++) {
      pushLine("");
    }
    pushBytes(FEED_AND_CUT);

    // Write all compiled bytes in one go!
    await this.printRaw(new Uint8Array(buffer));
  }
};
