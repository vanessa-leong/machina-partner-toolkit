/* =====================================================================
   RENDER v2 — draws every format on a <canvas> at its exact pixel size.
   Rebuilt on the MACHINA_27 Design System 1.0 components:
     Headline     Blauer Nue 600 caps (family "display"), 0.92 leading, −1%, white
     Masthead     post header: eyebrow left, wordmark right, hairline rule
     AccentBand   blue→pink horizon (70% at night), above the dateline row
     Label        Bricolage Grotesque caps, +16% tracking, strip-night ink
     Dateline     "7–8 JULY 2027 • PARIS", Geist SemiBold caps, 0.3em, 70%
     Backdrop     --post-bg-night / --tile-night / night-texture at 54%
     Panels       --panel-fill + --panel-rim, cut corners on TL and BR only
   Layout is locked here; the team edits copy in config.js only.
   Families: post (post + story), wide, tall, box, badge.
   ===================================================================== */
(function () {
  "use strict";

  /* ---------- tokens (verbatim from the design system) ---------- */
  const BLUE = "#4A78FF", PINK = "#FF6FAE";
  const T = {
    id: "machina",
    bg: "#000000",
    fg: "#FFFFFF",
    strip: "rgba(246,243,236,.75)",       /* --strip-night */
    sub: "rgba(255,255,255,.64)",         /* --lf-body-color, SpeakerCard role */
    dateInk: "rgba(255,255,255,.70)",     /* dateline: 70% ink */
    rule: "rgba(255,255,255,.26)",        /* post-header hairline */
    head: (px) => `600 ${px}px MBlauer, "Helvetica Neue", Arial, sans-serif`,
    lead: 0.92, track: -0.01,
    label: (px, w) => `${w || 500} ${px}px MBricolage, "Helvetica Neue", Arial, sans-serif`, labelTrack: 0.16,
    date: (px) => `600 ${px}px MGeist, "Helvetica Neue", Arial, sans-serif`, dateTrack: 0.3,
    nameLight: (px) => `300 ${px}px MGeist, "Helvetica Neue", Arial, sans-serif`,
    nameBold: (px) => `600 ${px}px MGeist, "Helvetica Neue", Arial, sans-serif`,
    body: (px) => `400 ${px}px MBricolage, "Helvetica Neue", Arial, sans-serif`,
    code: (px) => `500 ${px}px MGeistMono, "Courier New", monospace`,
    logoAspect: 501 / 34.116
  };

  /* ---------- low-level helpers ---------- */
  function setFont(ctx, font, trackPx) {
    ctx.font = font;
    if ("letterSpacing" in ctx) ctx.letterSpacing = (trackPx || 0) + "px";
  }
  function measure(ctx, str, font, trackPx) {
    setFont(ctx, font, trackPx);
    // letterSpacing adds one trailing gap; remove it so widths are optical
    return ctx.measureText(str).width - (trackPx || 0);
  }
  function text(ctx, str, x, y, font, color, trackPx, align) {
    setFont(ctx, font, trackPx);
    ctx.fillStyle = color;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    let dx = 0;
    if (align === "right" || align === "center") {
      const w = ctx.measureText(str).width - (trackPx || 0);
      dx = align === "right" ? -w : -w / 2;
    }
    ctx.fillText(str, x + dx, y);
  }
  const up = (s) => String(s || "").toUpperCase();

  /* cut corner: radii on two opposite corners only (TL and BR) */
  function cutPath(ctx, x, y, w, h, r, r2) {
    const a = Math.min(r, w / 2, h / 2), b = Math.min(r2 == null ? r : r2, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + a, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h - b);
    ctx.arcTo(x + w, y + h, x + w - b, y + h, b);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + a);
    ctx.arcTo(x, y, x + a, y, a);
    ctx.closePath();
  }

  /* CSS linear-gradient(<deg>) mapped onto a box */
  function cssLinear(ctx, x, y, w, h, deg, stops) {
    const a = (deg * Math.PI) / 180;
    const dx = Math.sin(a), dy = -Math.cos(a);
    const len = Math.abs(w * dx) + Math.abs(h * dy);
    const cx = x + w / 2, cy = y + h / 2;
    const g = ctx.createLinearGradient(cx - (dx * len) / 2, cy - (dy * len) / 2, cx + (dx * len) / 2, cy + (dy * len) / 2);
    for (const [o, c] of stops) g.addColorStop(o, c);
    return g;
  }
  /* CSS radial-gradient(rx ry at cx cy) as an ellipse; stops are [offset, rgba] */
  function ellipse(ctx, x, y, w, h, cx, cy, rx, ry, stops) {
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.translate(cx, cy);
    ctx.scale(rx, ry);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    for (const [o, c] of stops) g.addColorStop(o, c);
    ctx.fillStyle = g;
    ctx.fillRect((x - cx) / rx, (y - cy) / ry, w / rx, h / ry);
    ctx.restore();
  }
  const rgba = (hex, a) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  };
  /* the 5-step falloff used by --tile-night */
  const falloff = (hex, a) => [[0, rgba(hex, a)], [0.25, rgba(hex, a * 0.72)], [0.5, rgba(hex, a * 0.38)], [0.75, rgba(hex, a * 0.12)], [1, rgba(hex, 0)]];

  /* draw an image to cover a box, honouring a crop {cx, cy, z} (normalised centre + zoom) */
  function drawCrop(ctx, img, crop, x, y, w, h) {
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;
    const c = crop || { cx: 0.5, cy: 0.5, z: 1 };
    const sc = Math.max(w / iw, h / ih) * (c.z || 1);
    const dw = iw * sc, dh = ih * sc;
    let px = x + w / 2 - c.cx * dw, py = y + h / 2 - c.cy * dh;
    px = Math.min(x, Math.max(x + w - dw, px));
    py = Math.min(y, Math.max(y + h - dh, py));
    ctx.drawImage(img, px, py, dw, dh);
  }
  function drawContain(ctx, img, x, y, w, h, align) {
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    if (!iw || !ih) return { w: 0, h: 0 };
    const sc = Math.min(w / iw, h / ih);
    const dw = iw * sc, dh = ih * sc;
    let dx = x + (w - dw) / 2;
    if (align === "left") dx = x;
    if (align === "right") dx = x + w - dw;
    ctx.drawImage(img, dx, y + (h - dh) / 2, dw, dh);
    return { w: dw, h: dh, x: dx };
  }

  /* ---------- Backdrop ---------- */
  /* --post-bg-night: 4:5 and 9:16 posts */
  function postBg(ctx, x, y, W, H) {
    ctx.fillStyle = T.bg; ctx.fillRect(x, y, W, H);
    ellipse(ctx, x, y, W, H, x - 0.10 * W, y - 0.12 * H, 1.10 * W, 0.80 * H, [[0, rgba(BLUE, 0.30)], [0.75, rgba(BLUE, 0)]]);
    ellipse(ctx, x, y, W, H, x + 1.12 * W, y + 1.08 * H, 0.90 * W, 0.70 * H, [[0, rgba(PINK, 0.22)], [0.75, rgba(PINK, 0)]]);
  }
  /* --tile-night: banners, ads, badge */
  function tileBg(ctx, x, y, W, H) {
    ctx.fillStyle = T.bg; ctx.fillRect(x, y, W, H);
    ellipse(ctx, x, y, W, H, x - 0.08 * W, y - 0.08 * H, 1.08 * W, 0.93 * H, falloff(BLUE, 0.42));
    ellipse(ctx, x, y, W, H, x + 1.10 * W, y + 0.50 * H, 0.48 * W, 0.73 * H, falloff(PINK, 0.26));
  }
  function drawBg(ctx, v, W, H, A, kind) {
    if (kind === "post") postBg(ctx, 0, 0, W, H); else tileBg(ctx, 0, 0, W, H);
    if (v === "c" && A.material) {
      // Backdrop "night-texture": material photo at 54% over the tile
      ctx.save(); ctx.globalAlpha = 0.54;
      drawCrop(ctx, A.material, { cx: 0.5, cy: 0.5, z: 1 }, 0, 0, W, H);
      ctx.restore();
    }
  }

  /* ---------- AccentBand (horizon) ---------- */
  function horizon(ctx, x, y, w, h, alpha) {
    const a = alpha == null ? 0.7 : alpha;
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, rgba(BLUE, a)); g.addColorStop(1, rgba(PINK, a));
    ctx.fillStyle = g; ctx.fillRect(x, y, w, Math.max(1, h));
  }

  /* ---------- Logo ---------- */
  function drawLogo(ctx, A, x, y, h, align) {
    const w = h * T.logoAspect;
    let dx = x;
    if (align === "right") dx = x - w;
    if (align === "center") dx = x - w / 2;
    if (A.logo) ctx.drawImage(A.logo, dx, y, w, h);
    return w;
  }

  /* ---------- Headline ---------- */
  function normLines(h) {
    return (h || []).map((l) => (Array.isArray(l) ? l : l.runs ? l.runs : [l]));
  }
  const lineStr = (l) => l.map((r) => r.t).join("");
  function lineWidth(ctx, line, px) { return measure(ctx, up(lineStr(line)), T.head(px), px * T.track); }
  function fitLines(ctx, lines, maxW, maxH, maxPx, minPx) {
    let px = Math.round(maxPx);
    for (; px > 6; px -= 1) {
      const totalH = px * T.lead * (lines.length - 1) + px * 0.74;
      let w = 0;
      for (const l of lines) w = Math.max(w, lineWidth(ctx, l, px));
      if (w <= maxW && totalH <= maxH) break;
    }
    return { px, small: px < minPx, h: px * T.lead * (lines.length - 1) + px * 0.74 };
  }
  /* y is the top of the cap height */
  function drawLines(ctx, lines, x, y, px, align) {
    lines.forEach((l, i) => {
      text(ctx, up(lineStr(l)), x, y + px * 0.72 + px * T.lead * i, T.head(px), T.fg, px * T.track, align || "left");
    });
  }
  /* greedy word wrap of a headline at a given size */
  function wrapWords(ctx, lines, maxW, px) {
    const words = lines.map(lineStr).join(" ").split(/\s+/).filter(Boolean);
    const out = []; let cur = "";
    for (const w of words) {
      const t = cur ? cur + " " + w : w;
      if (cur && measure(ctx, up(t), T.head(px), px * T.track) > maxW) { out.push([{ t: cur }]); cur = w; } else cur = t;
    }
    if (cur) out.push([{ t: cur }]);
    return out;
  }
  function oneLine(lines) { return [[{ t: lines.map(lineStr).join(" ") }]]; }

  /* ---------- Label + dateline ---------- */
  function fitOne(ctx, str, fontFn, trackEm, maxW, maxPx, minPx) {
    let px = Math.round(maxPx);
    for (; px > 6; px -= 1) if (measure(ctx, str, fontFn(px), px * trackEm) <= maxW) break;
    return { px, small: px < minPx };
  }
  /* dates only: no location or website on any asset */
  const dateline = (d) => up(d.dates);
  function drawDate(ctx, d, x, y, maxW, px, align) {
    const str = dateline(d);
    const f = fitOne(ctx, str, T.date, T.dateTrack, maxW, px, 6);
    text(ctx, str, x, y, T.date(f.px), T.dateInk, f.px * T.dateTrack, align);
    return f.px;
  }
  function drawLabel(ctx, str, x, y, maxW, px, color, align, weight) {
    const s = up(str);
    const f = fitOne(ctx, s, (p) => T.label(p, weight), T.labelTrack, maxW, px, 6);
    text(ctx, s, x, y, T.label(f.px, weight), color || T.strip, f.px * T.labelTrack, align);
    return f.px;
  }

  /* ---------- Panels (brochure card: --panel-fill + --panel-rim) ---------- */
  function panel(ctx, x, y, w, h, r, opts) {
    opts = opts || {};
    const bw = Math.max(1, opts.rim || 1.5);
    if (opts.shadow !== false) {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,.9)"; ctx.shadowBlur = Math.max(8, h * 0.12); ctx.shadowOffsetY = Math.max(4, h * 0.06);
      cutPath(ctx, x, y, w, h, r); ctx.fillStyle = "#0b0b0c"; ctx.fill();
      ctx.restore();
    }
    // rim (border-box gradient)
    cutPath(ctx, x, y, w, h, r);
    ctx.fillStyle = cssLinear(ctx, x, y, w, h, 135, [[0, rgba(BLUE, 0.6)], [0.42, "rgba(255,255,255,.07)"], [0.6, "rgba(255,255,255,.05)"], [1, rgba(PINK, 0.5)]]);
    ctx.fill();
    // fill (padding-box)
    cutPath(ctx, x + bw, y + bw, w - 2 * bw, h - 2 * bw, Math.max(0, r - bw));
    ctx.fillStyle = cssLinear(ctx, x, y, w, h, 160, [[0, "#18181b"], [1, "#0b0b0c"]]);
    ctx.fill();
    return bw;
  }
  /* rim drawn on top of a photo */
  function rimStroke(ctx, x, y, w, h, r, bw) {
    ctx.save();
    ctx.fillStyle = cssLinear(ctx, x, y, w, h, 135, [[0, rgba(BLUE, 0.85)], [0.42, "rgba(255,255,255,.12)"], [0.6, "rgba(255,255,255,.08)"], [1, rgba(PINK, 0.75)]]);
    // even-odd fill = ring between the two paths
    ctx.beginPath();
    pathInto(ctx, x, y, w, h, r);
    pathInto(ctx, x + bw, y + bw, w - 2 * bw, h - 2 * bw, Math.max(0, r - bw));
    ctx.fill("evenodd");
    ctx.restore();
  }
  function pathInto(ctx, x, y, w, h, r) {
    const a = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + a, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h - a);
    ctx.arcTo(x + w, y + h, x + w - a, y + h, a); ctx.lineTo(x, y + h); ctx.lineTo(x, y + a);
    ctx.arcTo(x, y, x + a, y, a); ctx.closePath();
  }

  /* code chip (SpecCard-style panel); returns width. stacked puts "USE CODE" above the code */
  function chip(ctx, x, y, h, code, align, opts) {
    opts = opts || {};
    const label = up(opts.label || "Use code");
    const c = up(code || "YOURCODE");
    const fs = Math.round(h * 0.26);
    const lab = T.label(fs, 500), lt = fs * T.labelTrack;
    const cf = T.code(Math.round(h * 0.4));
    const padX = h * 0.42, gap = h * 0.3;
    let w;
    if (opts.stacked) w = opts.width;
    else {
      w = padX * 2 + measure(ctx, label, lab, lt) + gap + measure(ctx, c, cf, 0);
      if (opts.maxW && w > opts.maxW) return chip(ctx, x, y, h * 1.25, code, align, { label: opts.label, stacked: true, width: opts.maxW });
    }
    let cx = x;
    if (align === "right") cx = x - w;
    if (align === "center") cx = x - w / 2;
    if (x > -9000) {
      panel(ctx, cx, y, w, h, h * 0.32, { rim: Math.max(1, h * 0.025), shadow: false });
      if (opts.stacked) {
        text(ctx, label, cx + w / 2, y + h * 0.38, T.label(Math.round(h * 0.15), 500), T.sub, h * 0.15 * T.labelTrack, "center");
        const f = fitOne(ctx, c, T.code, 0, w - h * 0.24, h * 0.3, 6);
        text(ctx, c, cx + w / 2, y + h * 0.76, T.code(f.px), T.fg, 0, "center");
      } else {
        text(ctx, label, cx + padX, y + h / 2 + fs * 0.36, lab, T.sub, lt, "left");
        const lx = cx + padX + measure(ctx, label, lab, lt) + gap;
        const f = fitOne(ctx, c, T.code, 0, cx + w - padX - lx, h * 0.4, 6);
        text(ctx, c, lx, y + h / 2 + f.px * 0.36, T.code(f.px), T.fg, 0, "left");
      }
    }
    return w;
  }

  /* photo / logo frame: SpeakerCard-style panel with cut corners */
  function frame(ctx, d, x, y, w, h, unit) {
    const r = 38 * unit, bw = Math.max(1, 1.5 * unit);
    panel(ctx, x, y, w, h, r, { rim: bw });
    ctx.save();
    cutPath(ctx, x + bw, y + bw, w - 2 * bw, h - 2 * bw, Math.max(0, r - bw));
    ctx.clip();
    if (d.frame === "photo" && d.photo && d.photo.img) {
      drawCrop(ctx, d.photo.img, d.photo.crop, x, y, w, h);
    } else if (d.frame === "logo" && d.logo) {
      ellipse(ctx, x, y, w, h, x, y, w * 0.9, h * 0.7, [[0, rgba(BLUE, 0.11)], [1, rgba(BLUE, 0)]]);
      ellipse(ctx, x, y, w, h, x + w, y + h, w * 0.7, h * 0.75, [[0, rgba(PINK, 0.06)], [1, rgba(PINK, 0)]]);
      const ls = d.logoScale || 1;
      drawContain(ctx, d.logo, x + w * (0.5 - 0.34 * ls), y + h * (0.5 - 0.2 * ls), w * 0.68 * ls, h * 0.4 * ls);
    } else {
      ctx.fillStyle = "rgba(255,255,255,.06)"; ctx.fillRect(x, y, w, h);
      const fs = Math.max(9, Math.round(Math.min(w, h) * 0.055));
      text(ctx, d.frame === "logo" ? "YOUR LOGO" : "YOUR PHOTO", x + w / 2, y + h / 2 + fs * 0.35, T.label(fs, 500), "rgba(255,255,255,.55)", fs * T.labelTrack, "center");
    }
    ctx.restore();
    if (d.frame === "photo" && d.photo && d.photo.img) rimStroke(ctx, x, y, w, h, r, bw);
    if (d.mark) {
      // SpeakerCard "Moderator" tag: white chip, black caps, 8/0/8/0
      const fs = Math.round(15 * unit);
      const str = up(d.mark);
      const tw = measure(ctx, str, T.label(fs, 600), fs * 0.2);
      const bwid = tw + 32 * unit, bh = fs + 14 * unit;
      const bx = x + w / 2 - bwid / 2, by = y + h - bh - 18 * unit;
      cutPath(ctx, bx, by, bwid, bh, 8 * unit); ctx.fillStyle = "#FFFFFF"; ctx.fill();
      text(ctx, str, x + w / 2, by + bh / 2 + fs * 0.36, T.label(fs, 600), "#000000", fs * 0.2, "center");
    }
  }

  /* name block (SpeakerCard type): first name Geist 300, last name Geist 600, role Bricolage 64% */
  function splitName(n) {
    const parts = String(n || "").trim().split(/\s+/);
    if (parts.length < 2) return [null, parts[0] || ""];
    return [parts.slice(0, -1).join(" "), parts[parts.length - 1]];
  }
  function nameBlockHeight(d, s) {
    if (!d.nameBlock) return 0;
    let h = 0;
    if (d.nameBlock.logo) h += 60 * s + 22 * s;
    if (d.nameBlock.name) h += 54 * s;
    h += (d.nameBlock.subs || []).filter(Boolean).length * 36 * s;
    return h + 8 * s;
  }
  function drawName(ctx, name, x, y, w, maxPx, minPx, align, warn) {
    const [first, last] = splitName(up(name));
    const sp = (px) => (first ? measure(ctx, first + " ", T.nameLight(px), -0.02 * px) : 0);
    let px = Math.round(maxPx);
    for (; px > 8; px--) if (sp(px) + measure(ctx, last, T.nameBold(px), -0.03 * px) <= w) break;
    if (px < minPx) warn.push("The name is long, so it has been set smaller. A shorter version will read better.");
    const total = sp(px) + measure(ctx, last, T.nameBold(px), -0.03 * px);
    let cx = align === "center" ? x - total / 2 : x;
    if (first) { text(ctx, first + " ", cx, y, T.nameLight(px), T.fg, -0.02 * px, "left"); cx += sp(px); }
    text(ctx, last, cx, y, T.nameBold(px), T.fg, -0.03 * px, "left");
  }
  function drawNameBlock(ctx, d, x, yTop, w, s, align, warn) {
    const nb = d.nameBlock; if (!nb) return;
    let y = yTop;
    if (nb.logo) {
      const dh = 60 * s;
      drawContain(ctx, nb.logo, x - (align === "center" ? Math.min(w, 240 * s) / 2 : 0), y, Math.min(w, 240 * s), dh, align === "center" ? "center" : "left");
      y += dh + 22 * s;
    }
    if (nb.name) { drawName(ctx, nb.name, x, y + 44 * s, w, 52 * s, 32 * s, align, warn); y += 54 * s; }
    for (const sub of (nb.subs || []).filter(Boolean)) {
      const f = fitOne(ctx, sub, T.body, 0, w, 25 * s, 17 * s);
      if (f.small) warn.push("The job title or company is long, so it has been set smaller.");
      text(ctx, sub, x, y + 30 * s, T.body(f.px), T.sub, 0, align);
      y += 36 * s;
    }
  }

  /* Masthead, post-header lockup: eyebrow left, wordmark right, hairline. returns rule y */
  function postHeader(ctx, d, A, m, top, W, k) {
    const lh = 22 * k;
    drawLogo(ctx, A, W - m, top, lh, "right");
    const lw = lh * T.logoAspect;
    if (d.eyebrow) drawLabel(ctx, d.eyebrow, m, top + lh / 2 + 20 * k * 0.36, W - 2 * m - lw - 40 * k, 20 * k, T.fg, "left", 600);
    const ry = top + lh + 30 * k;
    ctx.fillStyle = T.rule; ctx.fillRect(m, ry, W - 2 * m, Math.max(1, 2 * k));
    return ry;
  }
  /* footer lockup: horizon, then the dates (no location, no website) */
  function postFooter(ctx, d, m, hy, W, k) {
    horizon(ctx, m, hy, W - 2 * m, 2.2 * k);
    const base = hy + 62 * k;
    drawDate(ctx, d, m, base, W - 2 * m, 21 * k, "left");
  }

  /* ---------- layouts ---------- */
  function layoutPost(ctx, d, W, H, A, warn) {
    const s = W / 1080, k = W / 1049;
    const story = H / W > 1.6;
    const m = 86 * k;
    const v = d.variant;
    drawBg(ctx, v, W, H, A, "post");
    const top = story ? 300 * s : 86 * k;
    const ry = postHeader(ctx, d, A, m, top, W, k);
    const hz = story ? 1540 * s : H * (1110 / 1311);
    postFooter(ctx, d, m, hz, W, k);
    const contentBottom = hz - 56 * k;
    const hasFrame = d.frame !== "none";
    const chipH = 66 * s;
    const nbH = nameBlockHeight(d, s);
    const headMax = 104.92 * k * (story ? 1.05 : 1);

    if (v !== "c") {
      const hy = ry + 64 * k;
      const fit = fitLines(ctx, d.lines, W - 2 * m, 360 * s, headMax, 52 * s);
      if (fit.small) warn.push("The headline has been set small to fit. It still exports, but it will be harder to read.");
      drawLines(ctx, d.lines, m, hy, fit.px, "left");
      const fy = hy + fit.h + 56 * k;
      const fh = contentBottom - fy;
      const fw = Math.min(fh * 0.8, W - 2 * m - 44 * s - 360 * s);
      const fx = v === "a" ? W - m - fw : m;
      const tx = v === "a" ? m : m + fw + 44 * s;
      const tw = W - 2 * m - fw - 44 * s;
      if (hasFrame) frame(ctx, d, fx, fy, fw, fh, s);
      let y = contentBottom;
      if (d.showCode) { y -= chipH; chip(ctx, tx, y, chipH, d.code, "left", { maxW: tw }); y -= 30 * s; }
      drawNameBlock(ctx, d, tx, y - nbH, tw, s, "left", warn);
    } else {
      const cx = W / 2;
      const hy = ry + 60 * k;
      const fit = fitLines(ctx, d.lines, W - 2 * m, 360 * s, headMax, 52 * s);
      if (fit.small) warn.push("The headline has been set small to fit. It still exports, but it will be harder to read.");
      drawLines(ctx, d.lines, cx, hy, fit.px, "center");
      let y = contentBottom;
      if (d.showCode) { y -= chipH; chip(ctx, cx, y, chipH, d.code, "center", { maxW: W - 2 * m }); y -= 30 * s; }
      y -= nbH;
      drawNameBlock(ctx, d, cx, y, W - 2 * m, s, "center", warn);
      const fy = hy + fit.h + 48 * k;
      const fh = y - 32 * s - fy;
      const fw = Math.min(fh * 0.8, W - 2 * m);
      if (hasFrame && fh > 60 * s) frame(ctx, d, cx - fw / 2, fy, fw, fh, s);
    }
  }

  /* Cover lockup: wordmark with the 2px horizon fitted to its width. returns bottom y */
  function coverLockup(ctx, A, x, y, lh, s) {
    const lw = drawLogo(ctx, A, x, y, lh, "left");
    const gap = Math.max(4, lh * 0.55);
    horizon(ctx, x, y + lh + gap, lw, Math.max(1, 2 * s));
    return y + lh + gap + Math.max(1, 2 * s);
  }

  /* Profile/LinkedIn banners: lockup, title and info row stacked with equal gaps, centred vertically */
  function layoutWideBalanced(ctx, d, W, H, A, warn) {
    drawBg(ctx, d.variant, W, H, A, "tile");
    const s = H / 400;
    const pad = Math.round(H * 0.12);
    const x0 = Math.max(pad, d.fmt.avoidLeft || 0);
    let xr = W - pad;
    if (d.frame !== "none") {
      const fh = H - 2 * pad, fw = Math.round(fh * 0.86);
      const fx = W - pad - fw;
      frame(ctx, Object.assign({}, d, { mark: null, logoScale: 1.3 }), fx, pad, fw, fh, s * 0.6);
      xr = fx - Math.round(48 * s);
    }
    const cwid = xr - x0;
    let lh = Math.min(30 * s, cwid / T.logoAspect);
    const lockH = lh + Math.max(4, lh * 0.55) + Math.max(1, 2 * s);
    const chipH = Math.max(22, 48 * s);
    const fs = Math.round(Math.max(8, 15 * s));
    let cw = 0;
    if (d.showCode) cw = chip(ctx, -9999, -9999, chipH, d.code, "left", { maxW: cwid });
    const sx = x0 + (cw ? cw + 24 * s : 0);
    const beside = fitOne(ctx, dateline(d), T.date, T.dateTrack, xr - sx, fs, fs * 0.8);
    const stackInfo = d.showCode && beside.small;
    const dateFit = stackInfo || !d.showCode ? fitOne(ctx, dateline(d), T.date, T.dateTrack, cwid, fs, 6) : beside;
    const infoH = d.showCode ? (stackInfo ? dateFit.px + 16 * s + chipH : chipH) : dateFit.px;
    const maxGap = 46 * s, minGap = 18 * s;
    const avail = H - 2 * pad;
    const fit = fitLines(ctx, d.lines, cwid, avail - lockH - infoH - 2 * minGap, 78 * s, 26 * s);
    if (fit.small) warn.push("Some text has been set small to fit this banner.");
    const headH = fit.h;
    const gap = Math.max(minGap, Math.min(maxGap, (avail - lockH - headH - infoH) / 2));
    let y = pad + (avail - (lockH + headH + infoH + 2 * gap)) / 2;
    coverLockup(ctx, A, x0, y, lh, s);
    y += lockH + gap;
    drawLines(ctx, d.lines, x0, y, fit.px, "left");
    y += headH + gap;
    if (d.showCode) {
      if (stackInfo) {
        text(ctx, dateline(d), x0, y + dateFit.px * 0.74, T.date(dateFit.px), T.dateInk, dateFit.px * T.dateTrack, "left");
        y += dateFit.px + 16 * s;
        chip(ctx, x0, y, chipH, d.code, "left", { maxW: cwid });
      } else {
        chip(ctx, x0, y, chipH, d.code, "left", { maxW: cwid });
        text(ctx, dateline(d), sx, y + chipH / 2 + dateFit.px * 0.36, T.date(dateFit.px), T.dateInk, dateFit.px * T.dateTrack, "left");
      }
    } else {
      text(ctx, dateline(d), x0, y + dateFit.px * 0.74, T.date(dateFit.px), T.dateInk, dateFit.px * T.dateTrack, "left");
    }
  }

  function layoutWide(ctx, d, W, H, A, warn) {
    if (H < 120) return layoutStrip(ctx, d, W, H, A, warn);
    if (d.bigLogo) return layoutWideBalanced(ctx, d, W, H, A, warn);
    drawBg(ctx, d.variant, W, H, A, "tile");
    const s = H / 400;
    const pad = Math.round(H * 0.12);
    const x0 = Math.max(pad, d.fmt.avoidLeft || 0);
    let xr = W - pad;
    if (d.frame !== "none") {
      const fh = H - 2 * pad, fw = Math.round(fh * 0.86);
      const fx = W - pad - fw;
      frame(ctx, Object.assign({}, d, { mark: null, logoScale: 1.3 }), fx, pad, fw, fh, s * 0.6);
      xr = fx - Math.round(44 * s);
    }
    const lh = Math.min(Math.max(9, 24 * s), (xr - x0) / T.logoAspect);
    const lockBottom = coverLockup(ctx, A, x0, pad, lh, s);
    const chipH = Math.max(22, 50 * s);
    const fs = Math.round(Math.max(8, 15 * s));
    const cy = H - pad - chipH;
    let cw = 0;
    if (d.showCode) cw = chip(ctx, -9999, -9999, chipH, d.code, "left", { maxW: xr - x0 });
    const sx = x0 + (cw ? cw + 24 * s : 0);
    const besideFit = fitOne(ctx, dateline(d), T.date, T.dateTrack, xr - sx, fs, fs * 0.72);
    const ownRow = d.showCode && besideFit.small;
    const rowFit = ownRow ? fitOne(ctx, dateline(d), T.date, T.dateTrack, xr - x0, fs, 6) : besideFit;
    const subRowH = ownRow ? rowFit.px * 2.2 : 0;
    const hy = lockBottom + 28 * s;
    const bottomUsed = d.showCode ? chipH + subRowH : rowFit.px * 1.2;
    const maxH = H - pad - bottomUsed - 24 * s - hy;
    if (d.lines.length && maxH > 12) {
      const hl = d.fmt.oneLine ? oneLine(d.lines) : d.lines;
      const fit = fitLines(ctx, hl, xr - x0, maxH, 84 * s, 26 * s);
      if (fit.small) warn.push("Some text has been set small to fit this banner.");
      drawLines(ctx, hl, x0, hy, fit.px, "left");
    }
    const D = (x, y, f) => text(ctx, dateline(d), x, y, T.date(f.px), T.dateInk, f.px * T.dateTrack, "left");
    if (d.showCode) chip(ctx, x0, cy, chipH, d.code, "left", { maxW: xr - x0 });
    if (ownRow) D(x0, cy - rowFit.px * 0.9, rowFit);
    else if (d.showCode) D(sx, cy + chipH / 2 + rowFit.px * 0.36, rowFit);
    else D(x0, H - pad, rowFit);
  }

  function layoutStrip(ctx, d, W, H, A, warn) {
    drawBg(ctx, d.variant, W, H, A, "tile");
    const pad = Math.round(H * 0.2);
    const lh = H * 0.17;
    const lw = drawLogo(ctx, A, pad, (H - lh) / 2, lh, "left");
    const chipH = Math.round(H * 0.56);
    let cw = 0;
    if (d.showCode) cw = chip(ctx, W - pad, (H - chipH) / 2, chipH, d.code, "right", { maxW: W * 0.42 });
    const x0 = pad + lw + pad * 1.2;
    const xr = W - pad - cw - (cw ? pad * 1.1 : 0);
    if (xr - x0 < 40) return;
    // vertical horizon divider between the wordmark and the line
    const g = ctx.createLinearGradient(0, H * 0.22, 0, H * 0.78);
    g.addColorStop(0, rgba(BLUE, 0.7)); g.addColorStop(1, rgba(PINK, 0.7));
    ctx.fillStyle = g; ctx.fillRect(x0 - pad * 0.6, H * 0.22, Math.max(1, H / 90), H * 0.56);
    const one = oneLine(d.lines);
    const showSub = H >= 80;
    let f = fitLines(ctx, one, xr - x0, H * (showSub ? 0.42 : 0.6), H * (showSub ? 0.34 : 0.4), 11);
    if (f.small) {
      // too long for one line: set the headline on its own lines and drop the dateline
      const two = d.lines.length > 1 ? d.lines : wrapWords(ctx, d.lines, xr - x0, H * 0.3);
      const f2 = fitLines(ctx, two, xr - x0, H * 0.62, H * 0.3, 10);
      if (f2.small) return;
      drawLines(ctx, two, x0, (H - f2.h) / 2, f2.px, "left");
      return;
    }
    const yTop = showSub ? H * 0.2 : (H - f.px * 0.74) / 2;
    drawLines(ctx, one, x0, yTop, f.px, "left");
    if (showSub) {
      let str = dateline(d);
      let sf = fitOne(ctx, str, T.date, T.dateTrack, xr - x0, Math.round(H * 0.12), 7);
      if (sf.small) { str = up(d.dates); sf = fitOne(ctx, str, T.date, T.dateTrack, xr - x0, Math.round(H * 0.12), 6); }
      text(ctx, str, x0, H * 0.8, T.date(sf.px), T.dateInk, sf.px * T.dateTrack, "left");
    }
  }

  function layoutTall(ctx, d, W, H, A, warn) {
    drawBg(ctx, d.variant, W, H, A, "tile");
    const s = W / 160;
    const pad = 14 * s;
    const iw = W - 2 * pad;
    const lh = Math.max(7, iw / T.logoAspect);
    drawLogo(ctx, A, pad, 28 * s, lh, "left");
    const ry = 28 * s + lh + 16 * s;
    horizon(ctx, pad, ry, iw, Math.max(1, 1.2 * s));
    const hy = ry + 26 * s;
    const chipH = 64 * s;
    const bottomZone = (d.showCode ? chipH + 22 * s : 0) + 22 * s + pad;
    const maxH = Math.min(240 * s, H - bottomZone - hy - 70 * s);
    // narrow column: re-wrap word by word at the largest size that fits
    let best = null;
    for (let px = Math.round(34 * s); px >= 12; px--) {
      const ls = wrapWords(ctx, d.lines, iw, px);
      const f0 = fitLines(ctx, ls, iw, Math.max(20, maxH), px, 16 * s);
      if (f0.px === px) { best = { ls, f: f0 }; break; }
    }
    if (!best) { const ls = wrapWords(ctx, d.lines, iw, 12); best = { ls, f: fitLines(ctx, ls, iw, Math.max(20, maxH), 12, 16 * s) }; }
    const f = best.f;
    if (f.small) warn.push("The headline has been set small to fit this tall banner.");
    drawLines(ctx, best.ls, pad, hy, f.px, "left");
    const y = hy + f.h + 28 * s;
    const fs = Math.round(9 * s);
    const f1 = fitOne(ctx, up(d.dates), T.date, T.dateTrack, iw, fs, 5);
    text(ctx, up(d.dates), pad, y + f1.px, T.date(f1.px), T.dateInk, f1.px * T.dateTrack, "left");
    if (d.showCode) chip(ctx, pad, H - pad - chipH - 22 * s, chipH, d.code, "left", { stacked: true, width: iw });
  }

  function layoutBox(ctx, d, W, H, A, warn) {
    drawBg(ctx, d.variant, W, H, A, "tile");
    const s = Math.min(W / 300, H / 250);
    const pad = 20 * s;
    const lh = Math.min(12 * s, (W - 2 * pad) / T.logoAspect);
    const lockBottom = coverLockup(ctx, A, pad, pad, lh, s * 0.8);
    const hy = lockBottom + 18 * s;
    const chipH = 38 * s;
    const fs = Math.round(9 * s);
    const bottom = H - pad - (d.showCode ? chipH + 16 * s : 0);
    const maxH = bottom - fs * 2.2 - hy;
    const f = fitLines(ctx, d.lines, W - 2 * pad, maxH, 44 * s * Math.max(1, Math.min(1.6, (H / W) / (250 / 300))), 18 * s);
    if (f.small) warn.push("The headline has been set small to fit this banner.");
    drawLines(ctx, d.lines, pad, hy, f.px, "left");
    drawDate(ctx, d, pad, bottom, W - 2 * pad, fs, "left");
    if (d.showCode) chip(ctx, pad, H - pad - chipH, chipH, d.code, "left", { maxW: W - 2 * pad });
  }

  /* badge geometry shared by PNG and SVG */
  function badgeGeom() {
    return {
      W: 1200, H: 600, r: 60, rim: 2.4,
      label: { x: 600, y: 138, px: 26 },
      ev: { x: 110, y: 230, w: 400, h: 140 },
      rule: { x: 600, y1: 215, y2: 385 },
      pl: { x: 690, y: 215, w: 400, h: 170 },
      hz: { x: 380, y: 452, w: 440, h: 2.2 },
      foot: { x: 600, y: 512, px: 20 }
    };
  }
  function layoutBadge(ctx, d, W, H, A, warn) {
    const g = badgeGeom();
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    cutPath(ctx, 0, 0, W, H, g.r); ctx.clip();
    tileBg(ctx, 0, 0, W, H);
    ctx.restore();
    // rim
    ctx.beginPath(); pathInto(ctx, 0, 0, W, H, g.r); pathInto(ctx, g.rim, g.rim, W - 2 * g.rim, H - 2 * g.rim, g.r - g.rim);
    ctx.fillStyle = cssLinear(ctx, 0, 0, W, H, 135, [[0, rgba(BLUE, 0.6)], [0.42, "rgba(255,255,255,.07)"], [0.6, "rgba(255,255,255,.05)"], [1, rgba(PINK, 0.5)]]);
    ctx.fill("evenodd");
    const lab = up(d.badgeLabel || "Official Partner");
    text(ctx, lab, g.label.x, g.label.y, T.label(g.label.px, 600), T.fg, g.label.px * T.labelTrack, "center");
    const eh = Math.min(g.ev.h, g.ev.w / T.logoAspect);
    drawLogo(ctx, A, g.ev.x + g.ev.w / 2, g.ev.y + (g.ev.h - eh) / 2, eh, "center");
    ctx.fillStyle = T.rule; ctx.fillRect(g.rule.x, g.rule.y1, 2, g.rule.y2 - g.rule.y1);
    if (d.logo) drawContain(ctx, d.logo, g.pl.x, g.pl.y, g.pl.w, g.pl.h);
    else text(ctx, "YOUR LOGO", g.pl.x + g.pl.w / 2, g.pl.y + g.pl.h / 2 + 10, T.label(24, 500), "rgba(255,255,255,.5)", 24 * T.labelTrack, "center");
    horizon(ctx, g.hz.x, g.hz.y, g.hz.w, g.hz.h);
    const ff = fitOne(ctx, dateline(d), T.date, T.dateTrack, 1000, g.foot.px, 8);
    d.footPx = ff.px;
    text(ctx, dateline(d), g.foot.x, g.foot.y, T.date(ff.px), T.dateInk, ff.px * T.dateTrack, "center");
  }

  /* SVG badge. labelB64 / dateB64 = base64 TTFs for the label (Bricolage) and dateline (Geist) */
  function badgeSVG(evId, d, eventLogoDataUrl, partnerPngDataUrl, partnerSize, labelB64, dateB64) {
    const g = badgeGeom();
    const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const r = g.r, ri = g.r - g.rim, b = g.rim;
    const shape = `M${r},0 H1200 V${600 - r} A${r},${r} 0 0 1 ${1200 - r},600 H0 V${r} A${r},${r} 0 0 1 ${r},0 Z`;
    const inner = `M${b + ri},${b} H${1200 - b} V${600 - b - ri} A${ri},${ri} 0 0 1 ${1200 - b - ri},${600 - b} H${b} V${b + ri} A${ri},${ri} 0 0 1 ${b + ri},${b} Z`;
    const eh = Math.min(g.ev.h, g.ev.w / T.logoAspect), ew = eh * T.logoAspect;
    let pl = "";
    if (partnerPngDataUrl && partnerSize) {
      const sc = Math.min(g.pl.w / partnerSize.w, g.pl.h / partnerSize.h);
      const pw = partnerSize.w * sc, ph = partnerSize.h * sc;
      pl = `<image href="${partnerPngDataUrl}" x="${(g.pl.x + (g.pl.w - pw) / 2).toFixed(1)}" y="${(g.pl.y + (g.pl.h - ph) / 2).toFixed(1)}" width="${pw.toFixed(1)}" height="${ph.toFixed(1)}"/>`;
    }
    const lab = esc(up(d.badgeLabel || "Official Partner"));
    const foot = esc(dateline(d));
    const footPx = d.footPx || g.foot.px;
    const stops = (c, a) => [0, 0.25, 0.5, 0.75, 1].map((o, i) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${(a * [1, 0.72, 0.38, 0.12, 0][i]).toFixed(4)}"/>`).join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600">
<defs>
<radialGradient id="gb" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(-96 -48) scale(1296 558)">${stops(BLUE, 0.42)}</radialGradient>
<radialGradient id="gp" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(1320 300) scale(576 438)">${stops(PINK, 0.26)}</radialGradient>
<linearGradient id="rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${BLUE}" stop-opacity=".6"/><stop offset=".42" stop-color="#fff" stop-opacity=".07"/><stop offset=".6" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="${PINK}" stop-opacity=".5"/></linearGradient>
<linearGradient id="hz" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${BLUE}" stop-opacity=".7"/><stop offset="1" stop-color="${PINK}" stop-opacity=".7"/></linearGradient>
<style>@font-face{font-family:"BadgeLabel";src:url(data:font/ttf;base64,${labelB64 || ""}) format("truetype");font-weight:200 800;}
@font-face{font-family:"BadgeDate";src:url(data:font/ttf;base64,${dateB64 || ""}) format("truetype");font-weight:100 900;}
.l{font-family:"BadgeLabel",Arial,sans-serif;font-weight:600}.d{font-family:"BadgeDate",Arial,sans-serif;font-weight:600}</style></defs>
<path d="${shape}" fill="#000"/>
<path d="${shape}" fill="url(#gb)"/>
<path d="${shape}" fill="url(#gp)"/>
<path d="${shape} ${inner}" fill="url(#rim)" fill-rule="evenodd"/>
<text class="l" x="${g.label.x}" y="${g.label.y}" text-anchor="middle" font-size="${g.label.px}" letter-spacing="${(g.label.px * T.labelTrack).toFixed(2)}" fill="#FFFFFF">${lab}</text>
<image href="${eventLogoDataUrl}" x="${(g.ev.x + (g.ev.w - ew) / 2).toFixed(1)}" y="${(g.ev.y + (g.ev.h - eh) / 2).toFixed(1)}" width="${ew.toFixed(1)}" height="${eh.toFixed(1)}"/>
<rect x="${g.rule.x}" y="${g.rule.y1}" width="2" height="${g.rule.y2 - g.rule.y1}" fill="#FFFFFF" fill-opacity=".26"/>
${pl}
<rect x="${g.hz.x}" y="${g.hz.y}" width="${g.hz.w}" height="${g.hz.h}" fill="url(#hz)"/>
<text class="d" x="${g.foot.x}" y="${g.foot.y}" text-anchor="middle" font-size="${footPx}" letter-spacing="${(footPx * T.dateTrack).toFixed(2)}" fill="#FFFFFF" fill-opacity=".7">${foot}</text>
</svg>`;
  }

  function drawSafe(ctx, fmt) {
    if (!fmt.safe) return;
    const s = fmt.w / 1080;
    ctx.save();
    for (const [x, y, w, h, label] of fmt.safe) {
      ctx.fillStyle = "rgba(255,72,72,.28)"; ctx.fillRect(x, y, w, h);
      ctx.setLineDash([10, 8]); ctx.lineWidth = 3; ctx.strokeStyle = "rgba(255,120,120,.95)"; ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
      const fs = Math.max(14, Math.round(26 * Math.max(s, 0.8)));
      ctx.font = `600 ${fs}px Arial, sans-serif`;
      if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
      ctx.fillStyle = "#FFFFFF"; ctx.textAlign = "center";
      ctx.fillText(label + " · may be covered", x + w / 2, y + h / 2 + fs * 0.35);
    }
    ctx.restore();
  }

  /* ---------- entry ---------- */
  function render(canvas, d, A, opts) {
    opts = opts || {};
    const fmt = d.fmt;
    canvas.width = fmt.w; canvas.height = fmt.h;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    const warn = [];
    d.lines = normLines(d.headline);
    const L = { post: layoutPost, wide: layoutWide, tall: layoutTall, box: layoutBox, badge: layoutBadge }[fmt.layout];
    L(ctx, d, fmt.w, fmt.h, A, warn);
    if (opts.safe) drawSafe(ctx, fmt);
    return { warnings: Array.from(new Set(warn)) };
  }

  window.StudioRender = { render, badgeSVG, drawCrop, THEMES: { machina: T } };
})();
