import { QueueItem, PrintSettings } from "../types";

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

  // 2. Format localized INDONESIA timestamp
  let formattedDateTime = "";
  try {
    const d = new Date(item.createdAt);
    const dateStr = d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const timeStr = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    formattedDateTime = `${dateStr} ${timeStr} WIB`;
  } catch {
    formattedDateTime = "--/--/---- --:-- WIB";
  }

  // Determine paper width styles based on setting: 58mm or 80mm content
  const is80mm = safeSettings.paperWidth === "80mm";
  const contentWidth = is80mm ? "72mm" : "48mm";

  // Format queue sequence direct without spaces, e.g. "A14"
  const queueNumber = item.formattedNumber || "";

  // Compute logo layout position: default back-compatibility
  const logoPos = safeSettings.logoPosition || (safeSettings.showLogo ? "top" : "none");

  // CSS Helpers for variable styles
  const getStyleCSS = (styleVal: string | undefined, defaultStyle: string) => {
    const style = styleVal || defaultStyle;
    if (style === "bold") return "font-weight: bold; font-style: normal;";
    if (style === "italic") return "font-weight: normal; font-style: italic;";
    if (style === "bold-italic") return "font-weight: bold; font-style: italic;";
    return "font-weight: normal; font-style: normal;";
  };

  const getHeaderSizeCSS = (sizeVal: string | undefined) => {
    const size = sizeVal || "10";
    if (size === "normal") return "font-size: 9.5pt;";
    if (size === "large") return "font-size: 11pt;";
    if (size === "xlarge") return "font-size: 13pt;";
    const num = parseFloat(size);
    if (!isNaN(num)) return `font-size: ${num}pt;`;
    return "font-size: 10pt;";
  };

  const getSubHeaderSizeCSS = (sizeVal: string | undefined) => {
    const size = sizeVal || "8.5";
    if (size === "normal") return "font-size: 7.5pt;";
    if (size === "large") return "font-size: 9pt;";
    const num = parseFloat(size);
    if (!isNaN(num)) return `font-size: ${num}pt;`;
    return "font-size: 8.5pt;";
  };

  const getFooterSizeCSS = (sizeVal: string | undefined) => {
    const size = sizeVal || "9";
    if (size === "normal") return "font-size: 7.5pt;";
    if (size === "large") return "font-size: 9pt;";
    const num = parseFloat(size);
    if (!isNaN(num)) return `font-size: ${num}pt;`;
    return "font-size: 9pt;";
  };

  const getDateTimeSizeCSS = (sizeVal: string | undefined) => {
    const size = sizeVal || "8.5";
    if (size === "normal") return "font-size: 7.5pt;";
    if (size === "large") return "font-size: 9.5pt;";
    const num = parseFloat(size);
    if (!isNaN(num)) return `font-size: ${num}pt;`;
    return "font-size: 8.5pt;";
  };

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
          width: 100%;
          max-width: 100%;
          margin: 0;
          padding: 3mm 2mm;
          background-color: #fff;
          color: #000;
          font-family: Arial, Helvetica, sans-serif, system-ui;
          font-size: 8pt;
          line-height: 1.35;
          text-align: center;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        /* Elements styling */
        .header-container {
          display: flex;
          width: 100%;
          margin-bottom: 2mm;
        }

        .header-container.layout-side {
          flex-direction: row;
          align-items: center;
          justify-content: flex-start;
          text-align: left;
        }

        .header-container.layout-top {
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          margin-bottom: 3mm;
        }

        .header-container.layout-none {
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .logo-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .header-container.layout-side .logo-box {
          margin-right: 2.5mm;
          margin-bottom: 0;
        }

        .header-container.layout-top .logo-box {
          margin-right: 0;
          margin-bottom: 1.5mm;
        }

        .pln-symbol {
          width: 20px;
          height: 26px;
          background-color: #FFE600 !important;
          border-radius: 1px;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid #000;
        }

        .pln-thunderbolt {
          font-size: 11pt;
          color: #E30613;
          font-weight: bold;
          line-height: 1;
        }

        .pln-waves {
          position: absolute;
          bottom: 2px;
          left: 1px;
          right: 1px;
          height: 4px;
          display: flex;
          flex-direction: column;
          gap: 0.5px;
        }

        .pln-waves .wave {
          height: 1.2px;
          background-color: #005FA2 !important;
          width: 100%;
        }

        .pln-text {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 6.5pt;
          font-weight: 950;
          color: #009FE3 !important;
          letter-spacing: 0.3px;
          margin-top: 1px;
          line-height: 1;
        }

        .header-text-block {
          flex: 1;
          min-width: 0;
        }

        .header-title {
          font-size: 9.5pt;
          font-weight: 900;
          text-transform: uppercase;
        }

        .header-subtitle {
          font-size: 7.5pt;
          color: #333;
          margin-top: 1.5px;
          font-weight: bold;
        }

        .divider {
          border-top: 1px dashed #000;
          margin: 3mm 0;
          height: 0;
          width: 100%;
        }

        .ticket-label {
          font-size: 7.5pt;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 1mm;
        }

        .ticket-number {
          font-size: 34pt;
          font-weight: 900;
          line-height: 1;
          margin: 1mm 0;
        }

        .service-badge {
          font-size: 8pt;
          font-weight: bold;
          text-transform: uppercase;
          color: #000;
          display: block;
          margin-top: 1.5mm;
          margin-bottom: 2mm;
          width: 100%;
          letter-spacing: 0.3px;
        }

        .timestamp-box {
          font-size: 7.5pt;
          text-align: center;
          margin-top: 3.5mm;
          font-weight: bold;
        }

        .customer-box {
          border: 1px solid #000;
          padding: 1.5mm;
          margin-top: 3.5mm;
          text-align: left;
          font-size: 7pt;
          border-radius: 2px;
        }

        .customer-title {
          font-weight: 900;
          border-bottom: 1px dashed #000;
          padding-bottom: 0.5mm;
          margin-bottom: 1mm;
          font-size: 7pt;
          text-align: center;
          letter-spacing: 0.5px;
        }

        .customer-box div {
          display: flex;
          margin-bottom: 0.5px;
        }

        .customer-box .label {
          width: 48px;
          color: #222;
          font-weight: bold;
          flex-shrink: 0;
        }

        .customer-box .val {
          font-weight: bold;
          word-break: break-all;
        }

        .footer-message {
          font-size: 7.5pt;
          font-style: italic;
          margin-top: 4mm;
          line-height: 1.4;
          padding: 0 1mm;
        }

        .credit {
          font-size: 6.5pt;
          font-weight: bold;
          letter-spacing: 0.5px;
          margin-top: 3.5mm;
          text-transform: uppercase;
        }

        /* Fake Barcode lines for POS realism */
        .barcode {
          display: flex;
          justify-content: center;
          height: 12px;
          margin-top: 3mm;
          opacity: 0.85;
          overflow: hidden;
        }

        .barcode-bar {
          background-color: #000;
          height: 100%;
        }

        .truncate-lines {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      </style>
    </head>
    <body onload="checkAndPrint()">
      <script>
        function checkAndPrint() {
          var img = document.querySelector('.logo-box img');
          if (img && !img.complete) {
            img.onload = function() {
              window.focus();
              window.print();
            };
            img.onerror = function() {
              window.focus();
              window.print();
            };
            setTimeout(function() {
              window.focus();
              window.print();
            }, 800);
          } else {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 150);
          }
        }
      </script>

      <div class="header-container ${logoPos === 'top' ? 'layout-top' : logoPos === 'side' ? 'layout-side' : 'layout-none'}">
        ${logoPos !== "none" ? (
          safeSettings.logoType === "custom" && safeSettings.customLogo ? `
          <div class="logo-box">
            <img src="${safeSettings.customLogo}" style="max-width: 40px; max-height: 48px; min-width: 25px; min-height: 25px; object-fit: contain; display: block;" />
          </div>
          ` : `
          <div class="logo-box">
            <div class="pln-symbol">
              <div class="pln-thunderbolt">⚡</div>
              <div class="pln-waves">
                <div class="wave"></div>
                <div class="wave"></div>
              </div>
            </div>
            <div class="pln-text">PLN</div>
          </div>
          `
        ) : ""}
        <div class="header-text-block">
          <div class="header-title" style="${getHeaderSizeCSS(safeSettings.headerSize)} ${getStyleCSS(safeSettings.headerStyle, "bold")}">
            ${safeSettings.headerText || "PT PLN (PERSERO)"}
          </div>
          <div class="header-subtitle" style="${getSubHeaderSizeCSS(safeSettings.subHeaderSize)} ${getStyleCSS(safeSettings.subHeaderStyle, "bold")}">
            ${safeSettings.subHeader || "ULP MANTINGAN"}
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <div class="ticket-label">NOMOR ANTREAN ANDA</div>
      <div class="ticket-number">${queueNumber}</div>
      <div class="service-badge">${item.serviceName}</div>

      <div class="divider"></div>

      <div class="timestamp-box" style="${getDateTimeSizeCSS(safeSettings.dateTimeSize)} ${getStyleCSS(safeSettings.dateTimeStyle, "normal")}">
        <div>${formattedDateTime}</div>
      </div>

      <p class="footer-message" style="${getFooterSizeCSS(safeSettings.footerSize)} ${getStyleCSS(safeSettings.footerStyle, "italic")}">
        "${safeSettings.footerText || "Terima kasih atas kunjungan anda. Jauhi bahaya listrik demi keselamatan keluarga tercinta."}"
      </p>

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
