/* =====================================================================
   APP — studio shell, state, forms, previews, exports.
   Copy and settings come from config.js (window.STUDIO_CONFIG).
   ===================================================================== */
(function () {
  "use strict";
  const C = window.STUDIO_CONFIG;
  const R = window.StudioRender;
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
  const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const isPh = (s) => typeof s === "string" && /\[[^\]]+\]/.test(s);
  const hl = (s) => esc(s).replace(/\[[^\]]+\]/g, (m) => `<span class="ph">${m}</span>`);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /* ---------- state ---------- */
  const STORE = "ads-studio-v1";
  const S = {
    view: "door", kit: null, ev: null, tab: "create",
    vals: {}, ambType: "founding", code: "", showCode: true, customSizes: [], variant: "a", asset: null,
    safe: false, mocks: true,
    photo: null, photoOrig: null, photoCut: null, useCut: false, crop: { cx: 0.5, cy: 0.42, z: 1 },
    rep: null, repCrop: { cx: 0.5, cy: 0.42, z: 1 },
    logoRaw: null, logoMode: "white", logoProc: null,
    answers: {}, editedCaptions: {}
  };
  function load() {
    try {
      const j = JSON.parse(localStorage.getItem(STORE) || "null");
      if (j && typeof j === "object") {
        ["kit", "ev", "vals", "ambType", "code", "showCode", "customSizes", "variant", "answers"].forEach((k) => { if (j[k] != null) S[k] = j[k]; });
        if (SINGLE) S.ev = SINGLE;
        /* always open on the landing page; saved details are kept for when they pick a kit */
      }
    } catch (e) { /* storage unavailable: start fresh */ }
  }
  function save() {
    try {
      localStorage.setItem(STORE, JSON.stringify({ kit: S.kit, ev: S.ev, vals: S.vals, ambType: S.ambType, code: S.code, showCode: S.showCode, customSizes: S.customSizes, variant: S.variant, answers: S.answers }));
    } catch (e) { /* ignore */ }
  }

  const EVENT_IDS = Object.keys(C.events);
  const SINGLE = EVENT_IDS.length === 1 ? EVENT_IDS[0] : null;
  const HOME_EV = SINGLE || EVENT_IDS[0];
  const KIT = () => C.kits[S.kit];
  const CODE_EX = () => (KIT() && KIT().codeExample) || CODE_EX();
  const EV = () => C.events[S.ev];
  /* custom banner sizes become runtime formats */
  function customId(w, h) { return `custom_${w}x${h}`; }
  function registerCustom(w, h) {
    const id = customId(w, h);
    if (!C.formats[id]) {
      const r = w / h;
      const layout = r >= 2.2 ? "wide" : r <= 1 / 1.6 ? "tall" : "box";
      C.formats[id] = { label: "Custom " + w + "×" + h, w, h, layout, channel: "web_banner", ext: "jpg", fileName: "Custom" + w + "x" + h, ad: true, custom: true };
    }
    return id;
  }
  function fmtsOf(asset) {
    const base = asset.formats.slice();
    if (S.kit === "media" && C.customSize && C.customSize.assets.includes(asset.id)) {
      for (const c of S.customSizes) base.push(registerCustom(c.w, c.h));
    }
    return base;
  }
  const AMB = () => (KIT().ambassadorTypes || []).find((t) => t.id === S.ambType) || null;

  /* ---------- assets per event ---------- */
  const ASSETS = { raise: null, machina: null };
  function loadImg(src) {
    return new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  }
  async function eventAssets(id) {
    if (ASSETS[id]) return ASSETS[id];
    const p = id === "raise"
      ? Promise.all([loadImg("assets/raise/raise-summit-logo-white.svg"), loadImg("assets/raise/bg-indigo-glow-2.webp"), loadImg("assets/raise/bg-indigo-sweep.webp"), loadImg("assets/raise/bg-rays-dark-2.webp")])
          .then(([logo, a, b, c]) => ({ logo, bg: { a, b, c } }))
      : Promise.all([loadImg("assets/machina/machina-wordmark-white.svg"), loadImg("assets/machina/black-material-texture.jpg")])
          .then(([logo, material]) => ({ logo, material, bg: {} }));
    ASSETS[id] = await p;
    return ASSETS[id];
  }
  let fontsReady = null;
  function loadFonts() {
    if (fontsReady) return fontsReady;
    const byEv = {
      raise: ["500 40px RJakarta", "600 40px RJakarta", "700 40px RJakarta", "400 40px RJakarta", "italic 500 40px RPlayfair"],
      machina: ["600 40px MBlauer", "400 40px MBricolage", "500 40px MBricolage", "600 40px MBricolage", "300 40px MGeist", "600 40px MGeist", "500 40px MGeistMono"]
    };
    const faces = EVENT_IDS.reduce((acc, id) => acc.concat(byEv[id] || []), []);
    fontsReady = Promise.all(faces.map((f) => document.fonts.load(f).catch(() => null))).then(() => document.fonts.ready);
    return fontsReady;
  }

  /* ---------- copy helpers ---------- */
  function fieldVal(id) {
    const v = (S.vals[S.kit] || {})[id];
    return (v || "").trim();
  }
  function fieldOrPh(id) {
    const f = KIT().fields.find((x) => x.id === id);
    return fieldVal(id) || (f ? f.placeholder : "");
  }
  function trackingLink(channel) {
    const e = EV();
    return C.tracking.template
      .replace("{base}", e.baseUrl)
      .replace("{kit}", encodeURIComponent(KIT().utmSource))
      .replace("{channel}", encodeURIComponent(channel || C.tracking.defaultChannel))
      .replace("{campaign}", encodeURIComponent(e.campaign))
      .replace("{code}", encodeURIComponent(S.code || CODE_EX()));
  }
  function vars(channel) {
    const e = EV(), amb = AMB();
    const name = fieldOrPh("name");
    return {
      name, first: name.split(" ")[0],
      jobTitle: fieldOrPh("jobTitle"), company: fieldOrPh("company"),
      outlet: fieldOrPh("outlet"), rep: fieldVal("rep") || "[YOUR NAME]", title: fieldVal("title"),
      event: e.name, eventShort: e.short, year: e.year, dates: e.dates, venue: e.venue, city: e.city,
      code: S.code || CODE_EX(), link: trackingLink(channel), handle: e.handles.linkedin,
      hashtags: e.hashtags.join(" "), whyAttend: e.whyAttend,
      ambTitle: amb ? amb.title : "", ambPrefix: amb ? (amb.prefix || "") : "", ambType: amb ? amb.label : "",
      ambArticle: amb && /^[aeiou]/i.test(amb.title) ? "an" : "a",
      topic: S.ev === "machina" ? "physical AI" : "AI"
    };
  }
  const fill = (str, v) => String(str).replace(/\{(\w+)\}/g, (m, k) => (v[k] != null ? v[k] : m)).replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n").trim();
  /* like fill, but keeps a run's leading/trailing spaces (e.g. "Founding " + "Ambassador") */
  const fillRun = (str, v) => { const t = String(str), a = t.match(/^\s*/)[0], f = fill(t, v); return f ? a + f + (t.length > a.length ? t.match(/\s*$/)[0] : "") : ""; };

  /* ---------- logo processing: knock out to solid white ---------- */
  function processLogo(img, mode) {
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    const sc = Math.min(1, 1600 / Math.max(iw, ih));
    const w = Math.max(1, Math.round(iw * sc)), h = Math.max(1, Math.round(ih * sc));
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const x = c.getContext("2d"); x.drawImage(img, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h), p = d.data;
    let hasAlpha = false;
    for (let i = 3; i < p.length; i += 16) if (p[i] < 245) { hasAlpha = true; break; }
    if (mode === "white") {
      if (hasAlpha) {
        for (let i = 0; i < p.length; i += 4) { p[i] = p[i + 1] = p[i + 2] = 255; }
      } else {
        // no transparency: treat light pixels as background, dark ones as the mark
        let sum = 0, n = 0;
        for (let i = 0; i < p.length; i += 4 * 7) { sum += 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2]; n++; }
        const lightBg = sum / n > 128;
        for (let i = 0; i < p.length; i += 4) {
          const L = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
          let a = lightBg ? 255 - L : L;
          a = Math.max(0, Math.min(255, (a - 20) * 1.35));
          p[i] = p[i + 1] = p[i + 2] = 255; p[i + 3] = a;
        }
      }
      x.putImageData(d, 0, 0);
    }
    // trim transparent edges
    const t = x.getImageData(0, 0, w, h).data;
    let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      if (t[(yy * w + xx) * 4 + 3] > 12) { if (xx < minX) minX = xx; if (xx > maxX) maxX = xx; if (yy < minY) minY = yy; if (yy > maxY) maxY = yy; }
    }
    if (maxX < 0) return c;
    const o = document.createElement("canvas"); o.width = maxX - minX + 1; o.height = maxY - minY + 1;
    o.getContext("2d").drawImage(c, minX, minY, o.width, o.height, 0, 0, o.width, o.height);
    return o;
  }

  /* ---------- render data ---------- */
  function frameFor(asset, fmt) {
    const k = S.kit;
    if (fmt.ad || fmt.layout === "badge") return "none";
    if (k === "ambassador") {
      if (fmt.layout === "wide" && fmt.w > 1000) return "none"; // profile banners: your profile photo is already there
      return "photo";
    }
    if (fmt.layout === "post") return S.rep ? "photo" : "logo";
    return "logo";
  }
  function buildData(asset, fmtId, variant) {
    const fmt = C.formats[fmtId], e = EV(), v = vars(fmt.channel), amb = AMB();
    const fr = frameFor(asset, fmt);
    let nameBlock = null;
    if (fmt.layout === "post") {
      if (S.kit === "ambassador") nameBlock = { name: v.name, subs: [v.jobTitle, v.company] };
      else if (S.kit === "partner") {
        const rep = fieldVal("rep"), title = fieldVal("title");
        nameBlock = S.rep && rep ? { logo: S.logoProc, name: rep, subs: [title, v.company] }
          : { name: v.company, subs: [[rep, title].filter(Boolean).join(", ")] };
      } else {
        const rep = fieldVal("rep");
        nameBlock = S.rep && rep ? { logo: S.logoProc, name: rep, subs: [v.outlet] } : { name: v.outlet, subs: [rep] };
      }
    }
    return {
      fmt, event: S.ev, variant,
      headline: (asset.headline || []).map((l) => (Array.isArray(l) ? l.map((r) => ({ t: fillRun(r.t, v), s: r.s })) : { t: fillRun(l.t, v), s: l.s })),
      bigLogo: !!asset.bigLogo,
      where: fill(KIT().location || "{city}", v),
      whereLines: (KIT().locationLines || [KIT().location || "{city}"]).map((x) => fill(x, v)),
      frame: fr,
      photo: fr === "photo" ? (S.kit === "ambassador" ? (S.photo ? { img: S.photo, crop: S.crop } : null) : (S.rep ? { img: S.rep, crop: S.repCrop } : null)) : null,
      logo: S.logoProc,
      mark: S.kit === "ambassador" && amb && amb.mark && fmt.layout === "post" ? amb.mark : null,
      nameBlock,
      showCode: S.showCode && asset.showCode !== false && fmt.layout !== "badge",
      code: S.code || CODE_EX(),
      dates: e.dates, place: fill(KIT().mastheadPlace || "{venue}", v), city: e.city, url: e.url, tagline: e.tagline.join(" "),
      eventName: e.name, year: e.year, badgeLabel: asset.badgeLabel, eyebrow: asset.eyebrow || asset.label
    };
  }

  /* ---------- file names ---------- */
  function personSlug() {
    const n = S.kit === "ambassador" ? fieldOrPh("name") : S.kit === "partner" ? fieldOrPh("company") : fieldOrPh("outlet");
    return (n.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "") || "Name");
  }
  function fileName(asset, fmtId, ext) {
    const fmt = C.formats[fmtId];
    const shared = KIT().assets.filter((a) => fmtsOf(a).includes(fmtId)).length > 1;
    const tag = shared ? asset.id.replace(/(^|[^a-z])([a-z])/g, (m, p, c) => c.toUpperCase()).replace(/^./, (c) => c.toUpperCase()) + "-" : "";
    return `${EV().fileTag}_${KIT().label}_${tag}${fmt.fileName}_${personSlug()}.${ext || fmt.ext}`;
  }

  /* ---------- exports ---------- */
  const canvasBlob = (c, type, q) => new Promise((res) => c.toBlob(res, type, q));
  async function exportBlob(asset, fmtId) {
    const fmt = C.formats[fmtId];
    const A = await eventAssets(S.ev);
    const c = document.createElement("canvas");
    R.render(c, buildData(asset, fmtId, S.variant), A, {});
    if (fmt.ext === "png") return { blob: await canvasBlob(c, "image/png"), name: fileName(asset, fmtId) };
    let q = 0.92, b = await canvasBlob(c, "image/jpeg", q);
    if (fmt.ad) {
      while (b.size > C.adMaxKB * 1024 && q > 0.35) { q -= 0.06; b = await canvasBlob(c, "image/jpeg", q); }
    }
    return { blob: b, name: fileName(asset, fmtId), kb: Math.round(b.size / 1024), q };
  }
  const b64 = (buf) => { let s = ""; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
  async function exportBadgeSVG(asset) {
    const e = EV();
    const logoFile = S.ev === "raise" ? "assets/raise/raise-summit-logo-white.svg" : "assets/machina/machina-wordmark-white.svg";
    const fontFile = S.ev === "raise" ? "assets/fonts/PlusJakartaSans-VariableFont_wght.ttf" : "assets/fonts/BricolageGrotesque-Variable.ttf";
    const [svgTxt, fontBuf, dateBuf] = await Promise.all([fetch(logoFile).then((r) => r.text()), fetch(fontFile).then((r) => r.arrayBuffer()), fetch("assets/fonts/Geist-Variable.ttf").then((r) => r.arrayBuffer())]);
    const logoUrl = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgTxt)));
    const pl = S.logoProc ? S.logoProc.toDataURL("image/png") : null;
    const d = buildData(asset, "badge", "a");
    R.render(document.createElement("canvas"), d, await eventAssets(S.ev), {});
    const svg = R.badgeSVG(S.ev, d, logoUrl, pl, S.logoProc ? { w: S.logoProc.width, h: S.logoProc.height } : null, b64(fontBuf), b64(dateBuf));
    return { blob: new Blob([svg], { type: "image/svg+xml" }), name: fileName(asset, "badge", "svg") };
  }

  let dlCap = null;
  function downloadsCap() {
    if (dlCap) return dlCap;
    dlCap = (window.claude && typeof window.claude.use === "function") ? window.claude.use("downloads").catch(() => null) : Promise.resolve(null);
    return dlCap;
  }
  async function saveFile(name, blob) {
    const dl = await downloadsCap();
    if (dl) {
      try { await dl.save({ filename: name, data: blob }); toast("Saved " + name); return true; }
      catch (err) {
        const code = err && err.code;
        if (code === "declined") return false;
        if (code === "rate_limited") { toast("A save prompt is already open."); return false; }
        if (code !== "unavailable" && code !== "not_granted") { toast("That file could not be saved here."); return false; }
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast("Downloaded " + name);
    return true;
  }
  async function zipAll(onlyAsset) {
    if (!window.JSZip) { toast("ZIP is not available right now. Download files one by one."); return; }
    const zip = new window.JSZip();
    const list = onlyAsset ? [onlyAsset] : KIT().assets;
    for (const a of list) {
      for (const f of fmtsOf(a)) {
        const r = await exportBlob(a, f);
        zip.file(r.name, r.blob);
        if (C.formats[f].svg) { const s = await exportBadgeSVG(a); zip.file(s.name, s.blob); }
      }
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const part = onlyAsset ? onlyAsset.id.charAt(0).toUpperCase() + onlyAsset.id.slice(1) : "All";
    await saveFile(`${EV().fileTag}_${KIT().label}_${part}_${personSlug()}.zip`, blob);
  }

  /* ---------- toast + copy ---------- */
  let toastT = null;
  function toast(msg) {
    let t = $(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2200);
  }
  async function copyText(str, el) {
    try { await navigator.clipboard.writeText(str); toast("Copied"); }
    catch (e) {
      if (el) { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
      toast("Selected. Press Ctrl+C or Cmd+C to copy.");
    }
  }

  /* ================================================================= */
  /* VIEWS                                                              */
  /* ================================================================= */
  const app = () => $("#app");

  function header() {
    const ev = (S.view === "press" || S.view === "gallery") ? S.pressEv : (S.view === "studio" && S.ev ? S.ev : HOME_EV);
    const logo = ev === "machina" ? "assets/machina/machina-wordmark-white.svg" : "assets/raise/raise-summit-logo-white.svg";
    const crumbs = [];
    if (S.view === "gallery") {
      crumbs.push(`<button class="pill" data-act="press" data-ev="${S.pressEv}">Press room</button>`);
      crumbs.push(`<button class="pill" data-act="home">Make assets</button>`);
    } else if (S.view === "press") {
      if (C.gallery) crumbs.push(`<button class="pill" data-act="gallery">Event gallery</button>`);
      if (!SINGLE) crumbs.push(`<button class="pill" data-act="press" data-ev="${S.pressEv === "raise" ? "machina" : "raise"}" title="Switch event">Switch to ${S.pressEv === "raise" ? "MACHINA" : "RAISE"}</button>`);
      crumbs.push(`<button class="pill" data-act="home">Make assets</button>`);
    } else
    {
    if (S.kit && S.view !== "door") crumbs.push(`<button class="pill" data-act="to-door" title="Change who you are">${esc(KIT().label)}</button>`);
    if (!SINGLE && S.ev && S.view === "studio") crumbs.push(`<button class="pill" data-act="to-event" title="Change event">${esc(EV().short)} ${esc(EV().year)}</button>`);
    if (S.view !== "door") crumbs.push(`<button class="pill" data-act="reset">Start over</button>`);
    if (S.view === "door") crumbs.push(`<button class="pill" data-act="press" data-ev="${HOME_EV}">Press room</button>`);
    if (S.view === "door" && C.gallery) crumbs.push(`<button class="pill" data-act="gallery">Event gallery</button>`);
    }
    $("#top").innerHTML = `<div class="wrap">
      <button class="brand" data-act="to-door" aria-label="Back to start"><img src="${logo}" alt="${ev === "machina" ? "MACHINA" : "RAISE Summit"}"><span class="studio">${esc(C.studioName)}</span></button>
      <div class="crumbs">${crumbs.join("")}</div></div>`;
  }

  function viewDoor() {
    document.body.dataset.ev = HOME_EV;
    const t = C.shell.landingTitle;
    const kits = ["ambassador", "partner", "media"];
    app().innerHTML = `<section class="wrap landing">
      <div style="display:grid;gap:18px">
        <span class="label">${esc(C.shell.eyebrow)}</span>
        <h1>${esc(t[0])}<br><span class="em">${esc(t[1])}</span></h1>
        <p class="lede">${esc(C.shell.landingIntro)}</p>
      </div>
      <div class="doors">${kits.map((k, i) => `
        <button class="door" data-act="door" data-kit="${k}">
          <h2>${esc(C.kits[k].label)}</h2>
          <p>${esc(C.kits[k].door)}</p>
          <span class="go">Start</span>
        </button>`).join("")}</div>
      <div class="cta"><div style="display:grid;gap:6px"><span class="label">Press room · open to everyone</span><h2>${SINGLE ? `Covering <span class="em">${esc(C.events[SINGLE].short)}?</span>` : `Covering RAISE or <span class="em">MACHINA?</span>`}</h2><span class="muted">Media kits, press releases, testimonials, company facts and history.</span></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${EVENT_IDS.map((id, i) => `<button class="btn ${i ? "ghost" : ""}" data-act="press" data-ev="${id}">${SINGLE ? "Open the press room" : esc(C.events[id].short) + " press room"}</button>`).join("")}</div></div>
      ${C.gallery ? `<div class="cta"><div style="display:grid;gap:6px"><span class="label">Event gallery · open to everyone</span><h2>${esc(C.gallery.title.replace(/ Event Gallery$/, ""))} <span class="em">Event Gallery</span></h2><span class="muted">${esc(C.gallery.photos.length)} photos from Paris, ready to download with credits.</span></div><div><button class="btn" data-act="gallery">Open the gallery</button></div></div>` : ""}
    </section>`;
  }

  function viewEvent() {
    document.body.dataset.ev = "raise";
    const ev = (id) => C.events[id];
    app().innerHTML = `<section class="wrap landing">
      <div style="display:grid;gap:14px">
        <span class="label">${esc(KIT().label)} kit</span>
        <h1>Choose your <span class="em">event</span></h1>
        <p class="lede">${esc(C.shell.eventIntro)}</p>
      </div>
      <div class="events">
        <button class="evcard raise" data-act="event" data-ev="raise" style="background-image:url('assets/raise/bg-indigo-sweep.webp')">
          <span class="shade"></span>
          <img class="logo" src="assets/raise/raise-summit-logo-white.svg" alt="RAISE Summit">
          <span class="tag">${esc(ev("raise").tagline.join(" "))}</span>
          <span class="meta">${esc(ev("raise").dates)}<br>${esc(ev("raise").venue)}</span>
        </button>
        <button class="evcard machina" data-act="event" data-ev="machina" style="background-image:radial-gradient(700px 500px at 0 0, rgba(74,120,255,.45), transparent 70%), radial-gradient(700px 500px at 100% 100%, rgba(255,111,174,.38), transparent 70%)">
          <img class="logo" src="assets/machina/machina-wordmark-white.svg" alt="MACHINA">
          <span class="tag">${esc(ev("machina").tagline.join(" "))}</span>
          <span class="meta">${esc(ev("machina").dates)}<br>${esc(ev("machina").venue)}</span>
        </button>
      </div>
    </section>`;
  }

  function tabList() {
    const t = [["create", "Create"], ["write", "Write"], ["brand", "Brand pack"], ["guide", "Guide"]];
    if (S.kit === "media") t.push(["press", "Press room"]);
    if (C.gallery) t.push(["gallery", "Event gallery"]);
    return t;
  }
  function viewStudio() {
    document.body.dataset.ev = S.ev;
    const e = EV(), k = KIT();
    if (!S.asset || !k.assets.find((a) => a.id === S.asset)) S.asset = (k.assets.find((a) => a.priority) || k.assets[0]).id;
    if (!C.variants[S.ev].find((v) => v.id === S.variant)) S.variant = "a";
    if (!tabList().find((t) => t[0] === S.tab)) S.tab = "create";
    app().innerHTML = `<div class="wrap">
      <div class="studio-head">
        <div style="display:grid;gap:10px">
          <span class="label">${esc(k.label)} kit · ${esc(e.name)} ${esc(e.year)}</span>
          <h2>${S.ev === "machina" ? `<span class="dim">${esc(k.label)}</span> studio` : `${esc(k.label)} <span class="em">studio</span>`}</h2>
        </div>
        <span class="label">${esc(e.dates)} • ${esc(e.city)}</span>
      </div>
      <div class="tabs" role="tablist">${tabList().map(([id, l]) => `<button class="tab" role="tab" id="tab-${id}" aria-selected="${S.tab === id}" data-act="tab" data-tab="${id}">${l}</button>`).join("")}</div>
      <div class="panel" id="panel" role="tabpanel" aria-labelledby="tab-${S.tab}"></div>
    </div>`;
    renderTab();
  }
  function renderTab() {
    const p = $("#panel");
    if (S.tab === "create") p.innerHTML = createHTML(), mountCreate();
    else if (S.tab === "write") p.innerHTML = writeHTML(), mountWrite();
    else if (S.tab === "brand") p.innerHTML = brandHTML();
    else if (S.tab === "guide") p.innerHTML = guideHTML();
    else if (S.tab === "press") p.innerHTML = pressHTML(S.ev);
    else if (S.tab === "gallery") p.innerHTML = galleryHTML();
  }

  /* ---------------- CREATE ---------------- */
  function fieldHTML(f) {
    const v = (S.vals[S.kit] || {})[f.id] || "";
    return `<div class="field">
      <div class="row"><label for="f-${f.id}">${esc(f.label)}${f.required ? "" : ""}</label><span class="count" id="cnt-${f.id}">${v.length}/${f.max}</span></div>
      <input type="text" id="f-${f.id}" data-field="${f.id}" maxlength="${f.max}" placeholder="${esc(f.placeholder)}" value="${esc(v)}" autocomplete="off">
    </div>`;
  }
  function uploadHTML(key, label, kind, optional) {
    const has = key === "photo" ? S.photo : key === "rep" ? S.rep : S.logoRaw;
    return `<div class="field">
      <div class="row"><span>${esc(label)}${optional ? ' <span class="muted small">(optional)</span>' : ""}</span>${has ? `<button class="btn ghost sm" data-act="clear-img" data-key="${key}">Remove</button>` : ""}</div>
      <label class="drop" id="drop-${key}"><input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" data-upload="${key}">
        ${has ? "Replace file" : (kind === "logo" ? "Choose or drop your logo (PNG or SVG)" : "Choose or drop a photo")}</label>
      ${has && kind === "photo" ? `<div class="cropper" data-crop="${key}">
          <canvas width="480" height="560" id="crop-${key}" aria-label="Drag to move the photo"></canvas>
          <div class="range"><span class="small muted">Zoom</span><input type="range" min="1" max="3" step="0.01" value="${(key === "photo" ? S.crop : S.repCrop).z}" data-zoom="${key}" aria-label="Zoom"></div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${key === "photo" ? `<button class="btn ghost sm" data-act="rmbg">${S.photoCut ? (S.useCut ? "Use original background" : "Use removed background") : "Remove background"}</button>` : ""}
            <button class="btn ghost sm" data-act="recenter" data-key="${key}">Reset position</button>
          </div>
          <span class="note" id="rmbg-note"></span>
        </div>` : ""}
      ${has && kind === "logo" ? `<div class="cropper logo"><canvas width="640" height="360" id="logo-prev" aria-label="Logo preview"></canvas>
          <div class="seg" role="group" aria-label="Logo colour">
            <button data-act="logo-mode" data-mode="white" aria-pressed="${S.logoMode === "white"}">White<span>Recommended on dark</span></button>
            <button data-act="logo-mode" data-mode="original" aria-pressed="${S.logoMode === "original"}">Original<span>If white doesn't work</span></button>
          </div></div>` : ""}
      <span class="privacy">${esc(C.privacyLine)}</span>
      <details><summary>${kind === "logo" ? "Logo tips" : "Photo tips"}</summary><ul class="tips">${C.tips[kind].map((t) => `<li>${esc(t)}</li>`).join("")}</ul></details>
    </div>`;
  }
  function createHTML() {
    const k = KIT(), e = EV();
    const types = k.ambassadorTypes ? `<div class="box"><span class="label">Ambassador type</span>
      <div class="seg" role="group" aria-label="Ambassador type">${k.ambassadorTypes.map((t) => `<button data-act="amb" data-amb="${t.id}" aria-pressed="${S.ambType === t.id}">${esc(t.label)}<span>${esc(t.help)}</span></button>`).join("")}</div></div>` : "";
    const asset = k.assets.find((a) => a.id === S.asset);
    const isAd = asset.formats.some((f) => C.formats[f].ad);
    const fl = fmtsOf(asset);
    const allowCustom = S.kit === "media" && C.customSize && C.customSize.assets.includes(asset.id);
    return `<div class="create">
      <aside class="form" aria-label="Your details">
        ${types}
        <div class="box"><span class="label">Your details</span>${k.fields.map(fieldHTML).join("")}</div>
        <div class="box"><span class="label">${esc(k.image.label)}</span>
          ${uploadHTML(k.image.kind === "logo" ? "logo" : "photo", k.image.label, k.image.kind, false)}
          ${k.repPhoto ? uploadHTML("rep", "Rep headshot", "photo", true) + `<p class="note">Add a headshot to put a person on the social posts. Your logo then sits above the name.</p>` : ""}
        </div>
        <div class="box"><span class="label">Your promo code</span>
          <div class="field"><div class="row"><label for="f-code">Code, as you will share it</label><span class="count" id="cnt-code">${S.code.length}/${C.code.maxLength}</span></div>
            <input type="text" class="code" id="f-code" maxlength="${C.code.maxLength}" placeholder="${esc(CODE_EX())}" value="${esc(S.code)}" autocomplete="off" spellcheck="false">
            <span class="note">Format: ${esc(CODE_EX())}, with your own letters in place of XXX. It goes in your tracking link.</span></div>
          <label class="toggle"><input type="checkbox" id="showcode" ${S.showCode ? "checked" : ""}> ${esc(C.codeOptional.label)}</label>
          <div class="field"><span class="small muted">Your tracking link</span>
            <div class="linkbox" id="trk">${esc(trackingLink(isAd ? "web_banner" : C.tracking.defaultChannel))}</div>
            <span class="note">${esc(C.tracking.help || "")}</span>
            <div><button class="btn ghost sm" data-act="copy-link">Copy link</button></div></div>
        </div>
      </aside>
      <section class="stage" aria-label="Preview">
        <div class="assetbar" role="group" aria-label="Asset">${k.assets.map((a) => `<button class="chipbtn" data-act="asset" data-asset="${a.id}" aria-pressed="${a.id === S.asset}">${esc(a.label)}${a.priority ? '<span class="pri">First</span>' : ""}</button>`).join("")}</div>
        ${asset.formats[0] === "badge" ? "" : `<div><span class="label">Look</span><div class="variants" id="variants" style="margin-top:10px">${C.variants[S.ev].map((v) => `<button class="variant" data-act="variant" data-v="${v.id}" aria-pressed="${S.variant === v.id}"><canvas data-vthumb="${v.id}"></canvas><span>${esc(v.label)}</span></button>`).join("")}</div></div>`}
        <div class="toolbar">
          <div style="display:flex;gap:16px;flex-wrap:wrap">
            ${fl.some((f) => C.formats[f].safe) ? `<label class="toggle"><input type="checkbox" id="safe" ${S.safe ? "checked" : ""}> Show safe zones</label>` : ""}
            ${hasMocks() ? `<label class="toggle"><input type="checkbox" id="mocks" ${S.mocks ? "checked" : ""}> Show LinkedIn preview</label>` : ""}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn ghost" data-act="zip-asset">Download these (ZIP)</button>
            <button class="btn" data-act="zip-all">Download all (ZIP)</button>
          </div>
        </div>
        <div id="warns"></div>
        ${isAd ? `<div class="box clickurl"><span class="label">Click-through URL for these banners</span><div class="linkbox">${esc(trackingLink("web_banner"))}</div><span class="note">Link every banner to this URL. JPG, each under ${C.adMaxKB} KB.</span></div>` : ""}
        ${allowCustom ? `<div class="box"><span class="label">Custom size</span><span class="note">${esc(C.customSize.help)}</span>
          <div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap">
            <div class="field" style="width:110px"><label for="cw" class="small">Width (px)</label><input type="text" inputmode="numeric" id="cw" placeholder="468" autocomplete="off"></div>
            <span style="padding-bottom:12px" class="muted">×</span>
            <div class="field" style="width:110px"><label for="ch" class="small">Height (px)</label><input type="text" inputmode="numeric" id="ch" placeholder="60" autocomplete="off"></div>
            <button class="btn" data-act="add-size">Add size</button>
          </div><span class="err" id="cs-err"></span></div>` : ""}
        <div class="grid ${asset.formats.some((f) => C.formats[f].layout === "wide") && asset.formats.length <= 2 ? "wide" : ""}" id="fmts">${fl.map((f) => {
          const F = C.formats[f];
          return `<div class="fmt"><div class="cv ${F.layout === "tall" || F.h / F.w > 1.6 ? "tall" : ""}"><canvas data-fmt="${f}"></canvas><button class="open" data-act="open" data-fmt="${f}" aria-label="Open ${esc(F.label)} full size"><svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M9.5 2.5h4v4M13.5 2.5 9 7M6.5 13.5h-4v-4M2.5 13.5 7 9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg> Open</button></div>
            <div class="meta"><div><b>${esc(F.label)}</b><div class="muted">${F.w} × ${F.h} · ${F.ext.toUpperCase()}${F.svg ? " + SVG" : ""}</div></div>
            <div class="actions"><button class="btn sm" data-act="dl" data-fmt="${f}">Download</button>${F.custom ? `<button class="btn ghost sm" data-act="rm-size" data-fmt="${f}" aria-label="Remove ${F.w} by ${F.h}">Remove</button>` : ""}${F.svg ? `<button class="btn ghost sm" data-act="dl-svg">SVG</button>` : ""}</div></div>
            <span class="sizeinfo" data-size="${f}"></span></div>`;
        }).join("")}</div>
        <div id="mockwrap"></div>
      </section>
    </div>`;
  }
  function hasMocks() { return S.kit !== "media" || KIT().assets.find((a) => a.id === S.asset).formats.includes("post"); }

  /* crop editors */
  function drawCropper(key) {
    const c = $("#crop-" + key); if (!c) return;
    const img = key === "photo" ? S.photo : S.rep, crop = key === "photo" ? S.crop : S.repCrop;
    const x = c.getContext("2d");
    x.clearRect(0, 0, c.width, c.height);
    x.fillStyle = S.ev === "machina" ? "#0B0B10" : "#0A0838"; x.fillRect(0, 0, c.width, c.height);
    if (img) R.drawCrop(x, img, crop, 0, 0, c.width, c.height);
  }
  function bindCropper(key) {
    const c = $("#crop-" + key); if (!c) return;
    drawCropper(key);
    let drag = null;
    c.addEventListener("pointerdown", (ev) => { c.setPointerCapture(ev.pointerId); drag = { x: ev.clientX, y: ev.clientY }; });
    c.addEventListener("pointermove", (ev) => {
      if (!drag) return;
      const img = key === "photo" ? S.photo : S.rep, crop = key === "photo" ? S.crop : S.repCrop;
      const r = c.getBoundingClientRect(), k = c.width / r.width;
      const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
      const sc = Math.max(c.width / iw, c.height / ih) * crop.z;
      crop.cx -= ((ev.clientX - drag.x) * k) / (iw * sc);
      crop.cy -= ((ev.clientY - drag.y) * k) / (ih * sc);
      const hx = c.width / (2 * iw * sc), hy = c.height / (2 * ih * sc);
      crop.cx = Math.min(1 - hx, Math.max(hx, crop.cx)); crop.cy = Math.min(1 - hy, Math.max(hy, crop.cy));
      drag = { x: ev.clientX, y: ev.clientY };
      drawCropper(key); schedule();
    });
    const end = () => { drag = null; };
    c.addEventListener("pointerup", end); c.addEventListener("pointercancel", end);
    c.addEventListener("wheel", (ev) => {
      ev.preventDefault();
      const crop = key === "photo" ? S.crop : S.repCrop;
      crop.z = Math.min(3, Math.max(1, crop.z - ev.deltaY * 0.0015));
      const z = $(`[data-zoom="${key}"]`); if (z) z.value = crop.z;
      drawCropper(key); schedule();
    }, { passive: false });
  }
  function drawLogoPrev() {
    const c = $("#logo-prev"); if (!c || !S.logoProc) return;
    const x = c.getContext("2d");
    x.fillStyle = S.ev === "machina" ? "#000" : "#040336"; x.fillRect(0, 0, c.width, c.height);
    const iw = S.logoProc.width, ih = S.logoProc.height, sc = Math.min(c.width * 0.7 / iw, c.height * 0.55 / ih);
    x.drawImage(S.logoProc, (c.width - iw * sc) / 2, (c.height - ih * sc) / 2, iw * sc, ih * sc);
  }

  let rafId = 0;
  function schedule() { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(() => { renderPreviews(); }); }
  let renderToken = 0;
  async function renderPreviews() {
    if (S.view !== "studio" || S.tab !== "create") return;
    const tok = ++renderToken;
    const A = await eventAssets(S.ev); await loadFonts();
    if (tok !== renderToken) return;
    const asset = KIT().assets.find((a) => a.id === S.asset);
    const warns = new Set();
    $$("canvas[data-fmt]").forEach((cv) => {
      const r = R.render(cv, buildData(asset, cv.dataset.fmt, S.variant), A, { safe: S.safe });
      r.warnings.forEach((w) => warns.add(w));
    });
    const thumbFmt = asset.formats[0];
    $$("canvas[data-vthumb]").forEach((cv) => { R.render(cv, buildData(asset, thumbFmt, cv.dataset.vthumb), A, {}); });
    const req = [];
    if (S.kit === "ambassador" && !fieldVal("name")) req.push("Add your name to replace the example.");
    if (S.kit === "partner" && !fieldVal("company")) req.push("Add your company name to replace the example.");
    if (S.kit === "media" && !fieldVal("outlet")) req.push("Add your outlet name to replace the example.");
    if (KIT().image.kind === "photo" && !S.photo) req.push("Add a headshot.");
    if (KIT().image.kind === "logo" && !S.logoRaw) req.push("Add your logo.");
    if (!S.code && S.showCode) req.push("Add your promo code so it shows on your assets.");
    const w = $("#warns");
    if (w) w.innerHTML = (warns.size || req.length) ? `<div class="warnbox" role="status">${[...req, ...warns].map((x) => `<span>${esc(x)}</span>`).join("")}</div>` : "";
    renderMocks(A);
  }
  async function renderMocks(A) {
    const wrap = $("#mockwrap"); if (!wrap) return;
    if (!S.mocks || !hasMocks()) { wrap.innerHTML = ""; return; }
    const k = KIT();
    const bannerAsset = k.assets.find((a) => a.formats.includes("linkedin"));
    const postAsset = k.assets.find((a) => a.id === S.asset && a.formats.includes("post")) || k.assets.find((a) => a.formats.includes("post"));
    const toUrl = (asset, f, max) => { const c = document.createElement("canvas"); R.render(c, buildData(asset, f, S.variant), A, {}); const o = document.createElement("canvas"); const sc = max / c.width; o.width = max; o.height = Math.round(c.height * sc); o.getContext("2d").drawImage(c, 0, 0, o.width, o.height); return o.toDataURL("image/jpeg", 0.85); };
    let avatar = "";
    if (S.kit === "ambassador" && S.photo) { const c = document.createElement("canvas"); c.width = c.height = 200; R.drawCrop(c.getContext("2d"), S.photo, S.crop, 0, 0, 200, 200); avatar = c.toDataURL("image/jpeg", 0.85); }
    if (S.kit !== "ambassador" && S.logoProc) { const c = document.createElement("canvas"); c.width = c.height = 200; const x = c.getContext("2d"); x.fillStyle = S.logoMode === "white" ? "#1d1d1d" : "#ffffff"; x.fillRect(0, 0, 200, 200); const iw = S.logoProc.width, ih = S.logoProc.height, sc = Math.min(150 / iw, 150 / ih); x.drawImage(S.logoProc, 100 - iw * sc / 2, 100 - ih * sc / 2, iw * sc, ih * sc); avatar = c.toDataURL("image/png"); }
    const v = vars("linkedin");
    const who = S.kit === "ambassador" ? v.name : S.kit === "partner" ? v.company : v.outlet;
    const sub = S.kit === "ambassador" ? [v.jobTitle, v.company].filter(Boolean).join(" at ") : (S.kit === "partner" ? "Company page" : "Media");
    const capKey = postAsset && k.captions && k.captions[postAsset.id] ? postAsset.id : Object.keys(k.captions || {})[0];
    const caption = capKey ? fill(k.captions[capKey].linkedin, v) : "";
    let html = "";
    if (bannerAsset) html += `<div class="mock"><div class="bar">Profile preview</div><div class="profile"><div class="banner"><img alt="Banner preview" src="${toUrl(bannerAsset, "linkedin", 900)}"><span class="avatar ${S.kit !== "ambassador" ? "sq" : ""}" style="${avatar ? `background-image:url('${avatar}')` : ""}"></span></div>
      <div class="pbody"><b>${esc(who)}</b><span>${esc(sub)}</span><div style="color:#666;font-size:12px;margin-top:4px">${esc(EV().city)}</div></div></div><div class="disclaimer">Preview only. Layout approximates a LinkedIn profile on desktop.</div></div>`;
    if (postAsset) html += `<div class="mock"><div class="bar">Feed preview</div><div class="post"><div class="phead"><i style="${avatar ? `background-image:url('${avatar}')` : ""}"></i><div><b>${esc(who)}</b><span>${esc(sub)}</span></div></div>
      <div class="ptext">${esc(caption)}</div><img alt="Post preview" src="${toUrl(postAsset, "post", 560)}"></div><div class="disclaimer">Preview only.</div></div>`;
    wrap.innerHTML = html ? `<span class="label">In context</span><div class="mocks" style="margin-top:10px">${html}</div>` : "";
  }

  function mountCreate() {
    bindCropper("photo"); bindCropper("rep"); drawLogoPrev();
    renderPreviews();
  }

  async function onUpload(key, file) {
    if (!file || !/^image\//.test(file.type)) { toast("Choose an image file: PNG, JPG, WEBP or SVG."); return; }
    const url = URL.createObjectURL(file);
    const img = await loadImg(url);
    if (!img) { toast("That image could not be opened. Try a PNG or JPG."); return; }
    if (key === "photo") {
      S.photo = img; S.photoOrig = img; S.photoCut = null; S.useCut = false; S.photoFile = file; S.crop = { cx: 0.5, cy: 0.42, z: 1 };
      if (Math.min(img.naturalWidth, img.naturalHeight) < 600) toast("This photo is small, so it may look soft. 1000 px or more works best.");
    } else if (key === "rep") { S.rep = img; S.repCrop = { cx: 0.5, cy: 0.42, z: 1 }; }
    else { S.logoRaw = img; S.logoProc = processLogo(img, S.logoMode); }
    renderTab();
  }

  async function removeBg() {
    const note = $("#rmbg-note");
    if (S.photoCut) { S.useCut = !S.useCut; S.photo = S.useCut ? S.photoCut : S.photoOrig; renderTab(); return; }
    const btn = $('[data-act="rmbg"]'); if (btn) { btn.disabled = true; btn.textContent = "Removing background..."; }
    if (note) note.textContent = "This runs on your device and can take up to a minute the first time.";
    try {
      const mod = await Promise.race([
        import("https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/+esm"),
        new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 20000))
      ]);
      const fn = mod.removeBackground || (mod.default && mod.default.removeBackground) || mod.default;
      const blob = await Promise.race([fn(S.photoFile), new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 120000))]);
      const img = await loadImg(URL.createObjectURL(blob));
      if (!img) throw new Error("decode");
      S.photoCut = img; S.useCut = true; S.photo = img;
      renderTab(); toast("Background removed");
    } catch (e) {
      if (btn) { btn.disabled = false; btn.textContent = "Remove background"; }
      if (note) note.textContent = "Background removal isn't available here, so your photo is used as it is. A plain, light background gives the cleanest result.";
    }
  }

  /* ---------------- WRITE ---------------- */
  const CAPTION_LABELS = { joinme: "Join me", announce: "Announcement" };
  const CH = [["linkedin", "LinkedIn"], ["instagram", "Instagram"], ["x", "X"]];
  function copyBlock(id, title, body, extra) {
    return `<div class="section" style="margin:0"><div class="copyrow"><b>${esc(title)}</b><div style="display:flex;gap:8px;align-items:center">${extra || ""}<button class="btn ghost sm" data-act="copy" data-target="${id}">Copy</button></div></div><pre class="copy" id="${id}">${hl(body)}</pre></div>`;
  }
  function writeHTML() {
    const k = KIT(), e = EV();
    let h = "";
    // captions
    const caps = k.captions || {};
    h += `<div class="section"><header><span class="label">Captions</span><h2>Ready to <span class="em">post</span></h2><p class="muted">Your name, code and tracking link are filled in. Copy, then paste with the matching image.</p><p class="muted" style="margin:0">Note: These captions are a starting point. We'd love your post to sound like you, so feel free to rewrite them in your own words and style. Before you post, please check that all details are correct and tag our accounts.</p></header>`;
    for (const aid of Object.keys(caps)) {
      const asset = k.assets.find((a) => a.id === aid);
      h += `<h3 style="margin-top:6px">${esc(asset ? asset.label : (CAPTION_LABELS[aid] || aid))}</h3><div class="cols">`;
      for (const [ch, chl] of CH) {
        if (!caps[aid][ch]) continue;
        const txt = fill(caps[aid][ch], vars(ch));
        h += copyBlock(`cap-${aid}-${ch}`, chl, txt, ch === "x" ? `<span class="count ${txt.length > 280 ? "near" : ""}">${txt.length}/280</span>` : "");
      }
      h += `</div>`;
    }
    h += `</div>`;
    if (S.kit === "ambassador") {
      const b = k.builder;
      const qs = [...b.personal.filter((q) => !q.only || q.only === S.ambType), ...b.industry[S.ev]];
      h += `<div class="section"><header><span class="label">Caption builder</span><h2>Make it <span class="em">yours</span></h2><p class="muted">${esc(b.intro)}</p></header>
        <div class="cols"><div style="display:grid;gap:14px">${qs.map((q) => `<div class="field"><label for="q-${q.id}">${esc(fill(q.q, vars()))}</label><textarea id="q-${q.id}" data-q="${q.id}" maxlength="400">${esc((S.answers[S.ev] || {})[q.id] || "")}</textarea></div>`).join("")}</div>
        <div style="display:grid;gap:10px;align-content:start"><div class="copyrow"><b>Your post</b><button class="btn ghost sm" data-act="copy" data-target="built">Copy</button></div><pre class="copy" id="built"></pre><span class="err" id="built-warn"></span></div></div></div>`;
    }
    if (S.kit === "partner") {
      h += `<div class="section"><header><span class="label">Why attend</span></header>${copyBlock("why", "One line", e.whyAttend)}</div>`;
    }
    if (S.kit === "partner" || S.kit === "media") {
      h += `<div class="section"><header><span class="label">Boilerplate</span><h2>About <span class="em">${esc(e.short)}</span></h2></header><div class="cols">${e.boilerplate100 ? copyBlock("bp50", "About 50 words", e.boilerplate50) + copyBlock("bp100", "About 100 words", e.boilerplate100) : copyBlock("bp50", "About " + e.short, e.boilerplate50)}</div></div>`;
    }
    if (S.kit === "media") {
      h += `<div class="section"><header><span class="label">Story angles</span><h2>Ideas to <span class="em">pitch</span></h2></header><ul class="list">${k.angles[S.ev].map((a) => `<li>${hl(a)}</li>`).join("")}</ul></div>`;
    }
    h += `<div class="section"><header><span class="label">Handles</span></header><div class="cols">${copyBlock("handles", "Handles", `LinkedIn: ${e.handles.linkedin}${e.handleUrls ? " (" + e.handleUrls.linkedin + ")" : ""}\nInstagram: ${e.handles.instagram}${e.handleUrls ? " (" + e.handleUrls.instagram + ")" : ""}\nX: ${e.handles.x}${e.handleUrls ? " (" + e.handleUrls.x + ")" : ""}`)}</div></div>`;
    return h;
  }
  function updateBuilt() {
    const out = $("#built"); if (!out) return;
    const b = KIT().builder, v = vars("linkedin");
    const qs = [...b.personal.filter((q) => !q.only || q.only === S.ambType), ...b.industry[S.ev]];
    const ans = S.answers[S.ev] || {};
    const parts = [fill(b.open, v)];
    for (const q of qs) { const a = (ans[q.id] || "").trim(); if (a) parts.push(q.slot.replace("{a}", a)); }
    parts.push(fill(b.close, v));
    const txt = parts.join("\n\n");
    out.innerHTML = hl(txt);
    const bad = /!|[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(Object.values(ans).join(" "));
    $("#built-warn").textContent = bad ? "House style: no exclamation marks or emoji. Consider removing them before you post." : "";
  }
  function mountWrite() { if (S.kit === "ambassador") updateBuilt(); }

  /* ---------------- BRAND PACK ---------------- */
  function linkOrPh(url, label) {
    return isPh(url) ? `<span class="disabled-link" title="Link to be added">${esc(url)}</span>` : `<a class="btn ghost sm" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a>`;
  }
  function brandHTML() {
    const e = EV();
    return `<div class="section"><header><span class="label">Logos</span><h2>${esc(e.short)} <span class="em">logos</span></h2><p class="muted">Use as supplied. Event logos sit on dark grounds, in white.</p></header>
      <div class="logos">${e.logos.map((l, i) => `<div class="logo-tile"><div class="g ${l.ground} cv-wrap"><img src="${l.file}" alt="${esc(l.label)}"><button class="open" data-act="open-file" data-file="${l.file}" data-title="${esc(l.label)}" data-ground="${l.ground}" aria-label="Open ${esc(l.label)} full size"><svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M9.5 2.5h4v4M13.5 2.5 9 7M6.5 13.5h-4v-4M2.5 13.5 7 9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg> Open</button></div><div class="m"><span>${esc(l.label)}</span><button class="btn ghost sm" data-act="dl-file" data-file="${l.file}">SVG</button></div></div>`).join("")}</div></div>
    <div class="section"><header><span class="label">Colour</span><h2>The <span class="em">palette</span></h2><p class="muted">Tap a swatch to copy its hex.</p></header>
      <div class="swatches">${e.palette.map((p) => `<button class="swatch" data-act="copy-text" data-text="${p.hex}"><i style="background:${p.hex}"></i><div><code>${p.hex}</code><b>${esc(p.name)}</b><span class="muted">${esc(p.use)}</span></div></button>`).join("")}</div></div>
    <div class="section"><header><span class="label">Type</span></header><ul class="list">${e.fonts.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></div>
    <div class="section"><header><span class="label">Key visuals</span><h2>Backgrounds</h2></header>
      <div class="visuals">${e.keyVisuals.map((k) => `<figure class="cv-wrap"><img src="${k.file}" alt="${esc(k.label)}"><button class="open" data-act="open-file" data-file="${k.file}" data-title="${esc(k.label)}" aria-label="Open ${esc(k.label)} full size"><svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M9.5 2.5h4v4M13.5 2.5 9 7M6.5 13.5h-4v-4M2.5 13.5 7 9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg> Open</button><figcaption>${esc(k.label)}<button class="btn ghost sm" data-act="dl-file" data-file="${k.file}">Download</button></figcaption></figure>`).join("")}</div></div>
    <div class="section"><header><span class="label">Event photos</span></header><div>${C.gallery ? `<button class="btn" data-act="tab" data-tab="gallery">Open the event gallery</button>` : linkOrPh(e.photoLibrary, "Open photo library")}</div></div>
    <div class="section"><header><span class="label">Key facts</span><h2>Approved <span class="em">numbers</span></h2><p class="muted">Use only these figures in posts and articles.</p></header>
      ${factsHTML(S.ev)}</div>`;
  }

  /* ---------------- GUIDE ---------------- */
  function guideHTML() {
    const k = KIT(), g = k.guide;
    let h = `<div class="section"><header><span class="label">Guide</span><h2>Do and <span class="em">don't</span></h2></header><div class="cols">
      <div class="box"><b>Do</b><ul class="list">${g.do.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
      <div class="box"><b>Don't</b><ul class="list no">${g.dont.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div></div></div>`;
    if (g.howTo) h += `<div class="section"><header><span class="label">Where each file goes</span></header><div class="scroll-x"><table class="how"><thead><tr><th>Asset</th><th>How to use it</th></tr></thead><tbody>${g.howTo.map((r) => `<tr><td><b>${esc(r.asset)}</b></td><td>${esc(r.where)}</td></tr>`).join("")}</tbody></table></div></div>`;
    if (g.coBranding) h += `<div class="section"><header><span class="label">Co-branding</span></header><ul class="list">${g.coBranding.map((x) => `<li>${hl(x)}</li>`).join("")}</ul></div>`;
    if (S.kit === "media") h += `<div class="section"><header><span class="label">Web banners</span></header><ul class="list"><li>Upload each JPG at its exact size. Every file is under ${C.adMaxKB} KB.</li><li>Set the click-through to your tracking link from the Create tab.</li><li>Static only. Don't animate or re-export.</li></ul></div>`;
    h += `<div class="section"><header><span class="label">Upload tips</span></header><div class="cols">
      <div class="box"><b>Photos</b><ul class="list">${C.tips.photo.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
      <div class="box"><b>Logos</b><ul class="list">${C.tips.logo.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div></div></div>`;
    if (g.brandNotes) h += `<div class="section"><header><span class="label">Brand notes</span></header><p>${hl(g.brandNotes)}</p></div>`;
    return h;
  }

  /* fact sheet, split into year groups when facts carry y */
  function factsHTML(evId) {
    const facts = C.facts[evId] || [];
    const tile = (f) => `<div><span class="label">${esc(f.k)}</span><b>${hl(f.v)}</b></div>`;
    if (!facts.some((f) => f.y)) return `<div class="kv">${facts.map(tile).join("")}</div>`;
    const rowsOf = (list) => { const m = new Map(); list.forEach((f) => { const k = f.r || 0; if (!m.has(k)) m.set(k, []); m.get(k).push(f); }); return Array.from(m.values()); };
    const years = Array.from(new Set(facts.map((f) => f.y || ""))).sort().reverse();
    const sub = { "2027": "This edition · numbers are targets", "2026": "First edition · results" };
    return years.map((y) => `<div class="factgroup"><h3>${esc(y)} <span class="muted small">${esc(sub[y] || "")}</span></h3>${rowsOf(facts.filter((f) => (f.y || "") === y)).map((row) => `<div class="kv">${row.map(tile).join("")}</div>`).join("")}</div>`).join("");
  }
  /* ---------------- PRESS ROOM ---------------- */
  function releasePlain(t) { return t.replace(/^#+ /gm, "").replace(/^_/gm, "").replace(/\*\*/g, "").replace(/^> /gm, "").replace(/^- /gm, "• "); }
  function releaseHTML(t) {
    const inl = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    return t.split(/\n\n+/).map((blk) => {
      const lines = blk.split("\n");
      if (blk.startsWith("# ")) return `<h4 class="rt-title">${inl(blk.slice(2))}</h4>`;
      if (blk.startsWith("## ")) return `<h5>${inl(blk.slice(3))}</h5>`;
      if (blk.startsWith("_")) return `<p class="rt-lede">${inl(blk.slice(1))}</p>`;
      if (blk.startsWith("> ")) return `<blockquote>${lines.map((l) => inl(l.replace(/^> /, ""))).join("<br>")}</blockquote>`;
      if (blk.startsWith("- ")) return `<ul>${lines.map((l) => `<li>${inl(l.slice(2))}</li>`).join("")}</ul>`;
      return `<p>${inl(blk)}</p>`;
    }).join("");
  }
  function pressHTML(evId) {
    const e = C.events[evId], p = C.kits.media.press;
    return `
    <div class="section"><header><span class="label">Media kit</span></header><div style="display:flex;gap:10px;flex-wrap:wrap">${e.mediaKitPages ? `<button class="btn sm" data-act="view-kit" data-ev="${evId}">View media kit</button>` : ""}${e.mediaKitFile ? `<button class="btn ghost sm" data-act="dl-file" data-file="${esc(e.mediaKitFile)}">Download PDF</button>` : ""}${e.mediaKitUrl ? linkOrPh(e.mediaKitUrl, "Media kit (PDF)") : ""}${e.mediaKitDrive ? linkOrPh(e.mediaKitDrive, "Media kit folder") : ""}</div></div>
    <div class="section"><header><span class="label">Press releases</span></header><div class="releases">${p.releases.map((r, i) => r.text ? `<div class="box release"><span class="label">${esc(r.date)}</span><h3>${esc(r.title)}</h3><div class="release-actions"><button class="btn sm" data-act="copy-release" data-i="${i}">Copy text</button>${r.pdf ? `<button class="btn ghost sm" data-act="dl-file" data-file="${esc(r.pdf)}">Download PDF</button>` : ""}</div><details class="release-read"><summary>Read the full release</summary><article class="release-text" id="rel-${i}">${releaseHTML(r.text)}</article></details></div>` : `<div class="box release"><span class="label">${hl(r.date)}</span><h3>${hl(r.title)}</h3><div>${linkOrPh(r.url, "Read")}</div></div>`).join("")}</div></div>
    <div class="section"><header><span class="label">Fact sheet</span></header>${factsHTML(evId)}</div>
    <div class="section"><header><span class="label">Quote bank</span><h2>Approved <span class="em">quotes</span></h2></header><div class="cols">${p.quotes[evId].map((q, i) => `<div class="quote"><blockquote id="qt-${i}">${hl("“" + q.quote + "”")}</blockquote><div class="small"><b>${hl(q.name)}</b><br><span class="muted">${hl(q.title)}, ${hl(q.company)} · ${esc(q.event)}</span></div><div><button class="btn ghost sm" data-act="copy-text" data-text="${esc("“" + q.quote + "” " + q.name + ", " + q.title + ", " + q.company)}">Copy with credit</button></div></div>`).join("")}</div></div>
    ${p.credit ? `<div class="section"><header><span class="label">Credit &amp; tagging</span></header><p style="max-width:72ch;margin:0">${hl(p.credit)}</p></div>` : ""}
    <div class="section"><header><span class="label">Press contact</span></header><div class="box" style="max-width:520px"><b>${esc(p.contact.name)}</b><span class="muted">${hl(p.contact.title)}</span><span class="linkbox" id="pc-mail">${esc(p.contact.email)}</span><div><button class="btn ghost sm" data-act="copy-text" data-text="${esc(p.contact.email)}">Copy email</button></div></div></div>`;
  }

  /* ---------------- LIGHTBOX ---------------- */
  let lbReturn = null;
  function openLightbox(src, title, sub, opts) {
    opts = opts || {};
    closeLightbox(true);
    lbReturn = document.activeElement;
    const el = document.createElement("div");
    el.className = "lb";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", title + " preview");
    el.innerHTML = `<div class="lb-bar"><div class="lb-title"><b>${esc(title)}</b>${sub ? `<span>${esc(sub)}</span>` : ""}</div>
      <div class="lb-actions">${opts.dlFmt ? `<button class="btn sm" data-act="dl" data-fmt="${opts.dlFmt}">Download</button>` : ""}${opts.file ? `<button class="btn sm" data-act="dl-file" data-file="${opts.file}">Download</button>` : ""}
      <button class="lb-x" data-act="lb-close" aria-label="Close preview"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button></div></div>
      ${opts.pages ? `<div class="lb-stage lb-pages">${opts.pages.map((p, i) => `<img src="${p}" alt="${esc(title)}, page ${i + 1}" loading="lazy">`).join("")}</div>` : `<div class="lb-stage" data-act="lb-close"><img class="${opts.ground ? "g-" + opts.ground : ""}" src="${src}" alt="${esc(title)}"></div>`}`;
    document.body.appendChild(el);
    document.body.classList.add("lb-open");
    $(".lb-x", el).focus();
  }
  function closeLightbox(silent) {
    const el = $(".lb"); if (!el) return;
    el.remove(); document.body.classList.remove("lb-open");
    if (!silent && lbReturn && lbReturn.focus) lbReturn.focus();
  }
  document.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && $(".lb")) { ev.preventDefault(); closeLightbox(); } });

  /* ================================================================= */
  /* EVENTS                                                             */
  /* ================================================================= */
  function go(view) { S.view = view; save(); render(); window.scrollTo(0, 0); }
  function viewPress() {
    document.body.dataset.ev = S.pressEv;
    const e = C.events[S.pressEv];
    app().innerHTML = `<div class="wrap">
      <div class="studio-head">
        <div style="display:grid;gap:10px">
          <span class="label">Press room · ${esc(e.name)} ${esc(e.year)}</span>
          <h2>${S.pressEv === "machina" ? `<span class="dim">Press</span> room` : `Press <span class="em">room</span>`}</h2>
        </div>
        <span class="label">${esc(e.dates)} • ${esc(e.city)}</span>
      </div>
      <div class="panel" style="padding-top:28px">${pressHTML(S.pressEv)}
      </div></div>`;
  }
  function galleryHTML() {
    const g = C.gallery; if (!g) return "";
    const ICON = '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M9.5 2.5h4v4M13.5 2.5 9 7M6.5 13.5h-4v-4M2.5 13.5 7 9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const t = g.title.replace(/ Event Gallery$/, "");
    return `<div class="section"><header><span class="label">Event gallery</span><h2>${esc(t)} <span class="em">Event Gallery</span></h2><p class="muted" style="max-width:62ch">${esc(g.intro)}</p>${g.aftermovie && g.aftermovie.url ? `<div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn ghost" href="${esc(g.aftermovie.url)}" target="_blank" rel="noopener"><svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M4.5 3v10l8.5-5z" fill="currentColor"/></svg> ${esc(g.aftermovie.label)}</a>${g.aftermovie.downloadUrl ? ` <a class="btn ghost" href="${esc(g.aftermovie.downloadUrl)}" target="_blank" rel="noopener"><svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M8 2.5v8M4.5 7.5 8 11l3.5-3.5M3 13.5h10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg> ${esc(g.aftermovie.downloadLabel || "Download")}</a>` : ""}</div>` : ""}</header>
      <div class="toolbar"><span class="note">${g.photos.length} photos · tap Open for full size · ${esc(g.credit)}</span><button class="btn" data-act="gallery-zip">Download all (ZIP)</button></div>
      <div class="gallery">${g.photos.map((p, i) => `<figure class="gal cv-wrap"><img src="assets/gallery/thumb/${p.file}" alt="${esc(p.caption)}" width="${p.w}" height="${p.h}" loading="lazy">
        <button class="open" data-act="open-file" data-file="assets/gallery/full/${p.file}" data-title="${esc(t)} · Photo ${i + 1}" data-sub="${esc(p.credit)} · ${p.w} × ${p.h} px" aria-label="Open photo ${i + 1} full size">${ICON} Open</button>
        <figcaption><span class="muted">${esc(p.credit)}</span></figcaption></figure>`).join("")}</div></div>`;
  }
  function viewGallery() {
    document.body.dataset.ev = S.pressEv;
    app().innerHTML = `<div class="wrap"><div class="panel" style="padding-top:34px">${galleryHTML()}</div></div>`;
  }
  async function galleryZip(btn) {
    if (!window.JSZip) { toast("ZIP is not available right now. Open a photo to download it."); return; }
    const t = btn.textContent; btn.disabled = true; btn.textContent = "Preparing...";
    try {
      const zip = new window.JSZip();
      for (const p of C.gallery.photos) zip.file(p.file, await fetch("assets/gallery/full/" + p.file).then((r) => r.blob()));
      zip.file("CREDITS.txt", C.gallery.photos.map((p) => `${p.file}: ${p.credit}`).join("\n"));
      await saveFile(C.gallery.title.replace(/\s+/g, "_") + ".zip", await zip.generateAsync({ type: "blob" }));
    } finally { btn.disabled = false; btn.textContent = t; }
  }
  function setHash() {
    try {
      const want = S.view === "press" ? (SINGLE ? "press" : "press-" + S.pressEv) : S.view === "gallery" ? "gallery" : "";
      if ((location.hash || "").replace("#", "") !== want) history.replaceState(null, "", want ? "#" + want : location.pathname + location.search);
    } catch (e) { /* ignore */ }
  }
  function render() {
    header();
    setHash();
    if (S.view === "press") viewPress();
    else if (S.view === "gallery" && C.gallery) viewGallery();
    else if (S.view === "door") viewDoor();
    else if (S.view === "event") { if (SINGLE) { S.ev = SINGLE; S.view = "studio"; viewStudio(); } else viewEvent(); }
    else viewStudio();
  }

  document.addEventListener("click", async (ev) => {
    const b = ev.target.closest("[data-act]"); if (!b) return;
    const act = b.dataset.act;
    if (act === "lb-close") { if (ev.target.tagName === "IMG") return; closeLightbox(); return; }
    if (act === "open") {
      const asset = KIT().assets.find((a) => a.id === S.asset), F = C.formats[b.dataset.fmt];
      const c = document.createElement("canvas");
      R.render(c, buildData(asset, b.dataset.fmt, S.variant), await eventAssets(S.ev), { safe: S.safe });
      openLightbox(c.toDataURL("image/png"), `${asset.label} · ${F.label}`, `${F.w} × ${F.h} px`, { dlFmt: b.dataset.fmt });
      return;
    }
    if (act === "view-kit") { const ev = C.events[b.dataset.ev]; openLightbox(ev.mediaKitPages[0], ev.short + " Media Kit 2027", ev.mediaKitPages.length + " pages", { file: ev.mediaKitFile, pages: ev.mediaKitPages }); return; }
    if (act === "open-file") { openLightbox(b.dataset.file, b.dataset.title, b.dataset.sub || "", { file: b.dataset.file, ground: b.dataset.ground }); return; }
    if (act === "door") { S.kit = b.dataset.kit; S.asset = null; if (SINGLE) { S.ev = SINGLE; S.tab = "create"; go("studio"); } else go("event"); }
    else if (act === "event") { S.ev = b.dataset.ev; S.variant = "a"; S.tab = "create"; go("studio"); }
    else if (act === "to-door" || act === "home") go("door");
    else if (act === "press") { S.pressEv = b.dataset.ev; go("press"); }
    else if (act === "gallery") { S.pressEv = HOME_EV; go("gallery"); }
    else if (act === "gallery-zip") galleryZip(b);
    else if (act === "to-event") { if (!SINGLE) go("event"); }
    else if (act === "reset") { S.vals = {}; S.code = ""; S.answers = {}; S.photo = S.photoOrig = S.photoCut = S.rep = S.logoRaw = S.logoProc = null; S.kit = S.ev = null; go("door"); }
    else if (act === "tab") { S.tab = b.dataset.tab; $$(".tab").forEach((t) => t.setAttribute("aria-selected", t.dataset.tab === S.tab)); $("#panel").setAttribute("aria-labelledby", "tab-" + S.tab); renderTab(); }
    else if (act === "amb") { S.ambType = b.dataset.amb; save(); renderTab(); }
    else if (act === "asset") { S.asset = b.dataset.asset; renderTab(); }
    else if (act === "variant") { S.variant = b.dataset.v; save(); $$(".variant").forEach((x) => x.setAttribute("aria-pressed", x.dataset.v === S.variant)); schedule(); }
    else if (act === "logo-mode") { S.logoMode = b.dataset.mode; if (S.logoRaw) S.logoProc = processLogo(S.logoRaw, S.logoMode); renderTab(); }
    else if (act === "clear-img") { const k = b.dataset.key; if (k === "photo") S.photo = S.photoOrig = S.photoCut = null; else if (k === "rep") S.rep = null; else S.logoRaw = S.logoProc = null; renderTab(); }
    else if (act === "recenter") { const c = b.dataset.key === "photo" ? S.crop : S.repCrop; c.cx = 0.5; c.cy = 0.42; c.z = 1; renderTab(); }
    else if (act === "rmbg") removeBg();
    else if (act === "add-size") {
      const cs = C.customSize, err = $("#cs-err");
      const w = parseInt(($("#cw").value || "").replace(/\D/g, ""), 10), h = parseInt(($("#ch").value || "").replace(/\D/g, ""), 10);
      if (!w || !h) { err.textContent = "Enter a width and a height in pixels."; return; }
      if (w < cs.min || h < cs.min || w > cs.max || h > cs.max) { err.textContent = `Each side must be between ${cs.min} and ${cs.max} px.`; return; }
      const asset = KIT().assets.find((a) => a.id === S.asset);
      if (fmtsOf(asset).some((f) => C.formats[f].w === w && C.formats[f].h === h)) { err.textContent = "That size is already in the list."; return; }
      if (S.customSizes.length >= cs.maxCustom) { err.textContent = `You can add up to ${cs.maxCustom} custom sizes. Remove one first.`; return; }
      S.customSizes.push({ w, h }); save(); renderTab(); toast(`Added ${w} × ${h}`);
    }
    else if (act === "rm-size") {
      const F = C.formats[b.dataset.fmt];
      S.customSizes = S.customSizes.filter((c) => !(c.w === F.w && c.h === F.h)); save(); renderTab();
    }
    else if (act === "copy-link") copyText($("#trk").textContent, $("#trk"));
    else if (act === "copy") { const el = $("#" + b.dataset.target); copyText(el.textContent, el); }
    else if (act === "copy-text") copyText(b.dataset.text);
    else if (act === "copy-release") { const r = C.kits.media.press.releases[+b.dataset.i]; copyText(releasePlain(r.text), $("#rel-" + b.dataset.i)); }
    else if (act === "dl") {
      const asset = KIT().assets.find((a) => a.id === S.asset);
      b.disabled = true;
      try { const r = await exportBlob(asset, b.dataset.fmt); const si = $(`[data-size="${b.dataset.fmt}"]`); if (si && r.kb != null) si.textContent = `${r.kb} KB${C.formats[b.dataset.fmt].ad ? (r.kb <= C.adMaxKB ? " · under " + C.adMaxKB + " KB" : " · over limit") : ""}`; await saveFile(r.name, r.blob); }
      finally { b.disabled = false; }
    }
    else if (act === "dl-svg") { const asset = KIT().assets.find((a) => a.id === S.asset); const r = await exportBadgeSVG(asset); await saveFile(r.name, r.blob); }
    else if (act === "dl-file") { const f = b.dataset.file; const blob = await fetch(f).then((r) => r.blob()); await saveFile(f.split("/").pop(), blob); }
    else if (act === "zip-all" || act === "zip-asset") {
      b.disabled = true; const t = b.textContent; b.textContent = "Preparing...";
      try { await zipAll(act === "zip-asset" ? KIT().assets.find((a) => a.id === S.asset) : null); }
      finally { b.disabled = false; b.textContent = t; }
    }
  });

  document.addEventListener("input", (ev) => {
    const t = ev.target;
    if (t.dataset.field) {
      S.vals[S.kit] = S.vals[S.kit] || {};
      S.vals[S.kit][t.dataset.field] = t.value;
      const f = KIT().fields.find((x) => x.id === t.dataset.field);
      const c = $("#cnt-" + f.id); c.textContent = `${t.value.length}/${f.max}`; c.classList.toggle("near", t.value.length >= f.max - 3);
      save(); schedule();
    } else if (t.id === "f-code") {
      const clean = t.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, C.code.maxLength);
      if (clean !== t.value) t.value = clean;
      S.code = clean; $("#cnt-code").textContent = `${clean.length}/${C.code.maxLength}`;
      const asset = KIT().assets.find((a) => a.id === S.asset);
      $("#trk").textContent = trackingLink(asset.formats.some((f) => C.formats[f].ad) ? "web_banner" : C.tracking.defaultChannel);
      const cu = $(".clickurl .linkbox"); if (cu) cu.textContent = trackingLink("web_banner");
      save(); schedule();
    } else if (t.dataset.zoom) {
      const c = t.dataset.zoom === "photo" ? S.crop : S.repCrop; c.z = parseFloat(t.value); drawCropper(t.dataset.zoom); schedule();
    } else if (t.dataset.q) {
      S.answers[S.ev] = S.answers[S.ev] || {}; S.answers[S.ev][t.dataset.q] = t.value; save(); updateBuilt();
    }
  });
  document.addEventListener("change", (ev) => {
    const t = ev.target;
    if (t.dataset.upload) onUpload(t.dataset.upload, t.files && t.files[0]);
    else if (t.id === "safe") { S.safe = t.checked; schedule(); }
    else if (t.id === "showcode") { S.showCode = t.checked; save(); schedule(); }
    else if (t.id === "mocks") { S.mocks = t.checked; schedule(); }
  });
  ["dragover", "dragenter"].forEach((n) => document.addEventListener(n, (ev) => { const d = ev.target.closest && ev.target.closest(".drop"); if (d) { ev.preventDefault(); d.classList.add("over"); } }));
  document.addEventListener("dragleave", (ev) => { const d = ev.target.closest && ev.target.closest(".drop"); if (d) d.classList.remove("over"); });
  document.addEventListener("drop", (ev) => {
    const d = ev.target.closest && ev.target.closest(".drop"); if (!d) return;
    ev.preventDefault(); d.classList.remove("over");
    const inp = $("input[type=file]", d); const f = ev.dataTransfer.files && ev.dataTransfer.files[0];
    if (inp && f) onUpload(inp.dataset.upload, f);
  });

  /* boot */
  load();
  S.pressEv = HOME_EV;
  function fromHash() {
    const m = /^#press(?:-(raise|machina))?$/.exec(location.hash || "");
    if (m && (!m[1] || C.events[m[1]])) { S.pressEv = m[1] || HOME_EV; S.view = "press"; return true; }
    if (location.hash === "#gallery" && C.gallery) { S.pressEv = HOME_EV; S.view = "gallery"; return true; }
    return false;
  }
  fromHash();
  window.addEventListener("hashchange", () => { if (fromHash()) render(); });
  downloadsCap();
  render();
  loadFonts().then(() => { if (S.view === "studio") schedule(); });
  window.__studio = { S, buildData, exportBlob, exportBadgeSVG, render, go };
})();
