import sys
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Color Palette Constants
    BG_DARK = RGBColor(15, 23, 42)        # Slate 900
    BG_DARK_ALT = RGBColor(30, 41, 59)    # Slate 800
    BG_LIGHT = RGBColor(248, 250, 252)    # Slate 50
    CARD_BG = RGBColor(255, 255, 255)     # White
    CARD_BORDER = RGBColor(226, 232, 240) # Slate 200
    
    TEXT_MAIN = RGBColor(15, 23, 42)      # Slate 900
    TEXT_MUTED = RGBColor(100, 116, 139)  # Slate 500
    TEXT_LIGHT = RGBColor(241, 245, 249)  # Slate 100
    TEXT_LIGHT_MUTED = RGBColor(148, 163, 184) # Slate 400

    PRIMARY = RGBColor(79, 70, 229)       # Indigo 600
    PRIMARY_LIGHT = RGBColor(238, 242, 255) # Indigo 50
    ACCENT_PURPLE = RGBColor(124, 58, 237) # Violet 600
    SUCCESS = RGBColor(16, 185, 129)      # Emerald 500
    SUCCESS_LIGHT = RGBColor(236, 253, 245) # Emerald 50
    WARNING = RGBColor(245, 158, 11)      # Amber 500
    WARNING_LIGHT = RGBColor(254, 243, 199) # Amber 50
    DANGER = RGBColor(239, 68, 68)        # Red 500
    DANGER_LIGHT = RGBColor(254, 242, 242) # Red 50

    def add_header(slide, tag_text, title_text, subtitle_text=None, is_dark=False):
        # Header banner or container
        header_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.733), Inches(1.3))
        tf = header_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        # Category Tag
        p_tag = tf.paragraphs[0]
        p_tag.text = tag_text.upper()
        p_tag.font.size = Pt(11)
        p_tag.font.bold = True
        p_tag.font.name = "Arial"
        p_tag.font.color.rgb = ACCENT_PURPLE if is_dark else PRIMARY
        p_tag.space_after = Pt(4)

        # Slide Title
        p_title = tf.add_paragraph()
        p_title.text = title_text
        p_title.font.size = Pt(26)
        p_title.font.bold = True
        p_title.font.name = "Arial"
        p_title.font.color.rgb = TEXT_LIGHT if is_dark else TEXT_MAIN
        p_title.space_after = Pt(3)

        # Subtitle
        if subtitle_text:
            p_sub = tf.add_paragraph()
            p_sub.text = subtitle_text
            p_sub.font.size = Pt(13)
            p_sub.font.name = "Arial"
            p_sub.font.color.rgb = TEXT_LIGHT_MUTED if is_dark else TEXT_MUTED

    def add_card(slide, left, top, width, height, bg_color=CARD_BG, border_color=CARD_BORDER):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        if border_color:
            card.line.color.rgb = border_color
            card.line.width = Pt(1.2)
        else:
            card.line.fill.background()
        return card

    # ==========================================
    # SLIDE 1: TITLE SLIDE (Dark Premium Theme)
    # ==========================================
    slide1 = prs.slides.add_slide(blank_layout)
    bg1 = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = BG_DARK
    bg1.line.fill.background()

    # Decorative accent card
    accent1 = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.0), Inches(11.733), Inches(5.5))
    accent1.fill.solid()
    accent1.fill.fore_color.rgb = BG_DARK_ALT
    accent1.line.color.rgb = RGBColor(51, 65, 85)
    accent1.line.width = Pt(1.5)

    tb1 = slide1.shapes.add_textbox(Inches(1.4), Inches(1.4), Inches(10.5), Inches(4.7))
    tf1 = tb1.text_frame
    tf1.word_wrap = True

    p = tf1.paragraphs[0]
    p.text = "B.TECH CAPSTONE MAJOR PROJECT — VII SEMESTER MID-TERM REVIEW"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = ACCENT_PURPLE
    p.space_after = Pt(14)

    p = tf1.add_paragraph()
    p.text = "Smart Attendance System (SAS)"
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = TEXT_LIGHT
    p.space_after = Pt(6)

    p = tf1.add_paragraph()
    p.text = "Architectural Hardening, BLE Proximity Verification & Advanced Anti-Spoofing"
    p.font.size = Pt(20)
    p.font.color.rgb = RGBColor(199, 210, 254)
    p.space_after = Pt(24)

    p = tf1.add_paragraph()
    p.text = "Evolution from VI Semester Dual-Factor Web Prototype to an Enterprise-Grade Multi-Factor Platform"
    p.font.size = Pt(14)
    p.font.color.rgb = TEXT_LIGHT_MUTED
    p.space_after = Pt(32)

    # Metadata row
    p = tf1.add_paragraph()
    p.text = "Track: Major Project Phase-I (VII Sem)  |  Base: IIIT Lucknow B.Tech VI Sem Prototype  |  Stack: MERN + PWA + BLE"
    p.font.size = Pt(12)
    p.font.color.rgb = RGBColor(148, 163, 184)

    # ==========================================
    # SLIDE 2: VI SEM FOUNDATION (1/3) — ARCHITECTURE & ROLES
    # ==========================================
    slide2 = prs.slides.add_slide(blank_layout)
    bg2 = slide2.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg2.fill.solid()
    bg2.fill.fore_color.rgb = BG_LIGHT
    bg2.line.fill.background()

    add_header(slide2, "VI Sem Foundation (1 of 3)", "System Architecture & Core Role Hierarchy",
               "Established baseline: 3-Tier decoupled MERN stack with strict Role-Based Access Control (RBAC)")

    # 3 Cards for Architecture Layers
    col_w = Inches(3.644)
    gap = Inches(0.4)
    top_y = Inches(2.0)
    card_h = Inches(4.8)

    # Card 1: Presentation Layer
    add_card(slide2, Inches(0.8), top_y, col_w, card_h)
    tb = slide2.shapes.add_textbox(Inches(1.0), top_y + Inches(0.25), col_w - Inches(0.4), card_h - Inches(0.5))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "PRESENTATION LAYER"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = PRIMARY
    p.space_after = Pt(10)

    bullets1 = [
        ("React 18 Single Page App", "Built with modern component modularity and responsive layouts via Tailwind CSS."),
        ("Client State Management", "Zustand authStore managing session state and profile reactive context."),
        ("Client-Side Inference", "@vladmandic/face-api executing SSD MobileNet & 68-point facial landmark models in browser."),
        ("Hardware Integration", "Webcam streaming via WebRTC getUserMedia and QR capture via html5-qrcode.")
    ]
    for title, desc in bullets1:
        p = tf.add_paragraph()
        p.text = f"• {title}: "
        p.font.bold = True
        p.font.size = Pt(12)
        p.font.color.rgb = TEXT_MAIN
        run = p.add_run()
        run.text = desc
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(8)

    # Card 2: Application Layer
    add_card(slide2, Inches(0.8) + col_w + gap, top_y, col_w, card_h)
    tb = slide2.shapes.add_textbox(Inches(1.0) + col_w + gap, top_y + Inches(0.25), col_w - Inches(0.4), card_h - Inches(0.5))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "APPLICATION LAYER"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_PURPLE
    p.space_after = Pt(10)

    bullets2 = [
        ("Express.js REST Engine", "Modular MVC architecture (routes, controllers, middlewares, models, validators)."),
        ("JWT Authentication Flow", "Access tokens (1-day) & HttpOnly Refresh cookies (10-day) with rotation handling."),
        ("Cryptographic QR Signing", "HMAC-SHA256 signature generation bound to ephemeral session secrets."),
        ("Zod & Security Middleware", "Strict schema sanitization, helmet headers, rate-limiting, and CORS guards.")
    ]
    for title, desc in bullets2:
        p = tf.add_paragraph()
        p.text = f"• {title}: "
        p.font.bold = True
        p.font.size = Pt(12)
        p.font.color.rgb = TEXT_MAIN
        run = p.add_run()
        run.text = desc
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(8)

    # Card 3: Data & Role Layer
    add_card(slide2, Inches(0.8) + (col_w + gap)*2, top_y, col_w, card_h)
    tb = slide2.shapes.add_textbox(Inches(1.0) + (col_w + gap)*2, top_y + Inches(0.25), col_w - Inches(0.4), card_h - Inches(0.5))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "DATA & ROLE HIERARCHY"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = SUCCESS
    p.space_after = Pt(10)

    bullets3 = [
        ("MongoDB & Mongoose ODM", "Strict schemas: AttendanceUser, Department, Class, AttendanceSession, Attendance."),
        ("Administrator Persona", "Manages institutional departments, creates faculty accounts, audits global statistics."),
        ("Faculty Persona", "Curates courses, schedules lectures, monitors real-time session counters, exports CSV sheets."),
        ("Student Persona", "Enrolls 128D facial biometric template, scans session QR, undergoes face verification.")
    ]
    for title, desc in bullets3:
        p = tf.add_paragraph()
        p.text = f"• {title}: "
        p.font.bold = True
        p.font.size = Pt(12)
        p.font.color.rgb = TEXT_MAIN
        run = p.add_run()
        run.text = desc
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(8)

    # ==========================================
    # SLIDE 3: VI SEM FOUNDATION (2/3) — VERIFICATION PIPELINE
    # ==========================================
    slide3 = prs.slides.add_slide(blank_layout)
    bg3 = slide3.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg3.fill.solid()
    bg3.fill.fore_color.rgb = BG_LIGHT
    bg3.line.fill.background()

    add_header(slide3, "VI Sem Foundation (2 of 3)", "Dual-Factor Biometric Verification Pipeline",
               "Algorithm 1 implementation: Interleaving rotating cryptographic QR tokens with 128D facial embeddings")

    # Step-by-step 4 Horizontal Columns
    step_w = Inches(2.733)
    step_gap = Inches(0.266)
    card_h3 = Inches(4.8)

    steps = [
        ("STEP 1", "Session Initialization", PRIMARY, [
            "Faculty selects enrolled Class & triggers session.",
            "Backend generates random sessionSecret and sets isActive=true.",
            "Live attendance counter reset to 0 in database."
        ]),
        ("STEP 2", "Dynamic QR Rotation", PRIMARY, [
            "Faculty screen renders QR code refreshed every 14 seconds.",
            "Payload signed with HMAC-SHA256 (sessionId:timestamp:secret).",
            "Server enforces strict 30s acceptance tolerance window."
        ]),
        ("STEP 3", "Biometric Extraction", ACCENT_PURPLE, [
            "Student scans dynamic QR via mobile camera.",
            "Webcam captures video frame; extracts 68 facial landmarks.",
            "Generates 128-dimensional floating point embedding vector."
        ]),
        ("STEP 4", "Matching & Record Mark", SUCCESS, [
            "Server compares vector against student's enrolled template.",
            "Euclidean Distance <= 0.6 / Cosine Similarity evaluated.",
            "If matched, Attendance record markedAt timestamp created."
        ])
    ]

    for i, (badge, title, color, items) in enumerate(steps):
        x = Inches(0.8) + i * (step_w + step_gap)
        add_card(slide3, x, Inches(2.0), step_w, card_h3)
        
        # Badge
        b_box = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x + Inches(0.2), Inches(2.2), Inches(1.1), Inches(0.35))
        b_box.fill.solid()
        b_box.fill.fore_color.rgb = color
        b_box.line.fill.background()
        b_tf = b_box.text_frame
        b_p = b_tf.paragraphs[0]
        b_p.text = badge
        b_p.font.size = Pt(11)
        b_p.font.bold = True
        b_p.font.color.rgb = CARD_BG
        b_p.alignment = PP_ALIGN.CENTER

        tb = slide3.shapes.add_textbox(x + Inches(0.2), Inches(2.7), step_w - Inches(0.4), card_h3 - Inches(0.9))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = TEXT_MAIN
        p.space_after = Pt(14)

        for item in items:
            p = tf.add_paragraph()
            p.text = f"• {item}"
            p.font.size = Pt(12)
            p.font.color.rgb = TEXT_MUTED
            p.space_after = Pt(10)

    # ==========================================
    # SLIDE 4: VI SEM FOUNDATION (3/3) — ACHIEVEMENTS & LIMITATIONS
    # ==========================================
    slide4 = prs.slides.add_slide(blank_layout)
    bg4 = slide4.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg4.fill.solid()
    bg4.fill.fore_color.rgb = BG_LIGHT
    bg4.line.fill.background()

    add_header(slide4, "VI Sem Foundation (3 of 3)", "Prototype Validation & Identified Limitations",
               "Evaluating experimental achievements against residual vulnerabilities observed during testing")

    w2 = Inches(5.666)
    # Left Card: Achievements (Table 4.1 Results)
    add_card(slide4, Inches(0.8), Inches(2.0), w2, Inches(4.8), CARD_BG, SUCCESS)
    tb = slide4.shapes.add_textbox(Inches(1.1), Inches(2.2), w2 - Inches(0.6), Inches(4.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "PROTOTYPE VALIDATION ACHIEVEMENTS (TABLE 4.1)"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = SUCCESS
    p.space_after = Pt(12)

    achievements = [
        ("Tamper-Resistant QR Validation", "Forged signatures and manipulated session IDs successfully rejected (100% rejection rate)."),
        ("Biometric Differentiation", "Unmatched face embeddings rejected under Euclidean threshold <= 0.6 with zero false marks."),
        ("Concurrency Idempotency", "Atomic challenge nonces and compound indexes guarantee zero double-marking under race conditions."),
        ("Automated Reporting", "Instant CSV generation and faculty export reducing administrative attendance processing by >80%.")
    ]
    for title, desc in achievements:
        p = tf.add_paragraph()
        p.text = f"✔ {title}: "
        p.font.bold = True
        p.font.size = Pt(12)
        p.font.color.rgb = TEXT_MAIN
        run = p.add_run()
        run.text = desc
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(10)

    # Right Card: Identified Limitations
    add_card(slide4, Inches(6.866), Inches(2.0), w2, Inches(4.8), CARD_BG, DANGER)
    tb = slide4.shapes.add_textbox(Inches(7.166), Inches(2.2), w2 - Inches(0.6), Inches(4.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "CRITICAL LIMITATIONS IDENTIFIED FOR VII SEMESTER"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = DANGER
    p.space_after = Pt(12)

    limitations = [
        ("The Remote Screen-Sharing Proxy Loophole", "A student present in class can stream the QR via WhatsApp/Discord to an absent peer, who scans and passes face verification from home."),
        ("Client-Trusted Liveness Detection", "Current anti-spoofing relies on the frontend transmitting livenessPassed: true, leaving it vulnerable to automated API tampering."),
        ("Browser Constrained User Experience", "Webcam access within standard mobile browsers suffers from address-bar clipping, permissions friction, and slow 6MB model downloads."),
        ("Reactive Attendance Management", "Attendance is tracked retroactively; students and faculty only discover debarment status (<75%) when it is mathematically irreversible.")
    ]
    for title, desc in limitations:
        p = tf.add_paragraph()
        p.text = f"✘ {title}: "
        p.font.bold = True
        p.font.size = Pt(12)
        p.font.color.rgb = TEXT_MAIN
        run = p.add_run()
        run.text = desc
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(10)

    # ==========================================
    # SLIDE 5: NEW FEATURE 1 — PROGRESSIVE WEB APP (PWA)
    # ==========================================
    slide5 = prs.slides.add_slide(blank_layout)
    bg5 = slide5.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg5.fill.solid()
    bg5.fill.fore_color.rgb = BG_LIGHT
    bg5.line.fill.background()

    add_header(slide5, "VII Sem Proposed Upgrade (1 of 5)", "Progressive Web App (PWA) & Offline Asset Pre-Caching",
               "Transforming web prototype into an installable, standalone mobile application with zero App Store friction")

    # Left: Motivation & Architecture
    add_card(slide5, Inches(0.8), Inches(2.0), Inches(5.666), Inches(4.8))
    tb = slide5.shapes.add_textbox(Inches(1.1), Inches(2.2), Inches(5.066), Inches(4.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "TECHNICAL ARCHITECTURE & MECHANISM"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = PRIMARY
    p.space_after = Pt(12)

    pwa_points = [
        ("Vite PWA & Workbox Service Worker", "Embedded vite-plugin-pwa runtime service worker handling asset precaching and lifecycle."),
        ("Neural Network Weight Caching", "Configured CacheFirst Workbox rule for @vladmandic/face-api model shards (~6MB), caching them locally for 30 days to eliminate network lag."),
        ("Standalone Mobile Display", "Web App Manifest configured with display: standalone and viewport-fit=cover, removing browser navigation bars."),
        ("Zero App Store Friction", "Students install the app directly with one tap from Chrome/Safari without paying Apple/Google developer fees.")
    ]
    for title, desc in pwa_points:
        p = tf.add_paragraph()
        p.text = f"• {title}: "
        p.font.bold = True
        p.font.size = Pt(12)
        p.font.color.rgb = TEXT_MAIN
        run = p.add_run()
        run.text = desc
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(10)

    # Right: Quantitative Benefits & Status
    add_card(slide5, Inches(6.866), Inches(2.0), Inches(5.666), Inches(4.8))
    tb = slide5.shapes.add_textbox(Inches(7.166), Inches(2.2), Inches(5.066), Inches(4.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "QUANTITATIVE IMPACT & CURRENT STATUS"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = SUCCESS
    p.space_after = Pt(12)

    pwa_stats = [
        ("First-Load Latency Reduction", "Model load time reduced from 3.8s over 4G to <120ms from local CacheStorage."),
        ("Camera Canvas Reliability", "100% viewport utilization eliminating accidental scroll and gesture cancellations."),
        ("Current Development Status", "FULLY IMPLEMENTED & COMPILED in current codebase: manifest.webmanifest, sw.js, and InstallPwaButton live."),
        ("Cross-Platform Support", "Verified functional on Android Chrome (Home Screen install) and desktop Edge/Chrome environments.")
    ]
    for title, desc in pwa_stats:
        p = tf.add_paragraph()
        p.text = f"✔ {title}: "
        p.font.bold = True
        p.font.size = Pt(12)
        p.font.color.rgb = TEXT_MAIN
        run = p.add_run()
        run.text = desc
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(10)

    # ==========================================
    # SLIDE 6: NEW FEATURE 2 — BLE PROXIMITY VERIFICATION
    # ==========================================
    slide6 = prs.slides.add_slide(blank_layout)
    bg6 = slide6.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg6.fill.solid()
    bg6.fill.fore_color.rgb = BG_LIGHT
    bg6.line.fill.background()

    add_header(slide6, "VII Sem Proposed Upgrade (2 of 5)", "Physical Proximity Verification via BLE Beacons",
               "Enforcing physical classroom boundary security to eliminate remote screen-sharing proxy attendance")

    # 3 Column Architecture
    col3_w = Inches(3.644)
    col3_gap = Inches(0.4)

    # Card 1: Problem Solved
    add_card(slide6, Inches(0.8), Inches(2.0), col3_w, Inches(4.8))
    tb = slide6.shapes.add_textbox(Inches(1.0), Inches(2.25), col3_w - Inches(0.4), Inches(4.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "THE PROXY ATTACK VECTOR"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = DANGER
    p.space_after = Pt(10)
    p = tf.add_paragraph()
    p.text = "In virtual-only verification, a dynamic QR code can be photographed or live-streamed to absent students in hostels or outside campus."
    p.font.size = Pt(12)
    p.font.color.rgb = TEXT_MUTED
    p.space_after = Pt(10)
    p = tf.add_paragraph()
    p.text = "Biometric face verification only proves WHO is present, NOT WHERE they are physically situated."
    p.font.size = Pt(12)
    p.font.color.rgb = TEXT_MAIN
    p.font.bold = True

    # Card 2: BLE Beacon Workflow
    add_card(slide6, Inches(0.8) + col3_w + col3_gap, Inches(2.0), col3_w, Inches(4.8))
    tb = slide6.shapes.add_textbox(Inches(1.0) + col3_w + col3_gap, Inches(2.25), col3_w - Inches(0.4), Inches(4.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "HARDWARE & PROTOCOL DESIGN"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = PRIMARY
    p.space_after = Pt(10)

    ble_steps = [
        ("Beacon Advertisement", "Classroom ESP32 beacon or faculty laptop broadcasts temporary BLE Service UUID with rolling token."),
        ("Web Bluetooth Scan", "Student's PWA scans for beacon via navigator.bluetooth upon scanning QR."),
        ("Signal Filtering", "Received Signal Strength Indicator (RSSI) must measure >= -75 dBm (5-8m radius)."),
        ("Token Binding", "Cryptographic BLE proof sent with QR scan; validated prior to challenge release.")
    ]
    for title, desc in ble_steps:
        p = tf.add_paragraph()
        p.text = f"• {title}: "
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_MAIN
        run = p.add_run()
        run.text = desc
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(6)

    # Card 3: Security Properties
    add_card(slide6, Inches(0.8) + (col3_w + col3_gap)*2, Inches(2.0), col3_w, Inches(4.8))
    tb = slide6.shapes.add_textbox(Inches(1.0) + (col3_w + col3_gap)*2, Inches(2.25), col3_w - Inches(0.4), Inches(4.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "PROXIMITY GUARANTEES"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = SUCCESS
    p.space_after = Pt(10)

    ble_benefits = [
        ("Zero Screen-Share Exploits", "Remote students cannot scan or forge the BLE signal; proxy attendance via stream is completely eradicated."),
        ("Low Hardware Cost", "ESP32 microcontrollers cost <$4 per classroom, or faculty laptop acts as soft-beacon."),
        ("Dual-Layer Defense", "Attendance requires BOTH physical presence (BLE) AND biometric identity (Face)."),
        ("Graceful Degradation", "Classroom-specific geofencing / Wi-Fi BSSID fallback for non-Bluetooth devices.")
    ]
    for title, desc in ble_benefits:
        p = tf.add_paragraph()
        p.text = f"✔ {title}: "
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_MAIN
        run = p.add_run()
        run.text = desc
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(6)

    # ==========================================
    # SLIDE 7: NEW FEATURE 3 — SERVER-VERIFIED LIVENESS
    # ==========================================
    slide7 = prs.slides.add_slide(blank_layout)
    bg7 = slide7.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg7.fill.solid()
    bg7.fill.fore_color.rgb = BG_LIGHT
    bg7.line.fill.background()

    add_header(slide7, "VII Sem Proposed Upgrade (3 of 5)", "Server-Verified Dynamic Liveness & Anti-Spoofing",
               "Eliminating naive client booleans with server-orchestrated action challenges and landmark mathematics")

    # Left Card: Challenge Sequence Engine
    add_card(slide7, Inches(0.8), Inches(2.0), Inches(5.666), Inches(4.8))
    tb = slide7.shapes.add_textbox(Inches(1.1), Inches(2.2), Inches(5.066), Inches(4.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "DYNAMIC SERVER CHALLENGE PROTOCOL"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_PURPLE
    p.space_after = Pt(12)

    liveness_points = [
        ("Randomized Action Nonce", "Server generates ephemeral challenge sequence: e.g., ['turnLeft_30deg', 'blink_twice', 'smile'] with a strict 4.0s expiration."),
        ("Anti-Replay Protection", "A single-use challenge token prevents attackers from replaying pre-recorded video files or 3D avatar animations."),
        ("Dynamic Guidance UI", "Interactive student interface dynamically displays instructions corresponding to the server's randomized challenge."),
        ("Multi-Modal Validation", "Combines facial landmark geometric motion analysis with ambient luminance consistency.")
    ]
    for title, desc in liveness_points:
        p = tf.add_paragraph()
        p.text = f"• {title}: "
        p.font.bold = True
        p.font.size = Pt(12)
        p.font.color.rgb = TEXT_MAIN
        run = p.add_run()
        run.text = desc
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(10)

    # Right Card: Mathematical Landmark Formulations
    add_card(slide7, Inches(6.866), Inches(2.0), Inches(5.666), Inches(4.8))
    tb = slide7.shapes.add_textbox(Inches(7.166), Inches(2.2), Inches(5.066), Inches(4.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "MATHEMATICAL LANDMARK VALIDATION"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = PRIMARY
    p.space_after = Pt(12)

    math_points = [
        ("Eye Aspect Ratio (EAR) Formulation", "EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||). Server verifies rapid drop below threshold 0.20 followed by recovery."),
        ("Head Yaw Euler Dynamics", "Ratio between nose tip (p31) and outer jaw contour boundaries (p1, p17). Server verifies monotonic angle displacement >= 25 degrees."),
        ("Temporal Window Verification", "Transition intervals checked on backend (1.5s <= delta_t <= 4.0s). Rejects instant artificial injection attacks."),
        ("Elimination of Client Trust", "Backend no longer accepts naive livenessPassed: true. Mathematical proof vectors must be verified on server.")
    ]
    for title, desc in math_points:
        p = tf.add_paragraph()
        p.text = f"✔ {title}: "
        p.font.bold = True
        p.font.size = Pt(12)
        p.font.color.rgb = TEXT_MAIN
        run = p.add_run()
        run.text = desc
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(10)

    # ==========================================
    # SLIDE 8: NEW FEATURE 4 — PREDICTIVE DEBARMENT ANALYTICS
    # ==========================================
    slide8 = prs.slides.add_slide(blank_layout)
    bg8 = slide8.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg8.fill.solid()
    bg8.fill.fore_color.rgb = BG_LIGHT
    bg8.line.fill.background()

    add_header(slide8, "VII Sem Proposed Upgrade (4 of 5)", "Predictive Debarment Analytics & Early-Warning Engine",
               "Transforming reactive attendance percentage logs into actionable machine intelligence and cutoff forecasting")

    # Left: Mathematical Model & Formulations
    add_card(slide8, Inches(0.8), Inches(2.0), Inches(5.666), Inches(4.8))
    tb = slide8.shapes.add_textbox(Inches(1.1), Inches(2.2), Inches(5.066), Inches(4.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "DEBARMENT RISK INDEX (DRI) FORMULATION"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = WARNING
    p.space_after = Pt(12)

    dri_points = [
        ("Remaining Sessions (N_rem)", "N_rem = Total_Planned_Lectures - Conducted_Lectures."),
        ("Max Achievable Percentage", "Max% = ((Attended_Lectures + N_rem) / Total_Planned_Lectures) * 100."),
        ("Required Attendance for 75%", "N_req = max(0, ceil(0.75 * Total_Planned) - Attended_Lectures)."),
        ("Debarment Risk Index (DRI)", "If Max% < 75%: DRI = 100% (Mathematically Debarred). Otherwise: DRI = (N_req / N_rem) * 100.")
    ]
    for title, desc in dri_points:
        p = tf.add_paragraph()
        p.text = f"• {title}: "
        p.font.bold = True
        p.font.size = Pt(12)
        p.font.color.rgb = TEXT_MAIN
        run = p.add_run()
        run.text = desc
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(10)

    # Right: Institutional Value
    add_card(slide8, Inches(6.866), Inches(2.0), Inches(5.666), Inches(4.8))
    tb = slide8.shapes.add_textbox(Inches(7.166), Inches(2.2), Inches(5.066), Inches(4.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "PROACTIVE INSTITUTIONAL INTERVENTIONS"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = SUCCESS
    p.space_after = Pt(12)

    interventions = [
        ("Student Risk Radar Dashboard", "Real-time badge: Safe (<25% DRI), Moderate Risk (25-50% DRI), High Risk (>50% DRI), Debarred."),
        ("'What-If' Attendance Simulator", "Student utility showing exactly how many consecutive lectures they must attend to restore compliance."),
        ("Automated Proactive Alerts", "Automated email/push warnings dispatched when student attendance drops below 80% (prior to 75% cutoff)."),
        ("Faculty Class Watchlist", "Instructors identify at-risk cohorts weeks before final exams, enabling timely academic counseling.")
    ]
    for title, desc in interventions:
        p = tf.add_paragraph()
        p.text = f"✔ {title}: "
        p.font.bold = True
        p.font.size = Pt(12)
        p.font.color.rgb = TEXT_MAIN
        run = p.add_run()
        run.text = desc
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(10)

    # ==========================================
    # SLIDE 9: NEW FEATURE 5 — TIMETABLE AUTOMATION & ERP
    # ==========================================
    slide9 = prs.slides.add_slide(blank_layout)
    bg9 = slide9.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg9.fill.solid()
    bg9.fill.fore_color.rgb = BG_LIGHT
    bg9.line.fill.background()

    add_header(slide9, "VII Sem Proposed Upgrade (5 of 5)", "Automated Timetable Engine & Academic Scheduling",
               "Automating lecture lifecycle to eliminate manual session starts, human forgetfulness, and latency")

    # 3 Horizontal Process Cards
    card_w9 = Inches(3.644)
    card_gap9 = Inches(0.4)

    steps_tt = [
        ("PRE-LECTURE (T-5 MIN)", "Auto-Session Genesis", PRIMARY, [
            "node-cron background scheduler matches active lecture time table slots.",
            "Initializes AttendanceSession record in 'ready' state with cryptographic secret.",
            "Zero faculty intervention required to create room session."
        ]),
        ("DURING LECTURE (T+0 TO T+60)", "Instant Screen Activation", ACCENT_PURPLE, [
            "Faculty unlocks app: session is already active with dynamic rotating QR.",
            "Handles collision detection (prevents overlapping sessions in same room).",
            "Substitute faculty delegation supported if regular instructor is on leave."
        ]),
        ("POST-LECTURE (T+60 MIN)", "Auto-Termination & Tally", SUCCESS, [
            "Session auto-closed at lecture conclusion + grace period.",
            "Calculates unrecorded students as Absent atomically.",
            "Exports synced attendance records to college LMS (Moodle / Google Classroom)."
        ])
    ]

    for i, (badge, title, color, items) in enumerate(steps_tt):
        x = Inches(0.8) + i * (card_w9 + card_gap9)
        add_card(slide9, x, Inches(2.0), card_w9, Inches(4.8))

        b_box = slide9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x + Inches(0.2), Inches(2.2), Inches(2.2), Inches(0.35))
        b_box.fill.solid()
        b_box.fill.fore_color.rgb = color
        b_box.line.fill.background()
        b_tf = b_box.text_frame
        b_p = b_tf.paragraphs[0]
        b_p.text = badge
        b_p.font.size = Pt(10)
        b_p.font.bold = True
        b_p.font.color.rgb = CARD_BG
        b_p.alignment = PP_ALIGN.CENTER

        tb = slide9.shapes.add_textbox(x + Inches(0.2), Inches(2.7), card_w9 - Inches(0.4), Inches(3.9))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = TEXT_MAIN
        p.space_after = Pt(14)

        for item in items:
            p = tf.add_paragraph()
            p.text = f"• {item}"
            p.font.size = Pt(12)
            p.font.color.rgb = TEXT_MUTED
            p.space_after = Pt(10)

    # ==========================================
    # SLIDE 10: COMPARATIVE ADVANCEMENT MATRIX
    # ==========================================
    slide10 = prs.slides.add_slide(blank_layout)
    bg10 = slide10.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg10.fill.solid()
    bg10.fill.fore_color.rgb = BG_LIGHT
    bg10.line.fill.background()

    add_header(slide10, "Academic Evaluation Synthesis", "Comprehensive Upgrade Matrix: VI Sem vs. VII Sem",
               "Direct comparative benchmarking illustrating architectural, security, and operational advancements")

    # Table representation
    rows = 6
    cols = 3
    left_t = Inches(0.8)
    top_t = Inches(2.0)
    width_t = Inches(11.733)
    height_t = Inches(4.8)

    table_shape = slide10.shapes.add_table(rows, cols, left_t, top_t, width_t, height_t)
    table = table_shape.table
    table.columns[0].width = Inches(2.5)
    table.columns[1].width = Inches(4.6)
    table.columns[2].width = Inches(4.633)

    headers_text = ["System Dimension", "VI Sem Baseline Prototype", "VII Sem Proposed Major Project Upgrade"]
    for j, h in enumerate(headers_text):
        cell = table.cell(0, j)
        cell.fill.solid()
        cell.fill.fore_color.rgb = BG_DARK
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.bold = True
        p.font.size = Pt(13)
        p.font.color.rgb = TEXT_LIGHT

    matrix_data = [
        ("Deployment Platform", "Standard Mobile Web Browser\n(URL bar clipping, slow network fetch)", "Installable Progressive Web App (PWA)\n(Standalone UI, Workbox offline model caching)"),
        ("Physical Security", "Virtual Only (HMAC-SHA256 QR)\n(Vulnerable to remote screen-share proxies)", "Dual Physical + Biometric Security\n(Hardware BLE RSSI beacon proximity enforcement)"),
        ("Anti-Spoofing Protocol", "Client-Side Boolean (livenessPassed)\n(Vulnerable to API intercept & replay)", "Server-Verified Dynamic Challenge Pipeline\n(Randomized sequence, 68-pt EAR & Euler math)"),
        ("Attendance Intelligence", "Static Historical Percentage Tally\n(Post-hoc, purely retrospective logs)", "Predictive Debarment Risk Index (DRI)\n(Proactive trajectory modeling & early cutoff warnings)"),
        ("Operational Lifecycle", "100% Manual Session Management\n(Instructor must initiate each lecture)", "Automated Background Timetable Engine\n(Auto-start/end based on scheduled curriculum)")
    ]

    for i, row in enumerate(matrix_data):
        for j, text in enumerate(row):
            cell = table.cell(i + 1, j)
            cell.fill.solid()
            cell.fill.fore_color.rgb = CARD_BG if (i % 2 == 0) else RGBColor(241, 245, 249)
            p = cell.text_frame.paragraphs[0]
            p.text = text
            p.font.size = Pt(11)
            if j == 0:
                p.font.bold = True
                p.font.color.rgb = PRIMARY
            elif j == 1:
                p.font.color.rgb = TEXT_MUTED
            else:
                p.font.bold = True
                p.font.color.rgb = SUCCESS

    # ==========================================
    # SLIDE 11: IMPLEMENTATION ROADMAP & PHASING
    # ==========================================
    slide11 = prs.slides.add_slide(blank_layout)
    bg11 = slide11.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg11.fill.solid()
    bg11.fill.fore_color.rgb = BG_LIGHT
    bg11.line.fill.background()

    add_header(slide11, "Project Execution Strategy", "Implementation Phasing & Semester Milestones",
               "Systematic roadmap dividing capstone deliverables across VII Semester and VIII Semester phases")

    phases = [
        ("PHASE 1 (COMPLETED)", "PWA Engine & Biometric Stability", SUCCESS, [
            "Vite-plugin-pwa installed with auto-updating Service Worker.",
            "Workbox CacheFirst policy for @vladmandic/face-api (~6MB).",
            "Branded manifest and standalone mobile icons created.",
            "Browser requestAnimationFrame loop leak eliminated."
        ]),
        ("PHASE 2 (CURRENT FOCUS)", "Predictive Analytics & DRI Engine", PRIMARY, [
            "Implement Debarment Risk Index (DRI) calculation in backend.",
            "Add 'What-If' Attendance Simulator to Student Dashboard.",
            "Develop Faculty Debarment Watchlist cohort table.",
            "Configure proactive email notification triggers (<80%)."
        ]),
        ("PHASE 3 (NEXT STAGE)", "Server-Verified Liveness Pipeline", ACCENT_PURPLE, [
            "Expand AttendanceChallenge model with dynamic action nonces.",
            "Build client-side EAR curve & yaw angle delta calculators.",
            "Implement backend mathematical landmark validator.",
            "Reject static photo presentation and 2D replay spoofs."
        ]),
        ("PHASE 4 (VIII SEMESTER)", "Hardware BLE Proximity & Pilot", WARNING, [
            "Integrate Web Bluetooth API (navigator.bluetooth).",
            "Deploy ESP32 classroom hardware BLE beacons.",
            "Connect timetable engine with university LMS / ERP.",
            "Execute full-scale campus trial across CS department."
        ])
    ]

    p_w = Inches(2.733)
    p_gap = Inches(0.266)
    for i, (badge, title, color, items) in enumerate(phases):
        x = Inches(0.8) + i * (p_w + p_gap)
        add_card(slide11, x, Inches(2.0), p_w, Inches(4.8))

        b_box = slide11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x + Inches(0.15), Inches(2.2), Inches(2.4), Inches(0.35))
        b_box.fill.solid()
        b_box.fill.fore_color.rgb = color
        b_box.line.fill.background()
        b_tf = b_box.text_frame
        b_p = b_tf.paragraphs[0]
        b_p.text = badge
        b_p.font.size = Pt(9.5)
        b_p.font.bold = True
        b_p.font.color.rgb = CARD_BG
        b_p.alignment = PP_ALIGN.CENTER

        tb = slide11.shapes.add_textbox(x + Inches(0.15), Inches(2.7), p_w - Inches(0.3), Inches(3.9))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = TEXT_MAIN
        p.space_after = Pt(14)

        for item in items:
            p = tf.add_paragraph()
            p.text = f"• {item}"
            p.font.size = Pt(11.5)
            p.font.color.rgb = TEXT_MUTED
            p.space_after = Pt(8)

    # ==========================================
    # SLIDE 12: CONCLUSION & Q&A (Dark Premium Theme)
    # ==========================================
    slide12 = prs.slides.add_slide(blank_layout)
    bg12 = slide12.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg12.fill.solid()
    bg12.fill.fore_color.rgb = BG_DARK
    bg12.line.fill.background()

    # Inner decorative container
    c12 = slide12.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.0), Inches(11.733), Inches(5.5))
    c12.fill.solid()
    c12.fill.fore_color.rgb = BG_DARK_ALT
    c12.line.color.rgb = RGBColor(51, 65, 85)
    c12.line.width = Pt(1.5)

    tb12 = slide12.shapes.add_textbox(Inches(1.4), Inches(1.4), Inches(10.5), Inches(4.7))
    tf12 = tb12.text_frame
    tf12.word_wrap = True

    p = tf12.paragraphs[0]
    p.text = "VII SEMESTER MID-TERM EVALUATION SUMMARY"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = SUCCESS
    p.space_after = Pt(12)

    p = tf12.add_paragraph()
    p.text = "Summary & Conclusion"
    p.font.size = Pt(34)
    p.font.bold = True
    p.font.color.rgb = TEXT_LIGHT
    p.space_after = Pt(16)

    bullets_c = [
        "Established Foundation: Robust VI Sem dual-factor baseline successfully hardened against race conditions, auth leakage, and model timeouts.",
        "Delivered VII Sem Milestone: Progressive Web App (PWA) with offline neural network caching fully built, validated, and installable on mobile/desktop.",
        "Clear Capstone Trajectory: Concrete mathematical and architectural blueprints defined for BLE Proximity, Server-Verified Liveness, and Predictive Debarment Analytics.",
        "High Practical & Academic Merit: Evolves academic attendance from passive logging into an intelligent, fraud-proof, multi-factor institutional system."
    ]
    for b in bullets_c:
        p = tf12.add_paragraph()
        p.text = f"✔  {b}"
        p.font.size = Pt(14)
        p.font.color.rgb = RGBColor(226, 232, 240)
        p.space_after = Pt(10)

    p = tf12.add_paragraph()
    p.text = "\nThank You!  —  Open for Questions & Evaluation Committee Feedback"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = RGBColor(199, 210, 254)

    # Save presentation
    output_filename = "Smart_Attendance_System_VII_Sem_Review.pptx"
    prs.save(output_filename)
    print(f"Presentation generated successfully: {output_filename}")

if __name__ == "__main__":
    create_presentation()
