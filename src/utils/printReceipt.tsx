import { QueueItem, PrintSettings } from "../types";
import { blePrinterManager } from "./blePrinter";

/**
 * Utility function to handle real physical printing to thermal printers
 * by dynamically generating and printing in a clean, isolated iframe.
 */
export function printThermalReceipt(item: QueueItem, printSettings: PrintSettings) {
  const defaultPrint = {
    headerText: "PLN ULP MANTINGAN",
    subHeader: "Jl. Raya Mantingan, Ngawi, Jawa Timur",
    footerText: "Terima kasih telah menggunakan pelayanan kami. Jauhi bahaya listrik untuk keluarga tercinta.",
    showLogo: true,
    paperWidth: "58mm",
  };

  const safeSettings = { ...defaultPrint, ...(printSettings || {}) };

  // 0. Check if Direct Web Bluetooth Printing is connected and configured
  if (safeSettings.useWebBluetooth) {
    if (blePrinterManager.isConnected()) {
      blePrinterManager.printTicketDirect(item, safeSettings)
        .catch((e) => {
          console.error("Direct BLE print error, falling back:", e);
        });
      return;
    }
  }

  // Format localized INDONESIA timestamp
  let formattedDateTime = "";
  try {
    const d = new Date(item.createdAt);
    const dateStr = d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const timeStr = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    formattedDateTime = `${dateStr} ${timeStr} WIB`;
  } catch {
    formattedDateTime = "--/--/---- --:-- WIB";
  }

  // Format queue sequence direct without spaces, e.g. "A14"
  const queueNumber = item.formattedNumber || "";

  // Check if printing is routed to RawBT direct silent printing app
  if (safeSettings.useRawBtApp) {
    let bpStr = "";
    bpStr += `${safeSettings.headerText || "PT PLN (PERSERO)"}\n`;
    if (safeSettings.subHeader) bpStr += `${safeSettings.subHeader}\n`;
    if (safeSettings.alamat) bpStr += `${safeSettings.alamat}\n`;
    bpStr += `--------------------------------\n\n`;
    bpStr += `NOMOR ANTRIAN ANDA\n\n`;
    bpStr += `${queueNumber}\n\n`;
    bpStr += `${item.serviceName}\n`;
    bpStr += `--------------------------------\n`;
    bpStr += `Waktu: ${formattedDateTime}\n`;
    bpStr += `--------------------------------\n`;
    if (safeSettings.footerSatu) bpStr += `${safeSettings.footerSatu}\n`;
    if (safeSettings.footerDua) bpStr += `${safeSettings.footerDua}\n`;
    
    bpStr += `\n\n\n\n`;

    const rawbtUrl = `intent:#Intent;scheme=rawbt;package=ru.a410f.gstore.rawbtprinter;S.text=${encodeURIComponent(bpStr)};end`;
    window.location.href = rawbtUrl;
    return;
  }

  // Check if printing is routed to the Android Bluetooth Print companion app
  if (safeSettings.useBluetoothPrintApp) {
    let bpStr = "";

    // 1. Kop Surat (B=1, A=1 for center bold, F=2 for double-width+height or F=0)
    bpStr += `<112>${safeSettings.headerText || "PT PLN (PERSERO)"}\n`;
    if (safeSettings.subHeader) {
      bpStr += `<110>${safeSettings.subHeader}\n`;
    }
    if (safeSettings.alamat) {
      bpStr += `<010>${safeSettings.alamat}\n`;
    }
    bpStr += `<010>--------------------------------\n`;

    // 2. Title label (Bold, Center)
    bpStr += `<110>NOMOR ANTRIAN ANDA\n\n`;

    // 3. Queue Ticket Number (Bold, Center, Double Height + Width)
    bpStr += `<112>${queueNumber}\n\n`;

    // 4. Category / Service Name (Bold, Center, Normal)
    bpStr += `<110>${item.serviceName}\n`;
    bpStr += `<010>--------------------------------\n`;

    // 5. Timestamp details
    bpStr += `<000>Waktu: ${formattedDateTime}\n`;
    bpStr += `<010>--------------------------------\n`;

    // 6. Footer (Center, Normal size)
    if (safeSettings.footerSatu) {
      bpStr += `<010>${safeSettings.footerSatu}\n`;
    }
    if (safeSettings.footerDua) {
      bpStr += `<010>${safeSettings.footerDua}\n`;
    } else if (safeSettings.footerText && safeSettings.footerText !== "Terima kasih...") {
      bpStr += `<010>${safeSettings.footerText}\n`;
    }

    // 7. QR code verification (Optional)
    if (safeSettings.cetakQr) {
      bpStr += `\n<QR>1#40#${queueNumber}\n`;
      bpStr += `<010>PLN MOBILE QUICK SCAN\n`;
    }

    // Newlines to feed physical paper past cutter slot
    bpStr += `\n\n\n\n`;

    // Standard Android Intent syntax targeted direct to Bluetooth Print package
    const intentUrl = `intent:#Intent;action=android.intent.action.SEND;type=text/plain;S.android.intent.extra.TEXT=${encodeURIComponent(bpStr)};package=mate.bluetoothprint;end`;
    
    window.location.href = intentUrl;
    return;
  }

  // 1. Create a dynamic hidden iframe for clean printing isolation
  const iframeId = "invisible-thermal-printer-iframe";
  let iframe = document.getElementById(iframeId) as HTMLIFrameElement;
  
  if (iframe) {
    document.body.removeChild(iframe);
  }
  
  iframe = document.createElement("iframe") as HTMLIFrameElement;
  iframe.id = iframeId;
  iframe.style.position = "absolute";
  iframe.style.left = "-9999px";
  iframe.style.top = "-9999px";
  iframe.style.width = "280px"; // Healthy pixel basis for 58mm / 80mm print engines
  iframe.style.height = "600px";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    console.error("Could not obtain iframe document context for printing.");
    return;
  }

  // Determine paper width styles based on setting: 58mm or 80mm content
  const is80mm = safeSettings.paperWidth === "80mm";
  const contentWidth = is80mm ? "72mm" : "48mm";

  // Build customer details block - removed as requested
  const customerDetailsHTML = "";

  // 3. Populate pristine receipt HTML
  const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Cetak Antrean - ${item.formattedNumber}</title>
      <style>
        /* CSS reset & optimizations for physical thermal paper printing */
        @page {
          margin: 0;
          size: auto;
        }
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html, body {
          height: max-content;
          overflow: hidden;
        }

        body {
          width: ${contentWidth};
          max-width: 100%;
          margin: 0 auto;
          padding: 3mm 1mm;
          background-color: #fff;
          color: #000;
          font-family: Arial, Helvetica, sans-serif, system-ui;
          font-size: 8.5px;
          line-height: 1.35;
          text-align: center;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        /* Elements styling */
        .header-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          width: 100%;
          margin-bottom: 2mm;
        }

        .logo-box {
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #005B9C !important;
          color: #FFE600 !important;
          border-radius: 8px;
          margin-bottom: 2mm;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        .pln-thunderbolt {
          font-size: 80%;
          font-weight: bold;
          line-height: 1;
        }

        .header-text-block {
          width: 100%;
        }

        .header-title {
          font-weight: bold;
          line-height: 1.25;
          margin-bottom: 1px;
        }

        .header-subtitle {
          font-weight: bold;
          line-height: 1.2;
          color: #222;
        }

        .divider {
          border-top: 1px dashed #000;
          margin: 2.5mm 0;
          height: 0;
          width: 100%;
        }

        .ticket-label {
          color: #444;
          font-weight: bold;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }

        .ticket-number {
          font-weight: 900;
          line-height: 1;
          margin: 2mm 0;
        }

        .service-badge {
          font-weight: bold;
          color: #000;
          display: block;
          margin-top: 1mm;
          margin-bottom: 1mm;
          width: 100%;
        }

        .timestamp-box {
          text-align: center;
          margin-top: 2.5mm;
          font-weight: bold;
        }

        .footer-message {
          line-height: 1.35;
          margin-top: 3mm;
          font-weight: normal;
        }
      </style>
    </head>
    <body onload="window.focus(); setTimeout(function(){ window.print(); }, 200);">

      <div class="header-container">
        ${safeSettings.showLogo !== false ? (
          safeSettings.logoType === "custom" && safeSettings.customLogo ? `
          <div class="logo-box-wrapper" style="margin-bottom: 2mm; display: flex; justify-content: center; align-items: center; width: 100%;">
            <img src="${safeSettings.customLogo}" style="max-height: ${safeSettings.logoSize || 48}px; max-width: ${safeSettings.logoSize || 48}px; object-fit: contain; filter: grayscale(100%) contrast(200%);" />
          </div>
          ` : `
          <div class="logo-box" style="width: ${safeSettings.logoSize || 48}px; height: ${safeSettings.logoSize || 48}px;">
            <span class="pln-thunderbolt">⚡</span>
          </div>
          `
        ) : ""}
        <div class="header-text-block">
          <div class="header-title" style="font-size: ${safeSettings.sizeNamaInstansi || 14}px;">
            ${safeSettings.namaInstansi || safeSettings.headerText || "PT PLN (Persero) UP3 Madiun"}
          </div>
          <div class="header-subtitle" style="font-size: ${safeSettings.sizeCabang || 11}px;">
            ${safeSettings.cabang || safeSettings.subHeader || "ULP Mantingan"}
          </div>
          ${safeSettings.alamat ? `
          <div style="font-size: ${safeSettings.sizeAlamat || 8}px; color: #444; margin-top: 1px;">
            ${safeSettings.alamat}
          </div>
          ` : ""}
        </div>
      </div>

      <div class="divider"></div>

      <div class="ticket-label" style="font-size: ${safeSettings.sizeTeksNomorAntrian || 9}px;">NOMOR ANTRIAN ANDA</div>
      <div class="ticket-number" style="font-size: ${safeSettings.sizeNomorAntrian || 40}px;">${queueNumber}</div>
      <div class="service-badge" style="font-size: ${safeSettings.sizeLayanan || 10}px;">${item.serviceName}</div>

      <div class="divider"></div>

      <div class="timestamp-box" style="font-size: ${safeSettings.sizeDateTime || 8}px;">
        <div>Waktu: ${formattedDateTime} WIB</div>
      </div>

      <div class="divider"></div>

      <p class="footer-message" style="font-size: ${safeSettings.sizeFooterSatu || 8}px; font-weight: bold;">
        ${safeSettings.footerSatu || "Terima kasih atas kunjungan anda."}
      </p>
      ${safeSettings.showFooterDua !== false && safeSettings.footerDua ? `
      <p class="footer-message" style="font-size: ${safeSettings.sizeFooterDua || 8}px; color: #333; margin-top: 1.5mm;">
        ${safeSettings.footerDua}
      </p>
      ` : ""}

    </body>
    </html>
  `;

  doc.open();
  doc.write(receiptHTML);
  doc.close();

  // 4. Hook on afterprint to automatically recycle the iframe element from DOM
  setTimeout(() => {
    try {
      const parentFrame = document.getElementById(iframeId);
      if (parentFrame) {
        document.body.removeChild(parentFrame);
      }
    } catch (e) {
      console.warn("Iframe cleanup was skipped or interrupted", e);
    }
  }, 60000); // Remove after 1 minute of printing window lifespan safely
}
