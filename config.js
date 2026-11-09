/* =====================================================================
   MACHINA Partner Toolkit v2 — CONTENT CONFIG
   Built on the MACHINA_27 Design System 1.0 (updated wordmark, Geist
   poster headlines, horizon + dateline lockups, rim-light panels)
   ---------------------------------------------------------------------
   This is the ONLY file the team needs to edit to change copy, captions,
   questions, hashtags, links, facts, formats or variants.

   Placeholders in the copy:
     {name} {first} {jobTitle} {company} {outlet} {rep} {title}
     {event} {eventShort} {year} {dates} {venue} {city} {code} {link}
     {handle} {hashtags} {ambType}
   Anything written as [ALL CAPS IN BRACKETS] is a placeholder still to
   be confirmed by the team. See HANDOVER.md for the full list.

   House rules for all copy (both design systems): no emoji, no
   exclamation marks, en dash in date ranges, no hype adjectives.
   ===================================================================== */

window.STUDIO_CONFIG = {
  version: "2.0.0",
  studioName: "MACHINA 2027 Partner Toolkit",
  privacyLine: "Your photo stays on your device. Nothing is uploaded.",

  /* ---------------------------------------------------------------- */
  /* EVENTS (fixed details, not editable by users)                    */
  /* ---------------------------------------------------------------- */
  events: {
    machina: {
      id: "machina",
      name: "MACHINA Summit",
      short: "MACHINA",
      year: "2027",
      dates: "7–8 July 2027",
      /* Brand rule: the location is only ever Paris. Never name the venue. */
      venue: "Paris",
      venueLines: ["Paris"],
      city: "Paris",
      url: "machinasummit.com",
      baseUrl: "https://machinasummit.com/tickets",
      campaign: "machina27",
      fileTag: "MACHINA27",
      tagline: ["Where AI meets", "the physical world"],
      one_liner: "Europe's leading physical AI summit.",
      /* handles are what people tag; handleUrls are the profile links */
      handles: {
        linkedin: "MACHINA Summit",
        instagram: "@machinasummit",
        x: "@MACHINASUMMIT"
      },
      handleUrls: {
        linkedin: "https://www.linkedin.com/company/machinasummit/",
        instagram: "https://www.instagram.com/machinasummit/",
        x: "https://x.com/MACHINASUMMIT"
      },
      hashtags: ["#MACHINA2027", "#MACHINASUMMIT"],
      palette: [
        { name: "Black (night)", hex: "#000000", use: "Default ground for social, banners, screens" },
        { name: "White", hex: "#FFFFFF", use: "Wordmark and type on night" },
        { name: "Off-white (day)", hex: "#F6F3EC", use: "Day tone: reports and A-size print only" },
        { name: "Rim Blue", hex: "#4A78FF", use: "Glow, edge and horizon only. Never a fill" },
        { name: "Rim Pink", hex: "#FF6FAE", use: "Glow, edge and horizon only. Never a fill" },
        { name: "Dusk", hex: "#5B6CD6", use: "Mid-morph flush" },
        { name: "Strip ink", hex: "#F6F3EC", use: "Labels and date strips at 75% on night" }
      ],
      fonts: ["Geist SemiBold 600 (poster headlines, caps, 0.88 leading, −2%)", "Blauer Nue 600 (display, web and reports)", "Bricolage Grotesque (labels in caps +16%, body copy)", "Geist SemiBold caps, 0.3em (the dateline: 7–8 JULY 2027 • PARIS)", "Geist Mono (codes, figures)"],
      logos: [
        { label: "MACHINA wordmark, white", file: "machina-wordmark-white.svg", ground: "dark" },
        { label: "MACHINA wordmark, black", file: "machina-wordmark-black.svg", ground: "light" },
        { label: "MACHINA app icon (on the rim-light tile)", file: "machina-icon-glyph.svg", ground: "dark" }
      ],
      keyVisuals: [
        { label: "Black material", file: "black-material-texture.jpg" },
        { label: "Light material", file: "light-material.jpg" }
      ],
      photoLibrary: "https://drive.google.com/drive/folders/1Glrp-nHg_xEwQVRMkNFtt7pa6T-_o5Og?ts=6ad870b0&usp=drive-dynamite",
      mediaKitUrl: "", /* website PDF link: add here to show a button */
      mediaKitFile: "MACHINA-2027-Media-Kit.pdf", /* downloadable copy until the website link is ready */
      mediaKitPages: ["media-kit-p-01.jpg","media-kit-p-02.jpg","media-kit-p-03.jpg","media-kit-p-04.jpg","media-kit-p-05.jpg","media-kit-p-06.jpg","media-kit-p-07.jpg","media-kit-p-08.jpg","media-kit-p-09.jpg","media-kit-p-10.jpg","media-kit-p-11.jpg","media-kit-p-12.jpg","media-kit-p-13.jpg"], /* page images for the in-page viewer */
      boilerplate50: "MACHINA is Europe’s leading Physical AI event, built for the people who design, deploy and invest in robotics, humanoids and the AI that brings machines into the physical world. Born from the RAISE ecosystem and organised by Chain of Events, MACHINA held its first edition at Station F in July 2026. Its second edition takes place on 7–8 July 2027 at the Palais des Congrès de Paris and closes on the evening of 8 July with the invitation-only MACHINA Gala at the Château de Versailles.",
      boilerplate100: "",
      whyAttend: "Meet the builders, deployers and investors moving physical AI into production."
    }
  },

  /* Tracking link: points to the ticket page */
  tracking: {
    template: "{base}?utm_source={kit}&utm_medium={channel}&utm_campaign={campaign}&code={code}",
    defaultChannel: "social",
    help: "Your tracking link records the ticket sales associated with your code. Make sure you use the link attached."
  },

  /* Promo code rules */
  code: { maxLength: 15, pattern: "^[A-Z0-9_-]*$", example: "AMBXXX20" }, /* each kit sets its own codeExample */

  /* ---------------------------------------------------------------- */
  /* FORMATS: add a format = add an entry here.                       */
  /* layout: post | wide | tall | box | badge                         */
  /* channel: used in the tracking link and file name                 */
  /* safe: zones drawn by the "show safe zones" toggle [x,y,w,h]       */
  /* ---------------------------------------------------------------- */
  formats: {
    post:        { label: "Post 4:5", w: 1080, h: 1350, layout: "post", channel: "social", ext: "png", fileName: "Post" },
    story:       { label: "Story 9:16", w: 1080, h: 1920, layout: "post", channel: "story", ext: "png", fileName: "Story",
                   safe: [[0, 0, 1080, 250, "Story UI"], [0, 1670, 1080, 250, "Story UI"]] },
    linkedin:    { label: "LinkedIn banner", w: 1584, h: 396, layout: "wide", channel: "linkedin", ext: "png", fileName: "LinkedInBanner",
                   avoidLeft: 560, safe: [[40, 170, 400, 226, "Profile photo (desktop)"], [592, 300, 400, 96, "Profile photo (mobile)"]] },
    xheader:     { label: "X header", w: 1500, h: 500, layout: "wide", channel: "x", ext: "png", fileName: "XHeader",
                   avoidLeft: 460, safe: [[30, 300, 400, 200, "Profile photo"]] },
    email:       { label: "Email signature", w: 600, h: 200, layout: "wide", channel: "email", ext: "jpg", fileName: "EmailSignature" },
    news600:     { label: "Newsletter 600×200", w: 600, h: 200, layout: "wide", channel: "newsletter", ext: "jpg", fileName: "Newsletter600" },
    news1200:    { label: "Newsletter 1200×400", w: 1200, h: 400, layout: "wide", channel: "newsletter", ext: "jpg", fileName: "Newsletter1200" },
    badge:       { label: "Official badge", w: 1200, h: 600, layout: "badge", channel: "web", ext: "png", fileName: "Badge", svg: true },
    leaderboard: { label: "Leaderboard 728×90", w: 728, h: 90, layout: "wide", channel: "web_banner", ext: "jpg", fileName: "Leaderboard728x90", ad: true },
    mpu:         { label: "MPU 300×250", w: 300, h: 250, layout: "box", channel: "web_banner", ext: "jpg", fileName: "MPU300x250", ad: true },
    billboard:   { label: "Billboard 970×250", w: 970, h: 250, layout: "wide", channel: "web_banner", ext: "jpg", fileName: "Billboard970x250", ad: true, oneLine: true },
    skyscraper:  { label: "Skyscraper 160×600", w: 160, h: 600, layout: "tall", channel: "web_banner", ext: "jpg", fileName: "Skyscraper160x600", ad: true },
    mobile:      { label: "Mobile 320×50", w: 320, h: 50, layout: "wide", channel: "web_banner", ext: "jpg", fileName: "Mobile320x50", ad: true }
  },
  adMaxKB: 150,

  /* Custom banner sizes (Media kit, "Website banners"). Users type a width
     and height; the layout is picked from the shape:
       wider than 2.2:1 -> wide strip, taller than 1:1.6 -> tall, otherwise box. */
  customSize: {
    assets: ["web"],          /* which asset ids allow custom sizes */
    min: 50, max: 3000,       /* px, per side */
    maxCustom: 8,             /* how many custom sizes one person can add */
    help: "Need another size for your site? Add it here. It uses the same design, fitted to your size."
  },

  /* Users can hide the promo code on their assets (their tracking link still carries it). */
  codeOptional: { label: "Show my code on the assets", help: "Turn off for a cleaner design. Your tracking link still carries your code." },

  /* Locked variants users can pick. No free colour/font/position controls. */
  variants: {
    machina: [ { id: "a", label: "Night · photo right" }, { id: "b", label: "Night · photo left" }, { id: "c", label: "Night texture · centred" } ]
  },

  /* ---------------------------------------------------------------- */
  /* KITS                                                             */
  /* ---------------------------------------------------------------- */
  kits: {

    /* ============================ AMBASSADOR ============================ */
    ambassador: {
      id: "ambassador",
      codeExample: "AMBXXX20",
      label: "Ambassador",
      door: "Personal posts, banners and captions to bring your network to Paris.",
      utmSource: "ambassador",
      ambassadorTypes: [
        { id: "founding", label: "Founding Ambassador", title: "Founding Ambassador", prefix: "Founding",
          help: "You were an ambassador at a previous edition." },
        { id: "new", label: "New Ambassador", title: "Official Ambassador", prefix: "Official",
          help: "This is your first year as an ambassador." }
      ],
      fields: [
        { id: "name", label: "Full name", max: 32, min: 2, required: true, placeholder: "First & Last Name" },
        { id: "jobTitle", label: "Job title", max: 40, placeholder: "Head of AI" },
        { id: "company", label: "Company", max: 32, placeholder: "Company name" }
      ],
      image: { kind: "photo", label: "Headshot", required: true },
      /* Shown after the date on banners; mastheadPlace is the second line top right on posts */
      location: "{city}",
      mastheadPlace: "{city}",
      /* HEADLINES: each [ ... ] is one line; each { t, s } is a run on that line.
         v2: every run is set as the Headline component (Geist SemiBold caps,
         full white). The s field is kept for compatibility only. */
      assets: [
        { id: "announce", label: "Ambassador announcement", formats: ["post", "story"], eyebrow: "Ambassador announcement",
          headline: [ [ { t: "{ambPrefix}", s: "sans" } ], [ { t: "Ambassador", s: "italic" } ] ],
          showCode: false },
        { id: "banners", label: "Profile banners", formats: ["linkedin", "xheader"],
          headline: [ [ { t: "{ambPrefix} ", s: "sans" }, { t: "Ambassador", s: "italic" } ] ],
          bigLogo: true, showCode: true },
        { id: "signature", label: "Email signature", formats: ["email"],
          headline: [ { t: "Where AI meets", s: "sans" }, { t: "the physical world", s: "italic" } ],
          showCode: true }
      ],
      captions: {
        /* [CAPTION TEMPLATES TBC: tone not finalised] */
        announce: {
          linkedin: "I'm proud to share that I'm {ambArticle} {ambTitle} for {event} {year}.\n\n{eventShort} brings together the people who build, buy and fund {topic} for two days in {city}, {dates}.\n\nIf you're thinking of coming, use my code {code} when you register: {link}\n\n{hashtags}",
          instagram: "{ambTitle} for {event} {year}. See you in {city}, {dates}.\n\nCode {code} at the link in my bio.\n\n{hashtags}",
          x: "I'm {ambArticle} {ambTitle} for {event} {year}, {dates} in {city}. Use code {code}: {link} {hashtags}"
        },
        joinme: {
          linkedin: "I'll be at {event} {year} in {city}, {dates}, and I'd like you to be in the room too.\n\nUse my code {code} to register: {link}\n\nLet me know if you're coming, I'd be glad to meet.\n\n{hashtags}",
          instagram: "Join me at {event} {year}. {dates}, {city}.\n\nUse code {code}. Link in bio.\n\n{hashtags}",
          x: "Join me at {event} {year}, {dates} in {city}. Code {code}: {link} {hashtags}"
        }
      },
      builder: {
        intro: "Answer any of these. Your answers drop into a ready-made post. Skip what you like.",
        personal: [
          { id: "why", q: "Why does {eventShort} matter to you?", slot: "{a}" },
          { id: "who", q: "Who should come with you, and why?", slot: "If you work in {a}, this is your room." },
          { id: "look", q: "What are you most looking forward to in Paris?", slot: "What I'm most looking forward to: {a}" },
          { id: "last", q: "What's one thing you took away from last year?", slot: "One thing I took away from last year: {a}", only: "founding" }
        ],
        industry: {
          machina: [
            { id: "first", q: "Which real-world task do you think robots will take over first, and why?", slot: "The first real-world task I think robots will take over: {a}" },
            { id: "gap", q: "What's the biggest gap between a robotics demo and a real deployment?", slot: "The biggest gap between a demo and a real deployment: {a}" },
            { id: "europe", q: "Where can Europe lead in Physical AI?", slot: "Where Europe can lead in physical AI: {a}" }
          ]
        },
        /* [CONFIRM / EDIT QUESTION LIST] */
        open: "I'm {ambArticle} {ambTitle} for {event} {year}.",
        close: "{dates}, {city}. Use my code {code} to join me: {link}\n\n{hashtags}"
      },
      tone: {
        /* [TBC] */
        traits: ["First person and specific", "Warm, not salesy", "Confident, no hype", "Short sentences"],
        examples: ["I'll be in Paris for two days of conversations that actually move things forward.", "If you're working on physical AI in production, come and find me."],
        avoid: ["Exclamation marks and emoji", "\"Game-changing\", \"revolutionary\", \"unmissable\"", "Stats that aren't on the facts sheet", "Promising discounts other than your code"]
      },
      guide: {
        do: ["Use a clear, front-facing headshot", "Keep your title short", "Post with the caption and your link", "Tag the event account"],
        dont: ["Crop, stretch or recolour the exported asset", "Add your own text or stickers", "Use a low-res or group photo", "Screenshot instead of downloading"],
        howTo: [
          { asset: "LinkedIn banner", where: "LinkedIn profile > the pencil on your background photo > Upload photo." },
          { asset: "X header", where: "X profile > Edit profile > tap the header > upload." },
          { asset: "Posts (4:5)", where: "LinkedIn or Instagram feed post. Paste the caption from the Write tab." },
          { asset: "Stories (9:16)", where: "Instagram or LinkedIn story. Add a link sticker with your tracking link." },
          { asset: "Email signature", where: "Gmail: Settings > Signature > insert image, then link it to your tracking link. Outlook: Signatures > insert picture." }
        ],
        brandNotes: ""
      }
    },

    /* ============================== PARTNER ============================= */
    partner: {
      id: "partner",
      codeExample: "PAXXX20",
      label: "Partner",
      door: "Partner announcements, newsletter banners and your official badge.",
      utmSource: "partner",
      fields: [
        { id: "company", label: "Company name", max: 32, min: 2, required: true, placeholder: "Company name" },
        { id: "rep", label: "Rep name (optional)", max: 32, placeholder: "First & Last Name" },
        { id: "title", label: "Rep title (optional)", max: 40, placeholder: "Head of Partnerships" }
      ],
      image: { kind: "logo", label: "Company logo", required: true },
      repPhoto: true,
      location: "{city}",
      mastheadPlace: "{city}",
      assets: [
        { id: "announce", label: "Partner announcement", formats: ["post", "story"], eyebrow: "Partner announcement",
          headline: [ [ { t: "Official", s: "sans" } ], [ { t: "Partner", s: "italic" } ] ],
          showCode: true },
        { id: "newsletter", label: "Newsletter banners", formats: ["news600", "news1200"],
          headline: [ { t: "Join us at", s: "sans" }, { t: "{event}", s: "italic" } ],
          showCode: true },
        { id: "badge", label: "Official Partner badge", formats: ["badge"], badgeLabel: "Official Partner" }
      ],
      captions: {
        /* [TEMPLATES TBC] plain and direct: one fact, one call to action, one code */
        announce: {
          linkedin: "{company} is an Official Partner of {event} {year}, {dates} in {city}.\n\nOur community gets in with code {code}: {link}\n\n{hashtags}",
          instagram: "{company} x {event} {year}. {dates}, {city}.\n\nCode {code}, link in bio.\n\n{hashtags}",
          x: "{company} is an Official Partner of {event} {year}, {dates}, {city}. Code {code}: {link}"
        }
      },
      guide: {
        do: ["Use the badge file as supplied", "Keep clear space around our logo", "Use your own code in every post", "Link every asset to your tracking link"],
        dont: ["Recolour our logo", "Lock up our logo with yours yourself: use the badge", "Stretch or crop the exported files", "Add claims or stats that aren't on the facts sheet"],
        coBranding: [
          "Clear space around each logo: at least the height of the MACHINA \"M\".",
          "Logos sit side by side, optically equal in size, separated by a thin rule.",
          "Event logos only ever sit on a dark ground, in white.",
          "Minimum size: event logo 24px tall on screen, 10mm in print."
        ]
      }
    },

    /* =============================== MEDIA ============================== */
    media: {
      id: "media",
      codeExample: "MEDXXX20",
      label: "Media",
      door: "Website banners first, plus social assets and a press room for editorial.",
      utmSource: "media",
      fields: [
        { id: "outlet", label: "Outlet name", max: 32, min: 2, required: true, placeholder: "Outlet name" },
        { id: "rep", label: "Journalist name (optional)", max: 32, placeholder: "First & Last Name" }
      ],
      image: { kind: "logo", label: "Outlet logo", required: true },
      repPhoto: true,
      location: "{city}",
      mastheadPlace: "{city}",
      assets: [
        { id: "web", label: "Website banners", formats: ["leaderboard", "mpu", "billboard", "skyscraper", "mobile"],
          headline: [ [ { t: "Europe's leading", s: "sans" } ], [ { t: "physical AI summit", s: "sans" } ] ],
          showCode: true, priority: true },
        { id: "badge", label: "Official Media Partner badge", formats: ["badge"], badgeLabel: "Official Media Partner" },
        { id: "announce", label: "Media partner announcement", formats: ["post", "story"], eyebrow: "Media partner",
          headline: [ [ { t: "Official", s: "sans" } ], [ { t: "Media Partner", s: "italic" } ] ],
          showCode: true }
      ],
      bannerCopy: { cta: "Use code {code}", line: "{dates}" },
      captions: {
        /* [TEMPLATES TBC] */
        announce: {
          linkedin: "{outlet} is an Official Media Partner of {event} {year}, {dates} in {city}.\n\nReaders get in with code {code}: {link}\n\n{hashtags}",
          instagram: "{outlet} x {event} {year}. {dates}, {city}. Code {code}, link in bio.\n\n{hashtags}",
          x: "{outlet} is an Official Media Partner of {event} {year}. Code {code}: {link}"
        }
      },
      angles: {
        /* [COPY TBC] 5–8 pitchable 2027 angles per event */
        machina: [
          "Physical AI in Europe: where the region can lead",
          "From demo to deployment: the real gap in robotics",
          "Humanoids at work: which tasks go first",
          "Manufacturing, logistics and energy: physical AI's first markets",
          "Robot learning and data: what it takes to train machines for the real world",
          "Funding physical AI: how investors are pricing robotics in 2027"
        ]
      },
      press: {
        accreditationUrl: "[ADD LINK: PRESS ACCREDITATION FORM]",
        releases: [
          { date: "10 November 2026", title: "MACHINA Summit 2027: Europe's leading Physical AI event returns to Paris, 7–8 July 2027", url: "MACHINA-2027-Press-Release.pdf", pdf: "MACHINA-2027-Press-Release.pdf", text: "# MACHINA Summit 2027: Europe's leading Physical AI event returns to Paris, 7–8 July 2027\n\n_After a sold-out debut at Station F, MACHINA Summit is moving to a bigger home. More than 1,500 people came to the first edition in July 2026. On 7-8 July 2027 the summit moves to the Palais des Congrès de Paris and grows to two days, more than 3,500 attendees and ten times the floor space. It brings together the builders, investors and industrial leaders taking physical AI from prototype to production.\n\n**PARIS, 10 November 2026** — The next era of AI will not live only on screens. It will build, lift, move and assemble. The race to get there is different from the race for chatbots and language models. It showcases what Europe has spent decades building: industrial depth, precision engineering and world-class robotics research.\n\n> “The physical AI revolution will not come all at once. It will happen gradually and then suddenly.”\n> — Jim Fan, Director & Distinguished Research Scientist, NVIDIA, at MACHINA 2026\n\nThe first edition took place on 7 July 2026 at Station F, Paris, across a Master Stage and a Builder Stage. It gathered more than 1,500 attendees, 890 companies and 97 speakers, including Jim Fan (NVIDIA), Bernt Børnich (1X), Marc Raibert (RAI Institute), Carolina Parada (Google DeepMind) and David Reger (Neura Robotics), alongside leaders from Apptronik, Boston Dynamics, Agility Robotics, Skild AI and more.\n\nWhat was discussed on stage could be seen on the floor: Boston Dynamics, LimX Dynamics, Schaeffler and AgiBot brought their robots on site for live demos, showing that physical AI is already working in the real world.\n\n> \"The place is always defined by people and here are the best people.\"\n> — David Reger, Founder and CEO, Neura Robotics\n\n> \"MACHINA is the leading physical AI event for the whole of Europe, where I see a big future ahead of us.\"\n> — Vicky Hu, Co-Founder, Centific\n\nIn 2027, MACHINA becomes more than a conference. The summit grows to two days, with 3,500 attendees and 200 speakers expected, and runs alongside RAISE Summit, the ROI platform for global AI, which drew more than 9,000 attendees in 2026.\n\nAround the summit, MACHINA Week brings the people and companies shaping physical AI to Paris for a full week of programming, including:\n\n- The MACHINA Gala at the Château de Versailles: a limited access evening for 500 leaders across AI and physical AI. It’s the kind of access the industry rarely gets, with founders, investors and the executives deploying robots at scale at one table.\n- The MACHINA CxO Summit: an invitation-only forum for the executives deploying robotics at scale, with curated one-to-one meetings between buyers, builders and investors.\n- MACHINA Factory: a builders’ activation where engineers ship physical AI products in front of the investors and enterprises ready to fund and deploy them.\n- A week of curated gatherings across Paris: private dinners and salons at some of the city’s most remarkable addresses.\n\nThe first confirmed speakers for 2027 include Albert Pescheck (CEO, Bosch Digital Twin Industries), Matthieu Masselin (CEO, Wandercraft), Evan Beard (CEO, Standard Bots), Jonathan Hurst (Co-Founder, Agility Robotics), and Abhinav Gupta (Co-founder & President, Skild AI). More speakers, partners and programme highlights will be announced in the coming weeks.\n\n> \"Physical AI is the next frontier, and the people building it should not have to fly to San Francisco or Shenzhen to meet each other. MACHINA 2027 will set the direction for embodied intelligence over the next 12 months.”\n> — David Amar, Co-Founder, MACHINA\n\nCompanies interested in partnering with or exhibiting at MACHINA 2027 can book a call with the partnerships team at www.machinasummit.com/sponsor.\n\nIn July 2027, Paris hosts the defining week for frontier technology, and MACHINA is where it becomes physical.\n\n## About MACHINA\n\nMACHINA is Europe’s leading Physical AI event, built for the people who design, deploy and invest in robotics, humanoids and the AI that brings machines into the physical world. Born from the RAISE ecosystem and organised by Chain of Events, MACHINA held its first edition at Station F in July 2026. Its second edition takes place on 7–8 July 2027 at the Palais des Congrès de Paris and closes on the evening of 8 July with the invitation-only MACHINA Gala at the Château de Versailles.\n\nwww.machinasummit.com\n\n## Media contact\n\nVanessa Leong, PR & Media, Marketing Manager · vanessa.leong@chainof.events" }
        ],
        quotes: {
          
          machina: [
            { quote: "The place is always defined by people and here are the best people.", name: "David Reger", title: "Founder and CEO", company: "Neura Robotics", event: "MACHINA Summit 2026" },
            { quote: "MACHINA is the leading physical AI event for the whole of Europe, where I see a big future ahead of us.", name: "Vicky Hu", title: "Co-Founder", company: "Centific", event: "MACHINA Summit 2026" },
            { quote: "The physical AI revolution will not come all at once. It will happen gradually and then suddenly. And as a wise man would say, if you believe in robotics, robotics will also believe in you.", name: "Jim Fan", title: "Director & Distinguished Research Scientist", company: "NVIDIA", event: "MACHINA Summit 2026" },
            { quote: "There's energy, time, and people really going into this. Obviously, this room is a good catalyst for what the rest of the world is looking like in terms of putting their energy into it.", name: "Andrew Lonsberry", title: "CEO", company: "Path Robotics", event: "MACHINA Summit 2026" },
            { quote: "I want MACHINA to be the commercial platform. I want whatever is built in the next 12 months to always be defined first at MACHINA.", name: "David Amar", title: "Co-Founder", company: "MACHINA", event: "MACHINA Summit 2026" }
          ]
        },
        contact: { name: "Vanessa Leong", title: "PR & Media, Marketing Manager", email: "vanessa.leong@chainof.events" },
        credit: "Tag MACHINA Summit when you post: MACHINA Summit on LinkedIn, @machinasummit on Instagram and @MACHINASUMMIT on X."
      },
      guide: {
        do: ["Use banners at their exact size", "Link every banner to your tracking URL", "Use the badge file as supplied", "Credit MACHINA Summit in full on first mention"],
        dont: ["Animate, resize or re-export the banners", "Recolour or re-draw our logos", "Publish embargoed news early", "Use photos without the credit line"]
      }
    }
  },

  /* ---------------------------------------------------------------- */
  /* KEY FACTS (approved numbers only)                                */
  /* ---------------------------------------------------------------- */
  facts: {
    machina: [
      /* y = which year group the fact shows under: "2027" (upcoming) or "2026" (results) */
      /* r = row within the year group */
      { y: "2027", r: 1, k: "Dates", v: "7–8 July 2027" },
      { y: "2027", r: 1, k: "Venue", v: "Palais des Congrès & Château de Versailles" },
      { y: "2027", r: 1, k: "City", v: "Paris, France" },
      { y: "2027", r: 2, k: "Attendees", v: "3,500+" },
      { y: "2027", r: 2, k: "Companies", v: "1,500+" },
      { y: "2027", r: 3, k: "C-level executives and founders", v: "70%" },
      { y: "2027", r: 3, k: "Media", v: "90+" },
      { y: "2026", r: 1, k: "Attendees", v: "1,500+" },
      { y: "2026", r: 1, k: "Companies", v: "890+" },
      { y: "2026", r: 2, k: "C-level executives and founders", v: "43%" },
      { y: "2026", r: 2, k: "Media", v: "50+" }
    ]
  },


  /* ---------------------------------------------------------------- */
  /* STUDIO SHELL COPY + UPLOAD TIPS                                   */
  /* ---------------------------------------------------------------- */
  shell: {
    landingTitle: ["Make your assets", "for Paris"],
    eyebrow: "MACHINA Summit · 2027",
    landingIntro: "Pick who you are. Add your name, photo or logo and your code. Everything is laid out for you in the event's brand, ready to download.",
    footer: "Built for the MACHINA community. Questions: vanessa.leong@chainof.events"
  },
  tips: {
    photo: [
      "Front-facing, shoulders up, eyes level with the camera",
      "Even light on your face, no strong shadows",
      "Plain or softly blurred background",
      "At least 1000 px on the short side"
    ],
    logo: [
      "Use a PNG with a transparent background, or an SVG",
      "A one-colour version works best: we turn it white for dark grounds",
      "Crop tight to the logo, with no extra padding",
      "At least 600 px wide"
    ]
  },
  /* ---------------------------------------------------------------- */
  /* EVENT GALLERY (photos in assets/gallery/full, previews in /thumb) */
  /* Add a photo: put the full JPG in full/ and a ~720px copy in thumb/ */
  /* with the same name, then add a line here.                         */
  /* ---------------------------------------------------------------- */
  gallery: {
    title: "MACHINA 2026 Event Gallery",
    intro: "Photos provided by Chain of Events for editorial use by approved MACHINA Summit ambassadors, partners and media. Please credit “Photo: MACHINA Summit” and tag us when you post.",
    credit: "© MACHINA Summit 2026",
    /* url = watch (YouTube); downloadUrl = the file on Google Drive */
    aftermovie: { label: "Watch the MACHINA 2026 aftermovie", url: "https://www.youtube.com/watch?v=CX6N_YjAx5U", downloadLabel: "Download the aftermovie", downloadUrl: "https://drive.google.com/file/d/1xYAM7pPf1QYo4jbNw-VHXXenYEVyz0AL/view?usp=sharing" },
    photos: [
      { file: "machina-2026-01.jpg", w: 1200, h: 800, caption: "Humanoid demo at a partner stand", credit: "\u00a9 MACHINA Summit" },
      { file: "machina-2026-02.jpg", w: 1200, h: 800, caption: "The MACHINA Summit floor", credit: "\u00a9 MACHINA Summit" },
      { file: "machina-2026-03.jpg", w: 1200, h: 800, caption: "Expo floor and lounges", credit: "\u00a9 MACHINA Summit" },
      { file: "machina-2026-04.jpg", w: 600, h: 900, caption: "Humanoid demo on the expo floor", credit: "\u00a9 MACHINA Summit" },
      { file: "machina-2026-05.jpg", w: 600, h: 900, caption: "Robot demo on the expo floor", credit: "\u00a9 MACHINA Summit" },
      { file: "machina-2026-06.jpg", w: 600, h: 900, caption: "Quadruped robot on the floor", credit: "\u00a9 MACHINA Summit" },
      { file: "machina-2026-07.jpg", w: 1200, h: 800, caption: "Humanoid robot on the expo floor", credit: "\u00a9 MACHINA Summit" },
      { file: "machina-2026-08.jpg", w: 1200, h: 800, caption: "Partner stands from above", credit: "\u00a9 MACHINA Summit" },
      { file: "machina-2026-09.jpg", w: 1200, h: 800, caption: "Session on the Builder Stage", credit: "\u00a9 MACHINA Summit" },
      { file: "machina-2026-10.jpg", w: 1200, h: 800, caption: "Panel on the Builder Stage", credit: "\u00a9 MACHINA Summit" },
      { file: "machina-2026-11.jpg", w: 2400, h: 1600, caption: "Busy partner stands", credit: "\u00a9 MACHINA Summit" },
      { file: "machina-2026-12.jpg", w: 2400, h: 1600, caption: "Busy partner stands", credit: "\u00a9 MACHINA Summit" },
      { file: "machina-2026-13.jpg", w: 2400, h: 1600, caption: "Busy partner stands", credit: "\u00a9 MACHINA Summit" },
      { file: "machina-2026-14.jpg", w: 2400, h: 1600, caption: "Stages, spaces and lounges", credit: "\u00a9 MACHINA Summit" },
      { file: "machina-2026-15.jpg", w: 2400, h: 1600, caption: "Robots on the floor", credit: "\u00a9 MACHINA Summit" },
      { file: "machina-2026-16.jpg", w: 2400, h: 1600, caption: "Robots on the floor", credit: "\u00a9 MACHINA Summit" },
      { file: "machina-2026-17.jpg", w: 2400, h: 1600, caption: "Robots on the floor", credit: "\u00a9 MACHINA Summit" },
      { file: "machina-2026-18.jpg", w: 2400, h: 1600, caption: "Robots on the floor", credit: "\u00a9 MACHINA Summit" },
      { file: "machina-2026-19.jpg", w: 2400, h: 1600, caption: "Builder Stage · World Models vs Task-Specific Perception: What Does a Robot Actually Need to See?", credit: "\u00a9 MACHINA Summit" },
      { file: "machina-2026-20.jpg", w: 2400, h: 1600, caption: "Builder Stage · World Models vs Task-Specific Perception", credit: "\u00a9 MACHINA Summit" },
      { file: "machina-2026-21.jpg", w: 2400, h: 1600, caption: "Builder Stage · World Models vs Task-Specific Perception", credit: "\u00a9 MACHINA Summit" },
      { file: "machina-2026-22.jpg", w: 2400, h: 1601, caption: "Master Stage · Fireside Chat with Marc Raibert, Executive Director of RAI Institute, Founder of Boston Dynamics · Dynamic Robots", credit: "\u00a9 MACHINA Summit" },
      { file: "machina-2026-23.jpg", w: 2400, h: 1600, caption: "Master Stage · Fireside Chat with Marc Raibert", credit: "\u00a9 MACHINA Summit" },
      { file: "machina-2026-24.jpg", w: 600, h: 900, caption: "Keynote on the Master Stage", credit: "\u00a9 MACHINA Summit" },
      { file: "machina-2026-25.jpg", w: 1200, h: 800, caption: "Master Stage · Keynote by Jim Fan, Director & Distinguished Research Scientist at NVIDIA · Robotics: The End Game", credit: "\u00a9 MACHINA Summit" },
      { file: "machina-2026-26.jpg", w: 1200, h: 800, caption: "Keynote on the Master Stage", credit: "\u00a9 MACHINA Summit" },
      { file: "machina-2026-27.jpg", w: 1200, h: 800, caption: "Master Stage · Keynote by Jim Fan, NVIDIA · Robotics: The End Game", credit: "\u00a9 MACHINA Summit" },
      { file: "machina-2026-28.jpg", w: 1200, h: 800, caption: "Networking", credit: "\u00a9 MACHINA Summit" }
    ]
  },

};
