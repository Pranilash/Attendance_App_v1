import os
import pptx
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def build_polished_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Color Tokens (Dark Cybernetic / Institutional Modern Theme matching reference)
    BG_OBSIDIAN = RGBColor(11, 15, 25)       # #0B0F19 (Deepest Charcoal)
    CARD_BG = RGBColor(18, 24, 38)           # #121826 (Sleek Glass Card)
    CARD_BORDER = RGBColor(38, 48, 71)       # #263047 (Subtle Glow Border)
    CARD_BG_ALT = RGBColor(24, 32, 51)       # #182033 (Hover/Accent card)

    TEXT_WHITE = RGBColor(248, 250, 252)     # Slate 50
    TEXT_MUTED = RGBColor(148, 163, 184)     # Slate 400
    TEXT_DIM = RGBColor(100, 116, 139)       # Slate 500

    ACCENT_PURPLE = RGBColor(168, 85, 247)   # Purple 500
    ACCENT_VIOLET = RGBColor(139, 92, 246)   # Violet 500
    ACCENT_CYAN = RGBColor(56, 189, 248)     # Sky 400
    ACCENT_EMERALD = RGBColor(52, 211, 153)  # Emerald 400
    ACCENT_AMBER = RGBColor(251, 191, 36)    # Amber 400
    ACCENT_ROSE = RGBColor(244, 63, 94)      # Rose 500

    IMG_DIR = r"scratch\extracted_images"

    def apply_slide_bg(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_OBSIDIAN
        bg.line.fill.background()
        return bg

    def add_header(slide, tag_text, title_text, subtitle_text=None, tag_color=ACCENT_VIOLET):
        tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.733), Inches(1.3))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        # Tag / Slide Counter
        p_tag = tf.paragraphs[0]
        p_tag.text = tag_text.upper()
        p_tag.font.size = Pt(10.5)
        p_tag.font.bold = True
        p_tag.font.name = "Segoe UI"
        p_tag.font.color.rgb = tag_color
        p_tag.space_after = Pt(4)

        # Main Title
        p_title = tf.add_paragraph()
        p_title.text = title_text
        p_title.font.size = Pt(25)
        p_title.font.bold = True
        p_title.font.name = "Segoe UI"
        p_title.font.color.rgb = TEXT_WHITE
        p_title.space_after = Pt(4)

        # Subtitle
        if subtitle_text:
            p_sub = tf.add_paragraph()
            p_sub.text = subtitle_text
            p_sub.font.size = Pt(12)
            p_sub.font.name = "Segoe UI"
            p_sub.font.color.rgb = TEXT_MUTED

    def add_glass_card(slide, left, top, width, height, border_color=CARD_BORDER, bg_color=CARD_BG):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        if border_color:
            card.line.color.rgb = border_color
            card.line.width = Pt(1.2)
        else:
            card.line.fill.background()
        return card

    # =========================================================================
    # SLIDE 1: TITLE SLIDE (Matches Reference Style & Branding)
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    apply_slide_bg(s1)

    # Decorative large background card
    add_glass_card(s1, Inches(0.8), Inches(0.8), Inches(11.733), Inches(5.9), border_color=RGBColor(45, 55, 78))

    tb1 = s1.shapes.add_textbox(Inches(1.4), Inches(1.3), Inches(10.533), Inches(4.9))
    tf1 = tb1.text_frame
    tf1.word_wrap = True

    p = tf1.paragraphs[0]
    p.text = "VII SEMESTER MAJOR PROJECT  •  MID-SEMESTER REVIEW"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_PURPLE
    p.space_after = Pt(16)

    p = tf1.add_paragraph()
    p.text = "Secure Automated Attendance System"
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = TEXT_WHITE
    p.space_after = Pt(8)

    p = tf1.add_paragraph()
    p.text = "Eliminating Proxies through BLE Proximity, Dynamic QR & Face Authentication"
    p.font.size = Pt(18)
    p.font.color.rgb = ACCENT_CYAN
    p.space_after = Pt(28)

    # Horizontal divider
    p = tf1.add_paragraph()
    p.text = "Strategic Evolution from VI Semester Web Prototype to an Enterprise Multi-Factor Platform"
    p.font.size = Pt(13)
    p.font.color.rgb = TEXT_MUTED
    p.space_after = Pt(36)

    p = tf1.add_paragraph()
    p.text = "Department of Computer Science & Engineering  •  Academic Year 2026–2027"
    p.font.size = Pt(11.5)
    p.font.bold = True
    p.font.color.rgb = RGBColor(148, 163, 184)
    p.space_after = Pt(4)

    p = tf1.add_paragraph()
    p.text = "Team: Radesh Annam | Nithin Sagili | Pranilash Reddy | Ranadeep Yeggoni | Tanishq Kancharla"
    p.font.size = Pt(11)
    p.font.color.rgb = ACCENT_EMERALD

    # =========================================================================
    # SLIDE 2: VI SEM BASE (1/3) — WHY TRADITIONAL SYSTEMS FAIL
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    apply_slide_bg(s2)
    add_header(s2, "VI Sem Foundation (1 of 3)", "Why Traditional Attendance Systems Fail",
               "Real-world systemic flaws observed in manual paper sheets and static digital checkpoints")

    # 4 Visual Problem Cards
    col_w2 = Inches(2.733)
    gap2 = Inches(0.266)
    card_h2 = Inches(4.9)
    top2 = Inches(1.9)

    fails = [
        ("01", "Proxy Manipulation", ACCENT_ROSE, [
            "Roll calls and manual signatures easily forged by peers.",
            "Static QR codes photographed and shared to absent students via chat.",
            "Result: 15–20% inflated proxy attendance records."
        ]),
        ("02", "Instructional Time Loss", ACCENT_AMBER, [
            "Calling roll for 60+ students consumes 10–12 minutes per hour.",
            "Up to 20% of instructional classroom time wasted daily.",
            "Disrupts lecture focus and student engagement."
        ]),
        ("03", "Zero Presence Check", ACCENT_VIOLET, [
            "Biometric wall scanners cause hallway bottlenecks.",
            "Zero continuous verification of who stays in the lecture.",
            "Cannot enforce actual presence inside the classroom."
        ]),
        ("04", "Administrative Burden", ACCENT_CYAN, [
            "Manual data entry into university portals is error-prone.",
            "Lagged attendance visibility for mentors and parents.",
            "Debarment status discovered only after cutoff dates."
        ])
    ]

    for i, (num, title, col, pts) in enumerate(fails):
        x = Inches(0.8) + i * (col_w2 + gap2)
        add_glass_card(s2, x, top2, col_w2, card_h2)

        tb = s2.shapes.add_textbox(x + Inches(0.25), top2 + Inches(0.3), col_w2 - Inches(0.5), card_h2 - Inches(0.6))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = num
        p.font.size = Pt(22)
        p.font.bold = True
        p.font.color.rgb = col
        p.space_after = Pt(6)

        p = tf.add_paragraph()
        p.text = title
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE
        p.space_after = Pt(14)

        for pt in pts:
            p = tf.add_paragraph()
            p.text = f"• {pt}"
            p.font.size = Pt(11)
            p.font.color.rgb = TEXT_MUTED
            p.space_after = Pt(8)

    # =========================================================================
    # SLIDE 3: VI SEM BASE (2/3) — OUR FOUNDATIONAL SOLUTION (4 PILLARS)
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    apply_slide_bg(s3)
    add_header(s3, "VI Sem Foundation (2 of 3)", "Our Solution: Four Foundational Pillars",
               "The core MERN architecture established in VI Semester providing dual-factor verification")

    pillar_w = Inches(2.733)
    pillar_gap = Inches(0.266)
    top3 = Inches(1.9)

    pillars = [
        ("PILLAR 1", "Dynamic Rotating QR", ACCENT_VIOLET, [
            "HMAC-SHA256 Token", "Cryptographically signed QR generated on faculty screen.",
            "14s Auto-Rotation", "Payload expires rapidly; rejects old screenshots.",
            "30s Server Tolerance", "Strict clock skew window prevents replay."
        ]),
        ("PILLAR 2", "Face Authentication", ACCENT_CYAN, [
            "128D Facial Vectors", "Extracted via client-side @vladmandic/face-api.",
            "Cosine & Euclidean Match", "Distance threshold <= 0.6 validates enrolled face.",
            "WebRTC Video Streaming", "Camera stream processed entirely in-browser."
        ]),
        ("PILLAR 3", "Role-Based Control", ACCENT_EMERALD, [
            "Admin Dashboard", "Global department, faculty, and student management.",
            "Faculty Session Console", "One-click session activation and live attendance poll.",
            "Student Portal", "Face registration, QR scanner, and history logs."
        ]),
        ("PILLAR 4", "Automated Records", ACCENT_AMBER, [
            "Instant Sync", "Attendance records committed atomically to MongoDB.",
            "One-Click CSV Export", "Direct spreadsheet generation for university audits.",
            "Zero Manual Log Entry", "Completely eliminates manual paper registers."
        ])
    ]

    for i, (badge, title, col, pts) in enumerate(pillars):
        x = Inches(0.8) + i * (pillar_w + pillar_gap)
        add_glass_card(s3, x, top3, pillar_w, card_h2)

        tb = s3.shapes.add_textbox(x + Inches(0.25), top3 + Inches(0.25), pillar_w - Inches(0.5), card_h2 - Inches(0.5))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = badge
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = col
        p.space_after = Pt(6)

        p = tf.add_paragraph()
        p.text = title
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE
        p.space_after = Pt(16)

        for j in range(0, len(pts), 2):
            h_text = pts[j]
            b_text = pts[j+1]
            p = tf.add_paragraph()
            p.text = f"{h_text}: "
            p.font.bold = True
            p.font.size = Pt(11)
            p.font.color.rgb = RGBColor(226, 232, 240)
            run = p.add_run()
            run.text = b_text
            run.font.bold = False
            run.font.color.rgb = TEXT_MUTED
            p.space_after = Pt(10)

    # =========================================================================
    # SLIDE 4: VI SEM BASE (3/3) — ACHIEVEMENTS & IDENTIFIED LIMITATIONS
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    apply_slide_bg(s4)
    add_header(s4, "VI Sem Foundation (3 of 3)", "Prototype Validation & Residual Gaps",
               "Evaluating VI Sem test success against residual vulnerabilities requiring VII Sem upgrades")

    w4 = Inches(5.666)
    top4 = Inches(1.9)
    h4 = Inches(4.9)

    # Left: What Works (Achievements)
    add_glass_card(s4, Inches(0.8), top4, w4, h4, border_color=RGBColor(34, 197, 94))
    tb = s4.shapes.add_textbox(Inches(1.1), top4 + Inches(0.3), w4 - Inches(0.6), h4 - Inches(0.6))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "PROVEN PROTOTYPE CAPABILITIES (TABLE 4.1)"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = ACCENT_EMERALD
    p.space_after = Pt(12)

    achieve_pts = [
        ("Tamper-Proof QR Signing", "Forged signatures & altered session IDs rejected (100% rejection rate)."),
        ("Biometric Discrimination", "Unregistered or mismatched faces rejected with Euclidean distance > 0.6."),
        ("Concurrency Idempotency", "Atomic challenge nonces & compound indexes guarantee zero double-marking."),
        ("Fast CSV Export", "Attendance reports generated instantly, saving 80% administrative processing time.")
    ]
    for h, b in achieve_pts:
        p = tf.add_paragraph()
        p.text = f"✔  {h}: "
        p.font.bold = True
        p.font.size = Pt(11.5)
        p.font.color.rgb = TEXT_WHITE
        run = p.add_run()
        run.text = b
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(12)

    # Right: Identified Limitations
    add_glass_card(s4, Inches(6.866), top4, w4, h4, border_color=RGBColor(239, 68, 68))
    tb = s4.shapes.add_textbox(Inches(7.166), top4 + Inches(0.3), w4 - Inches(0.6), h4 - Inches(0.6))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "THE 4 RESIDUAL GAPS DRIVING VII SEMESTER"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = ACCENT_ROSE
    p.space_after = Pt(12)

    limit_pts = [
        ("Remote Screen-Share Proxy", "A student in class can live-stream the QR to an absent friend, who scans and authenticates from their room."),
        ("Client-Trusted Liveness", "Backend blindly trusted livenessPassed: true from client, vulnerable to script injection."),
        ("Browser Overhead & Latency", "Standard mobile browsers suffer address bar clipping and slow 6MB neural net weight downloads."),
        ("Reactive Attendance", "Students discover debarment status (<75%) only after cutoff when it is irreversible.")
    ]
    for h, b in limit_pts:
        p = tf.add_paragraph()
        p.text = f"✘  {h}: "
        p.font.bold = True
        p.font.size = Pt(11.5)
        p.font.color.rgb = TEXT_WHITE
        run = p.add_run()
        run.text = b
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(12)

    # =========================================================================
    # SLIDE 5: UPGRADE 01 — PROGRESSIVE WEB APP (PWA ENGINE)
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    apply_slide_bg(s5)
    add_header(s5, "VII Sem Proposed Upgrade (1 of 5)", "Upgrade 01: Progressive Web App (PWA) Engine",
               "Zero-install native standalone mobile deployment with offline neural network weight caching")

    # Left: Core Architecture
    add_glass_card(s5, Inches(0.8), Inches(1.9), Inches(5.666), Inches(4.9))
    
    # Try embedding extracted icon
    icon1_path = os.path.join(IMG_DIR, "slide_6_Picture 12.png")
    if os.path.exists(icon1_path):
        s5.shapes.add_picture(icon1_path, Inches(1.1), Inches(2.2), Inches(0.55), Inches(0.55))

    tb = s5.shapes.add_textbox(Inches(1.8), Inches(2.15), Inches(4.4), Inches(4.4))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "STANDALONE SHELL & CACHING"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_PURPLE
    p.space_after = Pt(14)

    pwa_pts = [
        ("Vite PWA & Workbox", "Integrates vite-plugin-pwa with auto-updating Service Worker."),
        ("Offline Model Pre-Cache", "CacheFirst strategy for @vladmandic/face-api weights (~6MB). Download once, cache locally for 30 days."),
        ("Fullscreen Standalone UI", "Eliminates browser URL bar; optimizes mobile viewport for camera capture."),
        ("Zero Store Friction", "Instant home screen installation on Android, iOS & Desktop without app store fees.")
    ]
    for h, b in pwa_pts:
        p = tf.add_paragraph()
        p.text = f"• {h}: "
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_WHITE
        run = p.add_run()
        run.text = b
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(10)

    # Right: Operational Verification
    add_glass_card(s5, Inches(6.866), Inches(1.9), Inches(5.666), Inches(4.9))
    tb = s5.shapes.add_textbox(Inches(7.166), Inches(2.15), Inches(5.066), Inches(4.4))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "IMPLEMENTATION STATUS: BUILT & LIVE"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_EMERALD
    p.space_after = Pt(14)

    pwa_status = [
        ("Model Load Latency", "Dropped from ~3.8s over 4G to <120ms from local CacheStorage."),
        ("Active Service Worker", "dist/manifest.webmanifest and dist/sw.js generated cleanly in production build."),
        ("One-Tap Install UI", "InstallPwaButton component active on Login and Dashboard views."),
        ("Mobile OS Compatibility", "Verified on Android (Chrome home screen install) and iOS (Safari standalone).")
    ]
    for h, b in pwa_status:
        p = tf.add_paragraph()
        p.text = f"✔  {h}: "
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_WHITE
        run = p.add_run()
        run.text = b
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(10)

    # =========================================
    # SLIDE 6: UPGRADE 02 — BLE PROXIMITY GUARD
    # =========================================
    s6 = prs.slides.add_slide(blank_layout)
    apply_slide_bg(s6)
    add_header(s6, "VII Sem Proposed Upgrade (2 of 5)", "Upgrade 02: BLE Proximity Guard",
               "Hardware classroom boundary enforcement to permanently eradicate remote screen-share proxies")

    add_glass_card(s6, Inches(0.8), Inches(1.9), Inches(5.666), Inches(4.9))
    icon2_path = os.path.join(IMG_DIR, "slide_6_Picture 17.png")
    if os.path.exists(icon2_path):
        s6.shapes.add_picture(icon2_path, Inches(1.1), Inches(2.2), Inches(0.55), Inches(0.55))

    tb = s6.shapes.add_textbox(Inches(1.8), Inches(2.15), Inches(4.4), Inches(4.4))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "ROOM BOUNDARY ENFORCEMENT"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN
    p.space_after = Pt(14)

    ble_pts = [
        ("The Remote Proxy Attack", "Face recognition verifies WHO is scanning, but NOT WHERE they are physically located."),
        ("Classroom BLE Transmitter", "Faculty laptop or a $4 ESP32 beacon broadcasts a rotating ephemeral Service UUID."),
        ("Web Bluetooth Scan", "Student PWA scans via navigator.bluetooth upon reading the QR code."),
        ("Signal Strength Filter", "Received Signal Strength Indicator (RSSI) must measure >= -75 dBm (5-8m radius).")
    ]
    for h, b in ble_pts:
        p = tf.add_paragraph()
        p.text = f"• {h}: "
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_WHITE
        run = p.add_run()
        run.text = b
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(10)

    # Right: Cryptographic Binding
    add_glass_card(s6, Inches(6.866), Inches(1.9), Inches(5.666), Inches(4.9))
    tb = s6.shapes.add_textbox(Inches(7.166), Inches(2.15), Inches(5.066), Inches(4.4))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "SECURITY GUARANTEES"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_EMERALD
    p.space_after = Pt(14)

    ble_guar = [
        ("Screen-Share Proof", "Students in dorms cannot receive Bluetooth RF signals; proxy streaming is 100% neutralized."),
        ("Cryptographic Proof Token", "Student submits { beaconToken, rssi, detectedAt } alongside QR scan."),
        ("Challenge Release Gate", "Backend validates BLE proof prior to issuing facial recognition challenge."),
        ("Soft Geofence Fallback", "Classroom GPS / Wi-Fi BSSID validation available for devices without Web Bluetooth.")
    ]
    for h, b in ble_guar:
        p = tf.add_paragraph()
        p.text = f"✔  {h}: "
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_WHITE
        run = p.add_run()
        run.text = b
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(10)

    # ==========================================================
    # SLIDE 7: UPGRADE 03 — SERVER-VERIFIED BIOMETRIC LIVENESS
    # ==========================================================
    s7 = prs.slides.add_slide(blank_layout)
    apply_slide_bg(s7)
    add_header(s7, "VII Sem Proposed Upgrade (3 of 5)", "Upgrade 03: Server-Verified Biometric Liveness",
               "Replacing client-side trust with dynamic challenge-response sequences and 68-point landmark math")

    add_glass_card(s7, Inches(0.8), Inches(1.9), Inches(5.666), Inches(4.9))
    icon3_path = os.path.join(IMG_DIR, "slide_6_Picture 22.png")
    if os.path.exists(icon3_path):
        s7.shapes.add_picture(icon3_path, Inches(1.1), Inches(2.2), Inches(0.55), Inches(0.55))

    tb = s7.shapes.add_textbox(Inches(1.8), Inches(2.15), Inches(4.4), Inches(4.4))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "CHALLENGE-RESPONSE PROTOCOL"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_VIOLET
    p.space_after = Pt(14)

    liv_pts = [
        ("Randomized Action Nonce", "Server generates unpredictable sequence: e.g., ['turnLeft_30deg', 'blink_twice', 'smile']."),
        ("Single-Use Temporal Window", "Strict 4.0s expiration prevents replaying pre-rendered deepfakes or photos."),
        ("Dynamic Guidance UI", "Student UI renders animated prompts matching the server's real-time action request."),
        ("Zero Client Boolean Trust", "Eliminates vulnerable livenessPassed: true; requires raw geometric transition metrics.")
    ]
    for h, b in liv_pts:
        p = tf.add_paragraph()
        p.text = f"• {h}: "
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_WHITE
        run = p.add_run()
        run.text = b
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(10)

    # Right: Mathematical Formulations
    add_glass_card(s7, Inches(6.866), Inches(1.9), Inches(5.666), Inches(4.9))
    tb = s7.shapes.add_textbox(Inches(7.166), Inches(2.15), Inches(5.066), Inches(4.4))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "MATHEMATICAL LANDMARK VALIDATION"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_EMERALD
    p.space_after = Pt(14)

    math_pts = [
        ("Eye Aspect Ratio (EAR)", "EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||). Server verifies dip < 0.20 followed by return to baseline."),
        ("Head Yaw Euler Dynamics", "Ratio between nose tip (p31) and outer jaw contours (p1, p17). Server verifies monotonic displacement >= 25 deg."),
        ("Temporal Constraints", "Action transition delta verified: 1.5s <= delta_t <= 4.0s. Instant injection attacks rejected."),
        ("Anti-Spoofing Defense", "Prevents 2D printed photo attacks, tablet replay videos, and 3D silicone mask fraud.")
    ]
    for h, b in math_pts:
        p = tf.add_paragraph()
        p.text = f"✔  {h}: "
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_WHITE
        run = p.add_run()
        run.text = b
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(10)

    # =========================================================================
    # SLIDE 8: UPGRADE 04 — PREDICTIVE DEBARMENT ENGINE
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    apply_slide_bg(s8)
    add_header(s8, "VII Sem Proposed Upgrade (4 of 5)", "Upgrade 04: Predictive Debarment Engine",
               "Proactive cutoff forecasting and Debarment Risk Index (DRI) to prevent attendance debarment")

    add_glass_card(s8, Inches(0.8), Inches(1.9), Inches(5.666), Inches(4.9))
    icon4_path = os.path.join(IMG_DIR, "slide_6_Picture 27.png")
    if os.path.exists(icon4_path):
        s8.shapes.add_picture(icon4_path, Inches(1.1), Inches(2.2), Inches(0.55), Inches(0.55))

    tb = s8.shapes.add_textbox(Inches(1.8), Inches(2.15), Inches(4.4), Inches(4.4))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "MATHEMATICAL DRI MODEL"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_AMBER
    p.space_after = Pt(14)

    dri_pts = [
        ("Remaining Sessions", "N_rem = Total_Planned_Lectures - Conducted_Lectures."),
        ("Max Achievable %", "Max% = ((Attended_Lectures + N_rem) / Total_Planned) * 100."),
        ("Required Sessions", "N_req = max(0, ceil(0.75 * Total_Planned) - Attended_Lectures)."),
        ("Debarment Risk Index", "DRI = 100% if Max% < 75% (Mathematically Debarred). Otherwise: DRI = (N_req / N_rem) * 100.")
    ]
    for h, b in dri_pts:
        p = tf.add_paragraph()
        p.text = f"• {h}: "
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_WHITE
        run = p.add_run()
        run.text = b
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(10)

    # Right: Institutional Value
    add_glass_card(s8, Inches(6.866), Inches(1.9), Inches(5.666), Inches(4.9))
    tb = s8.shapes.add_textbox(Inches(7.166), Inches(2.15), Inches(5.066), Inches(4.4))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "PROACTIVE INSTITUTIONAL INTERVENTIONS"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_EMERALD
    p.space_after = Pt(14)

    dri_val = [
        ("Student Risk Radar Badge", "Safe (<25% DRI), Warning (25–50% DRI), Critical Risk (>50% DRI), Debarred."),
        ("'What-If' Attendance Simulator", "Student utility calculates exactly how many consecutive lectures they must attend to recover."),
        ("Proactive Warning Alerts", "Automated email/push warnings dispatched when attendance dips below 80% (before 75% cutoff)."),
        ("Faculty Cohort Watchlist", "Instructors identify at-risk students 4 weeks before final exams, enabling timely academic counseling.")
    ]
    for h, b in dri_val:
        p = tf.add_paragraph()
        p.text = f"✔  {h}: "
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_WHITE
        run = p.add_run()
        run.text = b
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(10)

    # =========================================================================
    # SLIDE 9: UPGRADE 05 — AUTOMATED TIMETABLE ENGINE
    # =========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    apply_slide_bg(s9)
    add_header(s9, "VII Sem Proposed Upgrade (5 of 5)", "Upgrade 05: Automated Timetable Engine",
               "Automating lecture session lifecycles to eliminate manual instructor triggers and human forgetfulness")

    col_w9 = Inches(3.644)
    gap9 = Inches(0.4)
    top9 = Inches(1.9)

    steps9 = [
        ("T-5 MIN (PRE-LECTURE)", "Auto-Session Genesis", ACCENT_CYAN, [
            "Background node-cron daemon monitors university timetable.",
            "Initializes AttendanceSession in 'ready' state with cryptographic secret.",
            "Zero instructor intervention needed to configure lecture room."
        ]),
        ("T+0 TO T+60 (LECTURE)", "Instant Screen Activation", ACCENT_PURPLE, [
            "Faculty unlocks device: active rotating QR code immediately renders.",
            "Room collision guard prevents overlapping sessions in same room.",
            "Substitute faculty delegation supported if regular professor is on leave."
        ]),
        ("T+60 MIN (POST-LECTURE)", "Auto-Lock & LMS Sync", ACCENT_EMERALD, [
            "Session auto-closed at lecture conclusion + 5 min grace period.",
            "Unrecorded students marked as Absent atomically.",
            "Direct attendance record sync to university LMS (Moodle / Google Classroom)."
        ])
    ]

    for i, (badge, title, col, pts) in enumerate(steps9):
        x = Inches(0.8) + i * (col_w9 + gap9)
        add_glass_card(s9, x, top9, col_w9, Inches(4.9))

        tb = s9.shapes.add_textbox(x + Inches(0.25), top9 + Inches(0.3), col_w9 - Inches(0.5), Inches(4.3))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = badge
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = col
        p.space_after = Pt(6)

        p = tf.add_paragraph()
        p.text = title
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE
        p.space_after = Pt(16)

        for pt in pts:
            p = tf.add_paragraph()
            p.text = f"• {pt}"
            p.font.size = Pt(11)
            p.font.color.rgb = TEXT_MUTED
            p.space_after = Pt(10)

    # =========================================================================
    # SLIDE 10: IMPLEMENTATION ROADMAP & WORK BREAKDOWN
    # =========================================================================
    s10 = prs.slides.add_slide(blank_layout)
    apply_slide_bg(s10)
    add_header(s10, "Technical Roadmap", "Five-Phase Work Breakdown Structure (WBS)",
               "Structured phased implementation plan taking SAS from mid-semester review to campus deployment")

    phase_w = Inches(2.15)
    phase_gap = Inches(0.245)
    top10 = Inches(1.9)

    phases = [
        ("PHASE 1", "PWA Foundation & Cache", ACCENT_EMERALD, "COMPLETED", [
            "Vite-plugin-pwa engine",
            "Workbox model cache (~6MB)",
            "Standalone mobile manifest",
            "One-tap install button"
        ]),
        ("PHASE 2", "Predictive Analytics & DRI", ACCENT_AMBER, "ACTIVE", [
            "DRI mathematical scoring",
            "Student risk radar badge",
            "Faculty watchlist alerts",
            "Proactive email triggers"
        ]),
        ("PHASE 3", "Server Liveness Pipeline", ACCENT_VIOLET, "UPCOMING", [
            "Randomized action nonces",
            "68-pt EAR blink curve math",
            "Head yaw Euler dynamics",
            "Anti-spoof rejection"
        ]),
        ("PHASE 4", "BLE Proximity Guard", ACCENT_CYAN, "UPCOMING", [
            "Classroom ESP32 beacons",
            "navigator.bluetooth API",
            "RSSI >= -75 dBm filter",
            "Screen-share proxy block"
        ]),
        ("PHASE 5", "Timetable & LMS Sync", ACCENT_PURPLE, "VIII SEM", [
            "node-cron auto daemon",
            "Pre-lecture auto-start",
            "Moodle / ERP sync",
            "Campus pilot trial"
        ])
    ]

    for i, (badge, title, col, status, pts) in enumerate(phases):
        x = Inches(0.8) + i * (phase_w + phase_gap)
        add_glass_card(s10, x, top10, phase_w, Inches(4.9))

        tb = s10.shapes.add_textbox(x + Inches(0.15), top10 + Inches(0.25), phase_w - Inches(0.3), Inches(4.4))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = f"{badge}  •  {status}"
        p.font.size = Pt(9)
        p.font.bold = True
        p.font.color.rgb = col
        p.space_after = Pt(6)

        p = tf.add_paragraph()
        p.text = title
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE
        p.space_after = Pt(16)

        for pt in pts:
            p = tf.add_paragraph()
            p.text = f"• {pt}"
            p.font.size = Pt(10.5)
            p.font.color.rgb = TEXT_MUTED
            p.space_after = Pt(8)

    # =========================================================================
    # SLIDE 11: COMPARATIVE EVOLUTION MATRIX
    # =========================================================================
    s11 = prs.slides.add_slide(blank_layout)
    apply_slide_bg(s11)
    add_header(s11, "Evaluation Synthesis", "Comparative Evolution Matrix: VI Sem vs. VII Sem",
               "Direct side-by-side contrast demonstrating the leap in security, intelligence, and operations")

    t_rows = 6
    t_cols = 3
    t_left = Inches(0.8)
    t_top = Inches(1.9)
    t_width = Inches(11.733)
    t_height = Inches(4.9)

    t_shape = s11.shapes.add_table(t_rows, t_cols, t_left, t_top, t_width, t_height)
    tbl = t_shape.table
    tbl.columns[0].width = Inches(2.6)
    tbl.columns[1].width = Inches(4.566)
    tbl.columns[2].width = Inches(4.566)

    h_titles = ["Dimension", "VI Sem Baseline Prototype", "VII Sem Production Architecture"]
    for j, ht in enumerate(h_titles):
        c = tbl.cell(0, j)
        c.fill.solid()
        c.fill.fore_color.rgb = CARD_BG_ALT
        p = c.text_frame.paragraphs[0]
        p.text = ht
        p.font.bold = True
        p.font.size = Pt(12)
        p.font.color.rgb = TEXT_WHITE

    c_matrix = [
        ("Platform & Delivery", "Mobile Web Browser\n• URL bar clipping, slow 6MB download", "Progressive Web App (PWA)\n• Standalone UI, Workbox offline model cache"),
        ("Physical Security", "Virtual Only (Rotating QR)\n• Vulnerable to remote screen-share proxies", "Dual Physical + Biometric\n• BLE hardware beacon enforces room boundary"),
        ("Anti-Spoofing", "Client Boolean (livenessPassed)\n• Blindly trusted, vulnerable to API tampering", "Server-Verified Challenge Pipeline\n• 68-point EAR blink & head yaw Euler math"),
        ("Analytics", "Static Historical Percentage\n• Reactive tracking, purely retrospective logs", "Predictive Debarment Risk Index (DRI)\n• Trajectory forecasting & proactive <80% alerts"),
        ("Operations", "100% Manual Lifecycle\n• Faculty manually configures each lecture", "Automated Timetable Engine\n• node-cron auto-start/end & LMS roster sync")
    ]

    for i, r in enumerate(c_matrix):
        for j, val in enumerate(r):
            c = tbl.cell(i + 1, j)
            c.fill.solid()
            c.fill.fore_color.rgb = CARD_BG if (i % 2 == 0) else CARD_BG_ALT
            p = c.text_frame.paragraphs[0]
            p.text = val
            p.font.size = Pt(10.5)
            if j == 0:
                p.font.bold = True
                p.font.color.rgb = ACCENT_CYAN
            elif j == 1:
                p.font.color.rgb = TEXT_MUTED
            else:
                p.font.bold = True
                p.font.color.rgb = ACCENT_EMERALD

    # =========================================================================
    # SLIDE 12: MEET THE TEAM & CONCLUSION (Matching Reference Slide 2 & 9)
    # =========================================================================
    s12 = prs.slides.add_slide(blank_layout)
    apply_slide_bg(s12)
    add_header(s12, "Capstone Review Conclusion", "Meet the Team & Technical Q&A",
               "Department of Computer Science & Engineering  •  Open for Review Committee Evaluation")

    team_members = [
        ("Radesh Annam", "LCI2023020", "Team Member"),
        ("Nithin Sagili", "LCI2023040", "Team Member"),
        ("Pranilash Reddy", "LCB2023040", "Team Member"),
        ("Ranadeep Yeggoni", "LCB2023020", "Team Member"),
        ("Tanishq Kancharla", "LCS2023034", "Team Member")
    ]

    team_w = Inches(2.15)
    team_gap = Inches(0.245)
    top12 = Inches(1.9)

    for i, (name, roll, role) in enumerate(team_members):
        x = Inches(0.8) + i * (team_w + team_gap)
        add_glass_card(s12, x, top12, team_w, Inches(2.8))

        # Avatar placeholder image if exists
        avatar_file = os.path.join(IMG_DIR, f"slide_9_Picture {10 + i*4}.png")
        if os.path.exists(avatar_file):
            s12.shapes.add_picture(avatar_file, x + Inches(0.825), top12 + Inches(0.3), Inches(0.5), Inches(0.5))

        tb = s12.shapes.add_textbox(x + Inches(0.1), top12 + Inches(0.95), team_w - Inches(0.2), Inches(1.7))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = name
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE
        p.alignment = PP_ALIGN.CENTER
        p.space_after = Pt(4)

        p = tf.add_paragraph()
        p.text = roll
        p.font.size = Pt(10.5)
        p.font.color.rgb = ACCENT_PURPLE
        p.alignment = PP_ALIGN.CENTER
        p.space_after = Pt(4)

        p = tf.add_paragraph()
        p.text = role
        p.font.size = Pt(9.5)
        p.font.color.rgb = TEXT_MUTED
        p.alignment = PP_ALIGN.CENTER

    # Bottom Callout Box for Q&A
    add_glass_card(s12, Inches(0.8), Inches(4.9), Inches(11.733), Inches(1.9), border_color=ACCENT_VIOLET, bg_color=CARD_BG_ALT)
    tb_qa = s12.shapes.add_textbox(Inches(1.2), Inches(5.1), Inches(10.933), Inches(1.5))
    tf_qa = tb_qa.text_frame
    tf_qa.word_wrap = True

    p = tf_qa.paragraphs[0]
    p.text = "SUMMARY OF VII SEMESTER COMMITMENT"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_EMERALD
    p.space_after = Pt(6)

    p = tf_qa.add_paragraph()
    p.text = "Phase 1 (Progressive Web App) is fully implemented & compiled in code. Phased blueprints for BLE Proximity, Dynamic Liveness Math, and Predictive DRI Analytics are ready for execution."
    p.font.size = Pt(12)
    p.font.color.rgb = TEXT_WHITE
    p.space_after = Pt(10)

    p = tf_qa.add_paragraph()
    p.text = "Thank You!  —  Open for Faculty Evaluation & Architecture Discussion."
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN

    # Save presentation
    out_file = "Secure_Automated_Attendance_System_VII_Sem.pptx"
    prs.save(out_file)
    print(f"Polished presentation generated: {out_file}")

if __name__ == "__main__":
    build_polished_presentation()
