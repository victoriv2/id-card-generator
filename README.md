# Students Parliament Nigeria — ID Card Generator & Verification System

An identification card generator web application for **Students Parliament Nigeria & Africa**, built with vanilla HTML5, CSS3, and JavaScript.

Designed to produce CR80 standard identification cards with real-time live preview (both Front and Back), dynamic QR code verification, barcode generation, passport image pan/zoom cropping, and high-resolution export (PNG & PDF) or direct print.

---

## 🌟 Key Features

1. **Pixel-Perfect Parliamentary Template**:
   - Deep forest green curved wave banners with rich gold foil borders.
   - Official **Students Parliament Nigeria** crest & seal (`image-1.png`).
   - Official **Prince Umanah Future Leaders Development Foundation** logo (`image-2.png`).
   - High-definition 3D African flag with parliamentary seal on pole (`image-3.png`).
   - Nigerian national flag badge on top right.
   - Subtle security watermark with laurel / wheat wreaths.

2. **Full Dynamic Data Extraction & Customization**:
   - **Bearer Full Name** (e.g. `ADEOLA SEMILORE RODI`)
   - **School / Chapter / Branch** (e.g. `CSGS. GBERIGBE`)
   - **ID Number** (e.g. `SPA/ID/STU/26/061` with 1-click **Auto ID Generator**)
   - **Category / Role** (`STUDENT`, `EXECUTIVE`, `MEMBER`, `OFFICIAL`, `HONORARY`)
   - **Date Issued** and **Valid Until (Expiry Date)**
   - **Status Badge** (`ACTIVE`, `PENDING`, `EXPIRED`)
   - **Passport Photo Upload**:
     - Drag-and-drop or file picker
     - Interactive Zoom slider (50% – 250%)
     - Vertical position adjustment slider for portrait framing
   - **Customizable Back Details (Collapsible)**:
     - Certification disclaimer
     - Police station note
     - Official contact telephone & email
     - Authorized presidential signature & title

3. **Smart Verification Codes**:
   - **Front Side Dynamic QR Code**: Encodes verifiable student credentials.
   - **Back Side Dynamic Barcode**: Code 128 barcode automatically generated from the ID number.

4. **Multi-Mode Preview**:
   - **Side-by-Side View**: Simultaneous live viewing of both the front and back of the card.
   - **3D Flip Card View**: Interactive 3D flip animation to inspect the physical card feel.

5. **High-Resolution Export & Print Options**:
   - **Download Front (PNG)**: Rendered at 3x scale (300 DPI equivalent) for print shop production.
   - **Download Back (PNG)**: Rendered at 3x scale for crisp barcode readability.
   - **Download PDF**: Multi-page PDF matching CR80 standard card specifications (54mm × 85.6mm).
   - **Print Card**: Instant browser print styling with background graphics preserved.

---

## 📁 Project Structure

```text
id-card-generator/
│
├── index.html              # Main application markup & live preview containers
│
├── css/
│   └── style.css           # Styling, CR80 dimensions, animations, print media rules
│
├── js/
│   └── app.js              # Real-time data synchronization, QR/Barcode generation & exports
│
├── lib/                    # Vendor libraries for offline & standalone functionality
│   ├── html2canvas.min.js  # High-DPI canvas capture
│   ├── JsBarcode.all.min.js# Real barcode generation (Code128)
│   ├── jspdf.umd.min.js    # PDF export
│   └── qrcode.min.js       # Dynamic QR code generation
│
├── image/                  # High-resolution template branding assets
│   ├── image-1.png         # Students Parliament official circular seal
│   ├── image-2.png         # Prince Umanah Foundation emblem banner
│   ├── image-3.png         # 3D waving flag on pole
│   ├── laurel-border.svg   # Security laurel watermark pattern
│   ├── nigeria-flag.svg    # National flag badge
│   ├── sample-passport.jpg # Sample demo student portrait
│   └── signature.png       # Presidential authorized signature
│
└── README.md
```

---

## 🚀 Getting Started

No build step or Node.js runtime required! This is a zero-dependency static application that runs directly in any modern web browser.

### Option 1: Direct Local Use
Simply double-click or open `index.html` in your favorite web browser (Google Chrome, Edge, Safari, Firefox).

### Option 2: Local HTTP Server (Optional)
If you prefer running via a local web server:
```bash
# Using Python:
python -m http.server 8000

# Using Node / npx:
npx serve .
```
Then navigate to `http://localhost:8000`.

---

## 🖨️ Printing Recommendations

For printing ID cards on PVC or card stock:
1. Click the **"Print Card"** button or press `Ctrl + P` (`Cmd + P` on Mac).
2. Set Destination to your Card Printer (or "Save as PDF").
3. In print settings, ensure **"Background graphics"** is checked.
4. Set margins to **None** or **Minimum** for exact 1:1 scale output.

---

## 📄 License
Students Parliament Nigeria & Africa. All rights reserved.
