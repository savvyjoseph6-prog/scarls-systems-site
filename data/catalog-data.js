/**
 * SCARLS SYSTEMS — SERVICE CATALOGUE
 * ------------------------------------------------------------------
 * This file is the single source of truth for every service shown
 * on the site. It is intentionally shaped like the future database
 * tables (categories / services / packages) described in the SCARLS
 * platform spec, so that in a later phase this whole file can be
 * deleted and replaced with a fetch() call to a Google Apps Script
 * (or Supabase) endpoint that returns the exact same JSON shape.
 *
 * NOTHING in catalog.js (the renderer) or index.html hard-codes a
 * service name or price — everything reads from SCARLS_CATALOG below.
 * To add/edit/hide a service, change it here only.
 * ------------------------------------------------------------------
 */

window.SCARLS_CATALOG = {

  categories: [
    { id: "acquire",    name: "Acquire",    tagline: "Advertising & customer acquisition", order: 1, active: true },
    { id: "convert",    name: "Convert",    tagline: "Funnels & conversion systems",        order: 2, active: true },
    { id: "create",     name: "Create",     tagline: "Video, creative & copy production",   order: 3, active: true },
    { id: "educate",    name: "Educate",    tagline: "Classes, webinars & education",        order: 4, active: true },
    { id: "track",      name: "Track",      tagline: "Tracking, analytics & attribution",    order: 5, active: true },
    { id: "automate",   name: "Automate",   tagline: "Automation & integrations",            order: 6, active: true },
    { id: "strategize", name: "Strategize", tagline: "Marketing & growth strategy",          order: 7, active: true },
    { id: "custom",     name: "Custom",     tagline: "Don't see what you need?",             order: 8, active: true }
  ],

  services: [

    /* ============================= ACQUIRE ============================= */
    {
      id: "meta-ads-management", category_id: "acquire", name: "Meta Ads Management",
      short_description: "Ongoing management of your Facebook & Instagram ad campaigns.",
      full_description: "SCARLS manages your Facebook and Instagram advertising campaigns to help your business consistently reach potential customers and generate leads or sales.",
      who_for: "Businesses already running (or ready to run) paid ads who need someone managing performance week to week.",
      included: ["Campaign strategy", "Audience targeting", "Campaign management", "Performance monitoring", "Optimization", "Reporting"],
      excluded: ["Advertising spend", "Creative production unless separately purchased"],
      deliverables: ["Live, optimized ad campaigns", "Monthly performance report"],
      requirements: ["Active Meta Business account", "Access to ad account"],
      pricing_model: "subscription", starting_price: 200000, price_label: "₦200,000/mo",
      delivery_time: "Ongoing, monthly", featured: true, active: true, coming_soon: false,
      related: ["meta-pixel-setup", "ad-creative-strategy", "landing-page"], order: 1, packages: []
    },
    {
      id: "google-ads-management", category_id: "acquire", name: "Google Ads Management",
      short_description: "Ongoing management of your Google Search & Display campaigns.",
      full_description: "SCARLS manages your Google Ads account to keep campaigns optimized for the searches most likely to turn into customers.",
      who_for: "Businesses with search intent (people actively looking for what they sell).",
      included: ["Keyword strategy", "Campaign management", "Bid optimization", "Reporting"],
      excluded: ["Ad spend", "Landing page design unless separately purchased"],
      deliverables: ["Live, optimized Google Ads campaigns", "Monthly performance report"],
      requirements: ["Google Ads account access"],
      pricing_model: "subscription", starting_price: 250000, price_label: "₦250,000/mo",
      delivery_time: "Ongoing, monthly", featured: false, active: true, coming_soon: false,
      related: ["google-analytics-setup"], order: 2, packages: []
    },
    {
      id: "google-ads-setup", category_id: "acquire", name: "Google Ads Setup",
      short_description: "One-time build of a new Google Ads account and campaign structure.",
      full_description: "SCARLS builds your Google Ads account from scratch — structure, keywords, targeting and conversion tracking — so it's ready to run.",
      who_for: "Businesses launching Google Ads for the first time.",
      included: ["Account structure", "Keyword research", "Campaign build", "Conversion setup"],
      excluded: ["Ongoing management", "Ad spend"],
      deliverables: ["Fully configured Google Ads account"], requirements: ["Access to a Google Ads account"],
      pricing_model: "one_time", starting_price: 50000, price_label: "₦50,000–₦200,000",
      delivery_time: "5–10 business days", featured: false, active: true, coming_soon: false,
      related: ["google-ads-management"], order: 3, packages: []
    },
    {
      id: "ad-account-setup", category_id: "acquire", name: "Ad Account Setup",
      short_description: "Clean, correctly configured Meta or Google ad account setup.",
      full_description: "SCARLS sets up your advertising account correctly from day one — business manager, payment method, permissions and pixel groundwork.",
      who_for: "New advertisers or businesses with a broken/flagged ad account.",
      included: ["Business Manager setup", "Ad account creation", "Permissions & access setup"],
      excluded: ["Campaign creation", "Creative production"],
      deliverables: ["Working ad account, ready to launch campaigns"], requirements: ["Business documentation for verification"],
      pricing_model: "one_time", starting_price: 20000, price_label: "₦20,000",
      delivery_time: "2–4 business days", featured: false, active: true, coming_soon: false,
      related: ["meta-ads-management"], order: 4, packages: []
    },
    {
      id: "ads-audit", category_id: "acquire", name: "Ads Audit & Optimization",
      short_description: "A full review of your current ad account with fixes and recommendations.",
      full_description: "SCARLS audits your existing ad account to find what's wasting spend, what's underperforming, and what to fix first.",
      who_for: "Businesses already running ads that aren't performing as expected.",
      included: ["Account structure review", "Targeting review", "Creative review", "Written recommendations"],
      excluded: ["Implementation of changes (available separately)"],
      deliverables: ["Written audit report with prioritized fixes"], requirements: ["Read access to ad account"],
      pricing_model: "one_time", starting_price: 15000, price_label: "₦15,000",
      delivery_time: "3–5 business days", featured: false, active: true, coming_soon: false,
      related: ["meta-ads-management"], order: 5, packages: []
    },
    {
      id: "ad-creative-strategy", category_id: "acquire", name: "Ad Creative Strategy",
      short_description: "A strategic direction for what your ad creatives should say and show.",
      full_description: "SCARLS defines the creative angles, hooks and formats your ads should use before a single asset is produced.",
      who_for: "Businesses whose ads look fine but aren't converting.",
      included: ["Audience/message-market-fit review", "Hook & angle recommendations", "Creative brief"],
      excluded: ["Production of the creative itself"],
      deliverables: ["Creative strategy document"], requirements: ["Current offer details"],
      pricing_model: "one_time", starting_price: 20000, price_label: "₦20,000",
      delivery_time: "3–5 business days", featured: false, active: true, coming_soon: false,
      related: ["ad-creative-design"], order: 6, packages: []
    },
    {
      id: "lead-generation-campaign", category_id: "acquire", name: "Lead Generation Campaign",
      short_description: "A campaign built specifically to generate qualified leads.",
      full_description: "SCARLS builds and launches a lead generation campaign designed around your specific offer and audience.",
      who_for: "Businesses that need a steady flow of qualified leads.",
      included: ["Campaign build", "Targeting", "Lead form or landing page routing"], excluded: ["Ad spend"],
      deliverables: ["Live lead generation campaign"], requirements: ["Defined offer"],
      pricing_model: "one_time", starting_price: null, price_label: "Custom",
      delivery_time: "Scoped per project", featured: false, active: true, coming_soon: false,
      related: ["lead-generation-funnel"], order: 7, packages: []
    },
    {
      id: "retargeting-campaign", category_id: "acquire", name: "Retargeting Campaign",
      short_description: "Campaigns that bring back visitors who didn't convert the first time.",
      full_description: "SCARLS sets up retargeting campaigns to re-engage people who visited your site or engaged with your content but didn't buy.",
      who_for: "Businesses with existing traffic that isn't fully converting.",
      included: ["Audience setup", "Campaign build", "Creative sequencing"], excluded: ["Ad spend"],
      deliverables: ["Live retargeting campaign"], requirements: ["Pixel/tracking already installed"],
      pricing_model: "one_time", starting_price: null, price_label: "Custom",
      delivery_time: "Scoped per project", featured: false, active: true, coming_soon: false,
      related: ["meta-pixel-setup"], order: 8, packages: []
    },

    /* ============================= CONVERT ============================= */
    {
      id: "landing-page", category_id: "convert", name: "Landing Page",
      short_description: "A dedicated page built to convert visitors from a specific campaign.",
      full_description: "SCARLS designs and builds a landing page matched to your offer and traffic source, from a simple single-offer page up to a full conversion-optimized build.",
      who_for: "Anyone running ads or campaigns that need a page to send traffic to.",
      included: ["Copy structure guidance", "Design", "Mobile optimization", "Basic on-page tracking"],
      excluded: ["Hosting/domain costs", "Paid ad management"],
      deliverables: ["Live, hosted landing page"], requirements: ["Offer details, logo/brand assets"],
      pricing_model: "one_time", starting_price: 7000, price_label: "From ₦7,000",
      delivery_time: "2–7 business days depending on package", featured: true, active: true, coming_soon: false,
      related: ["checkout-flow-setup", "landing-page-copy"], order: 1,
      packages: [
        { id: "lp-basic", name: "Basic", price: 7000, price_label: "₦7,000", description: "A simple single-offer landing page.", features: ["1 section flow", "Mobile responsive", "1 revision round"], delivery_time: "2–3 business days", recommended: false, active: true },
        { id: "lp-standard", name: "Standard", price: 15000, price_label: "₦15,000", description: "A fuller page with more persuasion sections.", features: ["Multi-section flow", "Mobile responsive", "Basic tracking", "2 revision rounds"], delivery_time: "4–5 business days", recommended: true, active: true },
        { id: "lp-complex", name: "Complex / Conversion", price: 30000, price_label: "₦30,000", description: "A fully conversion-optimized page for serious campaigns.", features: ["Full persuasion structure", "Mobile responsive", "Advanced tracking", "3 revision rounds"], delivery_time: "5–7 business days", recommended: false, active: true }
      ]
    },
    {
      id: "sales-page", category_id: "convert", name: "Sales Page",
      short_description: "A long-form page built to sell a specific product or offer directly.",
      full_description: "SCARLS builds a dedicated sales page structured to walk a visitor from interest to purchase.",
      who_for: "Businesses selling a specific product, service or course.",
      included: ["Persuasion-structured layout", "Design", "Mobile optimization"], excluded: ["Copywriting unless separately purchased"],
      deliverables: ["Live, hosted sales page"], requirements: ["Offer details and, ideally, sales copy"],
      pricing_model: "one_time", starting_price: 50000, price_label: "₦50,000",
      delivery_time: "5–8 business days", featured: false, active: true, coming_soon: false,
      related: ["sales-page-copy", "checkout-flow-setup"], order: 2, packages: []
    },
    {
      id: "lead-generation-funnel", category_id: "convert", name: "Lead Generation Funnel",
      short_description: "A complete multi-step funnel built to capture and qualify leads.",
      full_description: "SCARLS builds a full lead generation funnel — landing page, opt-in flow and thank-you/follow-up sequence.",
      who_for: "Businesses that need a repeatable system for capturing leads, not just a single page.",
      included: ["Landing page", "Opt-in flow", "Thank-you page", "Basic tracking"], excluded: ["Ad spend and management"],
      deliverables: ["Fully connected lead funnel"], requirements: ["Lead magnet or offer to promote"],
      pricing_model: "one_time", starting_price: 40000, price_label: "₦40,000–₦100,000",
      delivery_time: "7–14 business days", featured: false, active: true, coming_soon: false,
      related: ["lead-follow-up-automation"], order: 3, packages: []
    },
    {
      id: "webinar-funnel", category_id: "convert", name: "Webinar Funnel",
      short_description: "A complete funnel for registering and converting webinar attendees.",
      full_description: "SCARLS builds the full webinar funnel — registration page, reminder flow, live/replay page and offer page.",
      who_for: "Educators, coaches and course creators selling through a webinar.",
      included: ["Registration page", "Reminder sequence", "Webinar/replay page", "Offer page"], excluded: ["Webinar hosting platform costs"],
      deliverables: ["Fully connected webinar funnel"], requirements: ["Webinar topic, date and offer"],
      pricing_model: "one_time", starting_price: 80000, price_label: "₦80,000–₦200,000",
      delivery_time: "10–15 business days", featured: false, active: true, coming_soon: false,
      related: ["webinar-script", "webinar-setup"], order: 4, packages: []
    },
    {
      id: "vsl-funnel", category_id: "convert", name: "VSL Funnel",
      short_description: "A funnel built around a video sales letter as the main pitch.",
      full_description: "SCARLS builds a complete VSL funnel — landing page, video placement, and order/offer page.",
      who_for: "Businesses whose offer is best explained through video before asking for the sale.",
      included: ["VSL landing page", "Video integration", "Offer page"], excluded: ["VSL production itself unless separately purchased"],
      deliverables: ["Fully connected VSL funnel"], requirements: ["Finished VSL or VSL script"],
      pricing_model: "one_time", starting_price: 80000, price_label: "₦80,000–₦200,000",
      delivery_time: "10–15 business days", featured: false, active: true, coming_soon: false,
      related: ["vsl-production", "vsl-script"], order: 5, packages: []
    },
    {
      id: "conversion-rate-optimization", category_id: "convert", name: "Conversion Rate Optimization",
      short_description: "Improvements to an existing page to increase how many visitors convert.",
      full_description: "SCARLS reviews and improves an existing landing or sales page to increase its conversion rate.",
      who_for: "Businesses with an existing page getting traffic but underperforming.",
      included: ["Page audit", "Copy & layout recommendations", "Implementation of agreed changes"], excluded: ["Full page rebuild"],
      deliverables: ["Updated, optimized page"], requirements: ["Access to existing page"],
      pricing_model: "one_time", starting_price: 10000, price_label: "₦10,000",
      delivery_time: "3–5 business days", featured: false, active: true, coming_soon: false,
      related: ["landing-page"], order: 6, packages: []
    },
    {
      id: "checkout-flow-setup", category_id: "convert", name: "Checkout / Payment Flow Setup",
      short_description: "A working checkout flow connected to your payment provider.",
      full_description: "SCARLS builds and connects a checkout flow for your product or service, including payment provider integration.",
      who_for: "Businesses selling directly on their website.",
      included: ["Checkout page", "Payment provider connection", "Order confirmation flow"], excluded: ["Transaction/payment provider fees"],
      deliverables: ["Working checkout flow"], requirements: ["Payment provider account (e.g. Paystack)"],
      pricing_model: "one_time", starting_price: 15000, price_label: "₦15,000",
      delivery_time: "3–6 business days", featured: false, active: true, coming_soon: false,
      related: ["paystack-integration"], order: 7, packages: []
    },
    {
      id: "business-website", category_id: "convert", name: "Business Website + Complete Setup",
      short_description: "A full multi-page business website, built and configured end-to-end.",
      full_description: "SCARLS designs and builds a complete business website — multiple pages, brand-matched design, and technical setup.",
      who_for: "Established businesses that need a proper website, not just a landing page.",
      included: ["Multi-page design & build", "Mobile optimization", "Basic SEO setup", "Domain/hosting configuration guidance"],
      excluded: ["Domain/hosting costs", "Ongoing maintenance"],
      deliverables: ["Live, fully configured business website"], requirements: ["Brand assets, content, sitemap preferences"],
      pricing_model: "one_time", starting_price: 1000000, price_label: "₦1,000,000+",
      delivery_time: "3–6 weeks", featured: false, active: true, coming_soon: false,
      related: ["website-maintenance"], order: 8, packages: []
    },
    {
      id: "sales-website", category_id: "convert", name: "Sales Website",
      short_description: "A website built specifically around selling one core offer.",
      full_description: "SCARLS builds a sales-focused website structured entirely around converting visitors into customers for a specific offer.",
      who_for: "Businesses whose whole site should sell one thing well.",
      included: ["Design & build", "Persuasion-led structure", "Mobile optimization"], excluded: ["Copywriting unless separately purchased"],
      deliverables: ["Live sales website"], requirements: ["Offer details"],
      pricing_model: "one_time", starting_price: 300000, price_label: "₦300,000+",
      delivery_time: "2–4 weeks", featured: false, active: true, coming_soon: false, related: [], order: 9, packages: []
    },
    {
      id: "portfolio-website", category_id: "convert", name: "Portfolio Website",
      short_description: "A polished personal or brand portfolio site.",
      full_description: "SCARLS builds a portfolio website to showcase your work, brand and credibility.",
      who_for: "Freelancers, consultants, creators and personal brands.",
      included: ["Design & build", "Mobile optimization"], excluded: ["Content writing"],
      deliverables: ["Live portfolio website"], requirements: ["Work samples/content"],
      pricing_model: "one_time", starting_price: 70000, price_label: "₦70,000",
      delivery_time: "1–2 weeks", featured: false, active: true, coming_soon: false, related: [], order: 10, packages: []
    },
    {
      id: "course-academy-website", category_id: "convert", name: "Course / Academy Website",
      short_description: "A full website for hosting and selling an online course or academy.",
      full_description: "SCARLS builds a dedicated academy-style website for hosting, presenting and selling your course or program.",
      who_for: "Educators and course creators building a standalone academy site.",
      included: ["Design & build", "Course/sales structure", "Mobile optimization"], excluded: ["Course hosting platform fees"],
      deliverables: ["Live academy website"], requirements: ["Course structure & content"],
      pricing_model: "one_time", starting_price: 500000, price_label: "₦500,000+",
      delivery_time: "3–5 weeks", featured: false, active: true, coming_soon: false,
      related: ["scarls-class-hosting"], order: 11, packages: []
    },
    {
      id: "service-booking-website", category_id: "convert", name: "Service Booking Website",
      short_description: "A website that lets customers book and pay for your services online.",
      full_description: "SCARLS builds a website with built-in booking and payment so customers can schedule and pay for your services directly.",
      who_for: "Service-based businesses that take appointments or bookings.",
      included: ["Design & build", "Booking flow", "Payment integration"], excluded: ["Payment provider fees"],
      deliverables: ["Live booking website"], requirements: ["Service list, pricing, availability rules"],
      pricing_model: "one_time", starting_price: 250000, price_label: "₦250,000+",
      delivery_time: "2–4 weeks", featured: false, active: true, coming_soon: false, related: [], order: 12, packages: []
    },
    {
      id: "custom-web-application", category_id: "convert", name: "Custom Web Application",
      short_description: "A bespoke web application built around your specific business logic.",
      full_description: "SCARLS scopes and builds a custom web application when an off-the-shelf site or funnel isn't enough.",
      who_for: "Businesses with a specific workflow, product or system to build.",
      included: ["Discovery & scoping", "Design & build", "Testing"], excluded: ["Hosting/infrastructure costs"],
      deliverables: ["Working custom application"], requirements: ["Detailed requirements (assessed during scoping)"],
      pricing_model: "one_time", starting_price: 1000000, price_label: "₦1,000,000+",
      delivery_time: "Scoped per project", featured: false, active: true, coming_soon: false, related: [], order: 13, packages: []
    },
    {
      id: "website-maintenance", category_id: "convert", name: "Website Maintenance",
      short_description: "Ongoing updates, monitoring and support for an existing website.",
      full_description: "SCARLS keeps your website updated, monitored and running smoothly on an ongoing basis.",
      who_for: "Businesses with a live website who don't want to manage it themselves.",
      included: ["Uptime monitoring", "Content updates", "Minor fixes"], excluded: ["Major redesigns or new features"],
      deliverables: ["Monthly maintenance report"], requirements: ["Access to existing site"],
      pricing_model: "subscription", starting_price: 500000, price_label: "₦500,000+/mo",
      delivery_time: "Ongoing, monthly", featured: false, active: true, coming_soon: false, related: [], order: 14, packages: []
    },

    /* ============================== CREATE ============================== */
    {
      id: "vsl-production", category_id: "create", name: "VSL Production",
      short_description: "Scripting, filming guidance, or editing of your video sales letter.",
      full_description: "SCARLS handles the creation and/or editing of your video sales letter so your offer is presented persuasively on video.",
      who_for: "Businesses selling through video before asking for the purchase.",
      included: ["Structure/script guidance", "Editing", "Captions & basic graphics"], excluded: ["Filming equipment/studio costs"],
      deliverables: ["Finished VSL video file"], requirements: ["Raw footage or script, depending on package"],
      pricing_model: "one_time", starting_price: 30000, price_label: "From ₦30,000",
      delivery_time: "3–7 business days depending on package", featured: false, active: true, coming_soon: false,
      related: ["vsl-funnel", "vsl-script"], order: 1,
      packages: [
        { id: "vsl-creation", name: "Creation", price: 30000, price_label: "₦30,000", description: "Scripting and structure for a VSL you'll film or voice yourself.", features: ["Script/structure", "Talking points"], delivery_time: "3–5 business days", recommended: false, active: true },
        { id: "vsl-editing", name: "Editing", price: 30000, price_label: "₦30,000", description: "Editing of footage you already have.", features: ["Edit", "Captions", "Basic graphics"], delivery_time: "3–5 business days", recommended: false, active: true },
        { id: "vsl-creation-editing", name: "Creation + Editing", price: 50000, price_label: "₦50,000", description: "Full script through to finished, edited video.", features: ["Script/structure", "Edit", "Captions", "Basic graphics"], delivery_time: "5–7 business days", recommended: true, active: true }
      ]
    },
    {
      id: "sales-video-editing", category_id: "create", name: "Sales Video Editing",
      short_description: "Editing for sales videos not tied to a full VSL package.",
      full_description: "SCARLS edits your existing sales video footage into a polished, publish-ready video.",
      who_for: "Businesses with raw footage that needs professional editing.",
      included: ["Edit", "Captions", "Basic color/audio cleanup"], excluded: ["Scripting"],
      deliverables: ["Finished edited video"], requirements: ["Raw footage"],
      pricing_model: "one_time", starting_price: 25000, price_label: "₦25,000",
      delivery_time: "3–5 business days", featured: false, active: true, coming_soon: false, related: ["vsl-production"], order: 2, packages: []
    },
    {
      id: "short-form-video-editing", category_id: "create", name: "Short-Form Video Editing",
      short_description: "Editing for Reels, TikToks and short-form social video.",
      full_description: "SCARLS edits short-form video content for social platforms — captions, pacing and hooks included.",
      who_for: "Creators and brands publishing regular short-form content.",
      included: ["Edit", "Captions", "Hook/pacing optimization"], excluded: ["Filming"],
      deliverables: ["Finished short-form video(s)"], requirements: ["Raw footage"],
      pricing_model: "one_time", starting_price: 20000, price_label: "₦20,000",
      delivery_time: "2–4 business days", featured: false, active: true, coming_soon: false, related: [], order: 3, packages: []
    },
    {
      id: "reels-editing", category_id: "create", name: "Reels / Shorts Editing (Monthly)",
      short_description: "A recurring batch of short-form edits delivered monthly.",
      full_description: "A monthly short-form editing package for creators and brands who publish consistently. Details available soon.",
      who_for: "Brands and creators needing ongoing short-form content.",
      included: [], excluded: [], deliverables: [], requirements: [],
      pricing_model: "subscription", starting_price: null, price_label: "Coming Soon",
      delivery_time: "—", featured: false, active: true, coming_soon: true, related: [], order: 4, packages: []
    },
    {
      id: "ad-creative-design", category_id: "create", name: "Ad Creative Design",
      short_description: "Static or carousel ad creatives ready to run.",
      full_description: "SCARLS designs ad creatives built to stop the scroll and support your campaign's message.",
      who_for: "Businesses running paid ads that need scroll-stopping creative.",
      included: ["Design", "Brand-matched templates", "Export in ad-ready formats"], excluded: ["Copywriting unless separately purchased"],
      deliverables: ["Ad creative files"], requirements: ["Brand assets, offer details"],
      pricing_model: "one_time", starting_price: 35000, price_label: "₦35,000–₦40,000",
      delivery_time: "3–5 business days", featured: false, active: true, coming_soon: false, related: ["ad-creative-strategy"], order: 5, packages: []
    },
    {
      id: "social-media-creative-design", category_id: "create", name: "Social Media Creative Design",
      short_description: "A batch of on-brand social media post designs.",
      full_description: "SCARLS designs a set of social media graphics matched to your brand for organic posting.",
      who_for: "Brands maintaining an active social media presence.",
      included: ["Design", "Brand-matched templates"], excluded: ["Copywriting", "Scheduling/posting"],
      deliverables: ["Social media graphic files"], requirements: ["Brand assets"],
      pricing_model: "one_time", starting_price: 40000, price_label: "₦40,000",
      delivery_time: "5–7 business days", featured: false, active: true, coming_soon: false, related: [], order: 6, packages: []
    },
    {
      id: "marketing-flyer-design", category_id: "create", name: "Marketing Flyer Design",
      short_description: "A single, polished promotional flyer.",
      full_description: "SCARLS designs a marketing flyer for an event, promotion or offer.",
      who_for: "Businesses promoting a specific event or offer.",
      included: ["Design", "Print & digital formats"], excluded: ["Printing costs"],
      deliverables: ["Flyer design file(s)"], requirements: ["Event/offer details, brand assets"],
      pricing_model: "one_time", starting_price: 30000, price_label: "₦30,000",
      delivery_time: "2–4 business days", featured: false, active: true, coming_soon: false, related: [], order: 7, packages: []
    },
    {
      id: "presentation-design", category_id: "create", name: "Presentation / Slide Deck Design",
      short_description: "A designed slide deck for a pitch, webinar or training.",
      full_description: "SCARLS designs a professional slide deck matched to your brand for pitches, webinars or training sessions.",
      who_for: "Anyone presenting to investors, clients or an audience.",
      included: ["Slide design", "Brand-matched templates"], excluded: ["Content writing unless separately purchased"],
      deliverables: ["Finished slide deck file"], requirements: ["Draft content or outline"],
      pricing_model: "one_time", starting_price: 20000, price_label: "₦20,000",
      delivery_time: "3–5 business days", featured: false, active: true, coming_soon: false, related: ["webinar-setup"], order: 8, packages: []
    },
    {
      id: "lead-magnet-design", category_id: "create", name: "Lead Magnet Design",
      short_description: "A designed opt-in asset used to capture leads.",
      full_description: "SCARLS designs a lead magnet (checklist, guide, template) that gives people a reason to opt in.",
      who_for: "Businesses running lead generation campaigns.",
      included: ["Design", "PDF export"], excluded: ["Copywriting unless separately purchased"],
      deliverables: ["Finished lead magnet file"], requirements: ["Content/outline"],
      pricing_model: "one_time", starting_price: 15000, price_label: "₦15,000",
      delivery_time: "3–5 business days", featured: false, active: true, coming_soon: false, related: ["lead-generation-funnel"], order: 9, packages: []
    },
    {
      id: "ebook-pdf-design", category_id: "create", name: "eBook / PDF Design",
      short_description: "A fully designed eBook or long-form PDF.",
      full_description: "SCARLS designs a polished eBook or PDF document from your existing content.",
      who_for: "Businesses turning written content into a sellable or shareable asset.",
      included: ["Layout & design", "Cover design"], excluded: ["Writing the content"],
      deliverables: ["Finished PDF file"], requirements: ["Written content"],
      pricing_model: "one_time", starting_price: 15000, price_label: "₦15,000",
      delivery_time: "4–6 business days", featured: false, active: true, coming_soon: false, related: [], order: 10, packages: []
    },
    {
      id: "creative-direction", category_id: "create", name: "Creative Direction",
      short_description: "Overall creative direction across a campaign or brand.",
      full_description: "SCARLS provides creative direction to keep your visuals, video and messaging consistent across a campaign or brand.",
      who_for: "Brands running multiple creative assets that need one coherent direction.",
      included: ["Creative brief", "Style guidance", "Review of produced assets"], excluded: ["Production of individual assets"],
      deliverables: ["Creative direction document"], requirements: ["Brand assets, campaign goals"],
      pricing_model: "one_time", starting_price: 20000, price_label: "₦20,000",
      delivery_time: "5–7 business days", featured: false, active: true, coming_soon: false, related: [], order: 11, packages: []
    },
    {
      id: "sales-copywriting", category_id: "create", name: "Sales Copywriting",
      short_description: "Persuasive copy for a sales page, offer or campaign.",
      full_description: "SCARLS writes sales copy built around your offer, audience and objections.",
      who_for: "Businesses that need their offer written persuasively.",
      included: ["Research", "First draft", "1 revision round"], excluded: ["Design/layout"],
      deliverables: ["Finished copy document"], requirements: ["Offer details, audience info"],
      pricing_model: "one_time", starting_price: 30000, price_label: "₦30,000",
      delivery_time: "4–6 business days", featured: false, active: true, coming_soon: false, related: ["sales-page"], order: 12, packages: []
    },
    {
      id: "landing-page-copy", category_id: "create", name: "Landing Page Copy", short_description: "Copywriting for a single landing page.",
      full_description: "SCARLS writes the copy for a landing page tied to a specific offer or campaign.",
      who_for: "Businesses building a landing page who need the words, not just the design.",
      included: ["First draft", "1 revision round"], excluded: ["Design/build"], deliverables: ["Finished copy document"], requirements: ["Offer details"],
      pricing_model: "one_time", starting_price: 7000, price_label: "₦7,000",
      delivery_time: "2–3 business days", featured: false, active: true, coming_soon: false, related: ["landing-page"], order: 13, packages: []
    },
    {
      id: "sales-page-copy", category_id: "create", name: "Sales Page Copy", short_description: "Copywriting for a long-form sales page.",
      full_description: "SCARLS writes the full copy for a sales page designed to move a reader toward purchase.",
      who_for: "Businesses that need persuasive long-form sales copy.",
      included: ["First draft", "1 revision round"], excluded: ["Design/build"], deliverables: ["Finished copy document"], requirements: ["Offer details"],
      pricing_model: "one_time", starting_price: 8000, price_label: "₦8,000",
      delivery_time: "3–5 business days", featured: false, active: true, coming_soon: false, related: ["sales-page"], order: 14, packages: []
    },
    {
      id: "vsl-script", category_id: "create", name: "VSL Script", short_description: "A written script for your video sales letter.",
      full_description: "SCARLS writes a VSL script structured to hold attention and lead into your offer.",
      who_for: "Businesses producing a VSL who need the script written first.",
      included: ["First draft", "1 revision round"], excluded: ["Filming/editing"], deliverables: ["Finished script document"], requirements: ["Offer details"],
      pricing_model: "one_time", starting_price: 15000, price_label: "₦15,000",
      delivery_time: "3–5 business days", featured: false, active: true, coming_soon: false, related: ["vsl-production"], order: 15, packages: []
    },
    {
      id: "webinar-script", category_id: "create", name: "Webinar Script", short_description: "A structured script/outline for your webinar presentation.",
      full_description: "SCARLS writes a webinar script or detailed outline structured to teach, build trust and present your offer.",
      who_for: "Educators and coaches selling through a webinar.",
      included: ["First draft", "1 revision round"], excluded: ["Slide design"], deliverables: ["Finished script/outline document"], requirements: ["Topic and offer details"],
      pricing_model: "one_time", starting_price: 17000, price_label: "₦17,000",
      delivery_time: "4–6 business days", featured: false, active: true, coming_soon: false, related: ["webinar-funnel"], order: 16, packages: []
    },
    {
      id: "ad-copy", category_id: "create", name: "Ad Copy", short_description: "Copywriting for your ad campaigns.",
      full_description: "SCARLS writes ad copy variations built around your offer and audience.",
      who_for: "Businesses running paid ads who need the words to match the creative.",
      included: ["Multiple copy variations", "1 revision round"], excluded: ["Creative design"], deliverables: ["Finished ad copy document"], requirements: ["Offer details"],
      pricing_model: "one_time", starting_price: 15000, price_label: "₦15,000",
      delivery_time: "2–4 business days", featured: false, active: true, coming_soon: false, related: ["ad-creative-design"], order: 17, packages: []
    },
    {
      id: "email-marketing-copy", category_id: "create", name: "Email Marketing Copy", short_description: "A sequence of marketing emails written for your business.",
      full_description: "SCARLS writes an email sequence built to nurture leads or promote an offer.",
      who_for: "Businesses with an email list they aren't using effectively.",
      included: ["Email sequence draft", "1 revision round"], excluded: ["Email platform setup"], deliverables: ["Finished email sequence document"], requirements: ["List context, offer details"],
      pricing_model: "one_time", starting_price: 25000, price_label: "₦25,000",
      delivery_time: "5–7 business days", featured: false, active: true, coming_soon: false, related: ["email-automation"], order: 18, packages: []
    },
    {
      id: "whatsapp-sales-copy", category_id: "create", name: "WhatsApp Sales Copy", short_description: "Written scripts for selling over WhatsApp.",
      full_description: "SCARLS writes WhatsApp messaging scripts for presenting offers and following up with leads.",
      who_for: "Businesses that sell primarily through WhatsApp or Telegram.",
      included: ["Message sequence draft", "1 revision round"], excluded: ["Automation setup"], deliverables: ["Finished script document"], requirements: ["Offer details"],
      pricing_model: "one_time", starting_price: 25000, price_label: "₦25,000",
      delivery_time: "4–6 business days", featured: false, active: true, coming_soon: false, related: ["whatsapp-automation", "scarls-class-hosting"], order: 19, packages: []
    },
    {
      id: "sales-funnel-copy", category_id: "create", name: "Sales Funnel Copy", short_description: "Copy for a complete multi-step sales funnel.",
      full_description: "SCARLS writes the copy across every step of a sales funnel so the messaging is consistent from click to purchase.",
      who_for: "Businesses building a full funnel who need copy for every step.",
      included: ["Copy for each funnel step", "1 revision round"], excluded: ["Design/build"], deliverables: ["Finished copy document"], requirements: ["Funnel structure, offer details"],
      pricing_model: "one_time", starting_price: 30000, price_label: "₦30,000",
      delivery_time: "6–8 business days", featured: false, active: true, coming_soon: false, related: ["lead-generation-funnel"], order: 20, packages: []
    },
    {
      id: "offer-copywriting", category_id: "create", name: "Offer Copywriting", short_description: "Copy to clearly explain and position your offer.",
      full_description: "SCARLS writes clear, persuasive copy explaining what your offer is, who it's for, and why it's worth buying.",
      who_for: "Businesses whose offer isn't clearly explained anywhere yet.",
      included: ["First draft", "1 revision round"], excluded: ["Page design"], deliverables: ["Finished offer copy document"], requirements: ["Offer details"],
      pricing_model: "one_time", starting_price: 15000, price_label: "₦15,000",
      delivery_time: "3–4 business days", featured: false, active: true, coming_soon: false, related: ["offer-strategy"], order: 21, packages: []
    },

    /* ============================= EDUCATE ============================= */
    {
      id: "scarls-class-hosting", category_id: "educate", name: "SCARLS Class Hosting & Sales",
      short_description: "Host, manage and monetize your WhatsApp or Telegram class.",
      full_description: "SCARLS helps educators, coaches, creators and digital entrepreneurs host, manage and monetize their WhatsApp or Telegram classes while helping turn participants into customers. Advertising is not included, but can be added.",
      who_for: "Educators, coaches, creators and digital entrepreneurs running paid classes.",
      included: ["WhatsApp/Telegram class setup", "Student onboarding", "Class structure & schedule", "Group management", "Sales messaging & offer presentation", "Follow-up & basic sales process"],
      excluded: ["Advertising / paid traffic (available separately as SCARLS Ads)", "Course content creation"],
      deliverables: ["Fully managed class group with a working sales process"], requirements: ["Class topic, schedule and offer"],
      pricing_model: "one_time", starting_price: 45000, price_label: "From ₦45,000 (excl. advertising)",
      delivery_time: "Scoped per class", featured: true, active: true, coming_soon: false,
      related: ["meta-ads-management", "whatsapp-sales-copy"], order: 1, packages: [],
      combo_note: "Add Meta Ads (SCARLS Ads) to bring qualified leads directly into your class."
    },
    {
      id: "webinar-setup", category_id: "educate", name: "Webinar Setup",
      short_description: "Technical setup of your webinar platform and flow.",
      full_description: "SCARLS sets up the technical side of your webinar — platform configuration, registration connection and run-of-show.",
      who_for: "Educators and coaches hosting a live webinar.",
      included: ["Platform setup", "Registration connection", "Run-of-show checklist"], excluded: ["Slide design", "Webinar platform subscription costs"],
      deliverables: ["Configured, ready-to-run webinar setup"], requirements: ["Chosen webinar platform, date, topic"],
      pricing_model: "one_time", starting_price: null, price_label: "Custom",
      delivery_time: "Scoped per project", featured: false, active: true, coming_soon: false, related: ["webinar-funnel", "presentation-design"], order: 2, packages: []
    },
    {
      id: "webinar-recording-editing", category_id: "educate", name: "Webinar Recording / Editing",
      short_description: "Editing of your recorded webinar for replay or repurposing.",
      full_description: "SCARLS edits your recorded webinar into a clean replay video, ready to reuse in your funnel or as content.",
      who_for: "Educators who want to reuse a live webinar recording.",
      included: ["Edit", "Captions", "Trimming/cleanup"], excluded: ["Live hosting/recording itself"],
      deliverables: ["Finished replay video"], requirements: ["Raw webinar recording"],
      pricing_model: "one_time", starting_price: 12000, price_label: "₦12,000+",
      delivery_time: "3–5 business days", featured: false, active: true, coming_soon: false, related: ["webinar-funnel"], order: 3, packages: []
    },

    /* ============================== TRACK ============================== */
    {
      id: "meta-pixel-setup", category_id: "track", name: "Meta Pixel Setup",
      short_description: "Correct installation of your Meta Pixel for ad tracking.",
      full_description: "SCARLS installs and verifies your Meta Pixel so your ad campaigns can track visitors and conversions accurately.",
      who_for: "Anyone running or about to run Meta ads.",
      included: ["Pixel installation", "Event verification"], excluded: ["Conversions API (available separately)"],
      deliverables: ["Verified, working Meta Pixel"], requirements: ["Website access"],
      pricing_model: "one_time", starting_price: 3000, price_label: "₦3,000",
      delivery_time: "1–2 business days", featured: false, active: true, coming_soon: false, related: ["meta-conversion-api"], order: 1, packages: []
    },
    {
      id: "meta-conversion-api", category_id: "track", name: "Meta Conversion API",
      short_description: "Server-side tracking setup for more reliable ad data.",
      full_description: "SCARLS sets up Meta's Conversion API to send server-side event data, improving tracking accuracy beyond the pixel alone.",
      who_for: "Advertisers seeing tracking gaps from browser-based tracking alone.",
      included: ["Conversion API setup", "Event matching verification"], excluded: ["Pixel installation (available separately)"],
      deliverables: ["Working server-side tracking connection"], requirements: ["Website/server access"],
      pricing_model: "one_time", starting_price: 7000, price_label: "₦7,000",
      delivery_time: "2–4 business days", featured: false, active: true, coming_soon: false, related: ["meta-pixel-setup"], order: 2, packages: []
    },
    {
      id: "google-analytics-setup", category_id: "track", name: "Google Analytics Setup",
      short_description: "Correct installation and configuration of Google Analytics.",
      full_description: "SCARLS installs and configures Google Analytics so you can see exactly how visitors use your site.",
      who_for: "Any business with a website that isn't tracking traffic properly.",
      included: ["Installation", "Goal/event configuration"], excluded: ["Ongoing reporting (available separately)"],
      deliverables: ["Working Google Analytics setup"], requirements: ["Website access"],
      pricing_model: "one_time", starting_price: 10000, price_label: "₦10,000",
      delivery_time: "1–3 business days", featured: false, active: true, coming_soon: false, related: ["google-tag-manager-setup"], order: 3, packages: []
    },
    {
      id: "google-tag-manager-setup", category_id: "track", name: "Google Tag Manager Setup",
      short_description: "Centralized tag management for all your tracking tools.",
      full_description: "SCARLS sets up Google Tag Manager so every tracking pixel and tag on your site is managed cleanly in one place.",
      who_for: "Businesses running multiple tracking tools that need centralizing.",
      included: ["Container setup", "Tag configuration"], excluded: ["Individual pixel/tag accounts"],
      deliverables: ["Working Tag Manager container"], requirements: ["Website access"],
      pricing_model: "one_time", starting_price: 10000, price_label: "₦10,000",
      delivery_time: "1–3 business days", featured: false, active: true, coming_soon: false, related: ["google-analytics-setup"], order: 4, packages: []
    },
    {
      id: "conversion-event-tracking", category_id: "track", name: "Conversion / Event Tracking",
      short_description: "Custom event tracking for the specific actions that matter to you.",
      full_description: "SCARLS sets up tracking for the specific conversion events that matter to your business — purchases, sign-ups, leads and more.",
      who_for: "Businesses that need to track specific actions beyond page views.",
      included: ["Event mapping", "Implementation", "Verification"], excluded: ["Platform subscription costs"],
      deliverables: ["Verified event tracking"], requirements: ["Website access, list of key actions"],
      pricing_model: "one_time", starting_price: 15000, price_label: "₦15,000",
      delivery_time: "2–5 business days", featured: false, active: true, coming_soon: false, related: [], order: 5, packages: []
    },
    {
      id: "facebook-domain-verification", category_id: "track", name: "Facebook Domain Verification",
      short_description: "Verification of your domain in Meta Business Manager.",
      full_description: "SCARLS verifies your domain with Meta so your pixel events and ad campaigns are trusted and prioritized correctly.",
      who_for: "Businesses advertising on Meta who haven't verified their domain.",
      included: ["DNS/meta-tag verification"], excluded: [], deliverables: ["Verified domain"], requirements: ["Website/DNS access"],
      pricing_model: "one_time", starting_price: 3000, price_label: "₦3,000",
      delivery_time: "1–2 business days", featured: false, active: true, coming_soon: false, related: ["meta-pixel-setup"], order: 6, packages: []
    },
    {
      id: "tracking-audit", category_id: "track", name: "Tracking Audit",
      short_description: "A full review of your existing tracking setup.",
      full_description: "SCARLS audits your existing tracking setup to find gaps, misfires and missing events.",
      who_for: "Businesses unsure whether their tracking data is accurate.",
      included: ["Full tracking review", "Written report with fixes"], excluded: ["Implementation of fixes (available separately)"],
      deliverables: ["Written tracking audit report"], requirements: ["Access to analytics/ad accounts"],
      pricing_model: "one_time", starting_price: 15000, price_label: "₦15,000",
      delivery_time: "3–5 business days", featured: false, active: true, coming_soon: false, related: [], order: 7, packages: []
    },
    {
      id: "analytics-dashboard", category_id: "track", name: "Analytics Dashboard",
      short_description: "A custom dashboard showing your key marketing numbers in one place.",
      full_description: "SCARLS builds a dashboard that pulls your key marketing and sales metrics into one view.",
      who_for: "Businesses tired of checking five different platforms for their numbers.",
      included: ["Dashboard build", "Key metric selection"], excluded: ["Data source subscription costs"],
      deliverables: ["Working analytics dashboard"], requirements: ["Access to data sources"],
      pricing_model: "one_time", starting_price: 30000, price_label: "₦30,000–₦100,000",
      delivery_time: "5–10 business days", featured: false, active: true, coming_soon: false, related: [], order: 8, packages: []
    },
    {
      id: "marketing-attribution-setup", category_id: "track", name: "Marketing Attribution Setup",
      short_description: "Understand which channels are actually driving your sales.",
      full_description: "SCARLS sets up attribution tracking so you can see which marketing channels are actually driving leads and sales.",
      who_for: "Businesses running multiple marketing channels at once.",
      included: ["Attribution model setup", "Reporting configuration"], excluded: ["Platform subscription costs"],
      deliverables: ["Working attribution setup"], requirements: ["Access to all marketing channels"],
      pricing_model: "one_time", starting_price: 50000, price_label: "₦50,000+",
      delivery_time: "5–10 business days", featured: false, active: true, coming_soon: false, related: ["analytics-dashboard"], order: 9, packages: []
    },

    /* ============================= AUTOMATE ============================= */
    {
      id: "whatsapp-automation", category_id: "automate", name: "WhatsApp Automation",
      short_description: "Automated WhatsApp replies and lead handling.",
      full_description: "SCARLS sets up automated WhatsApp flows to respond to leads and customers instantly, without manual work.",
      who_for: "Businesses handling leads and customers over WhatsApp.",
      included: ["Automation flow build", "Testing"], excluded: ["WhatsApp Business API costs where applicable"],
      deliverables: ["Working WhatsApp automation"], requirements: ["WhatsApp Business number"],
      pricing_model: "one_time", starting_price: 30000, price_label: "₦30,000+",
      delivery_time: "5–10 business days", featured: false, active: true, coming_soon: false, related: ["scarls-class-hosting"], order: 1, packages: []
    },
    {
      id: "email-automation", category_id: "automate", name: "Email Automation",
      short_description: "Automated email sequences triggered by customer behavior.",
      full_description: "SCARLS sets up automated email sequences that trigger based on what a lead or customer does.",
      who_for: "Businesses with an email list they want to nurture automatically.",
      included: ["Automation build", "Testing"], excluded: ["Email platform subscription costs"],
      deliverables: ["Working email automation"], requirements: ["Email platform account, email copy"],
      pricing_model: "one_time", starting_price: 30000, price_label: "₦30,000+",
      delivery_time: "5–10 business days", featured: false, active: true, coming_soon: false, related: ["email-marketing-copy"], order: 2, packages: []
    },
    {
      id: "lead-follow-up-automation", category_id: "automate", name: "Lead Follow-Up Automation",
      short_description: "Automatic follow-up so no lead falls through the cracks.",
      full_description: "SCARLS builds automated follow-up sequences so every lead gets a timely response without manual effort.",
      who_for: "Businesses losing leads to slow or missed follow-up.",
      included: ["Automation build", "Testing"], excluded: ["Platform subscription costs"],
      deliverables: ["Working follow-up automation"], requirements: ["Lead source, CRM/platform access"],
      pricing_model: "one_time", starting_price: 50000, price_label: "₦50,000+",
      delivery_time: "5–10 business days", featured: false, active: true, coming_soon: false, related: ["crm-setup"], order: 3, packages: []
    },
    {
      id: "crm-setup", category_id: "automate", name: "CRM Setup",
      short_description: "A configured CRM to manage your leads and customers.",
      full_description: "SCARLS sets up a CRM system to organize your leads, track their status and manage follow-up.",
      who_for: "Businesses managing leads through spreadsheets or memory.",
      included: ["CRM configuration", "Pipeline setup"], excluded: ["CRM subscription costs"],
      deliverables: ["Working CRM setup"], requirements: ["Chosen CRM platform, sales process details"],
      pricing_model: "one_time", starting_price: 50000, price_label: "₦50,000+",
      delivery_time: "5–10 business days", featured: false, active: true, coming_soon: false, related: ["lead-follow-up-automation"], order: 4, packages: []
    },
    {
      id: "form-whatsapp-integration", category_id: "automate", name: "Form → WhatsApp Integration",
      short_description: "New form submissions sent straight to your WhatsApp.",
      full_description: "SCARLS connects your website forms to WhatsApp so new leads reach you instantly.",
      who_for: "Businesses that want instant notification of new leads on WhatsApp.",
      included: ["Integration build", "Testing"], excluded: [], deliverables: ["Working form → WhatsApp connection"], requirements: ["Existing form, WhatsApp number"],
      pricing_model: "one_time", starting_price: 15000, price_label: "₦15,000",
      delivery_time: "2–4 business days", featured: false, active: true, coming_soon: false, related: ["whatsapp-automation"], order: 5, packages: []
    },
    {
      id: "paystack-integration", category_id: "automate", name: "Paystack Integration",
      short_description: "Paystack payment processing connected to your website.",
      full_description: "SCARLS integrates Paystack into your website so you can accept payments directly, with server-side verification.",
      who_for: "Businesses that want to accept payments on their own site.",
      included: ["Integration build", "Server-side verification", "Testing"], excluded: ["Paystack transaction fees"],
      deliverables: ["Working, verified Paystack integration"], requirements: ["Paystack account"],
      pricing_model: "one_time", starting_price: 20000, price_label: "₦20,000",
      delivery_time: "3–7 business days", featured: false, active: true, coming_soon: false, related: ["checkout-flow-setup"], order: 6, packages: []
    },
    {
      id: "api-integration", category_id: "automate", name: "API Integration",
      short_description: "Connecting two or more of your tools/platforms together.",
      full_description: "SCARLS builds custom integrations between the tools and platforms your business already uses.",
      who_for: "Businesses whose tools don't talk to each other yet.",
      included: ["Integration build", "Testing"], excluded: ["Third-party platform subscription costs"],
      deliverables: ["Working integration"], requirements: ["Access to relevant platforms/APIs"],
      pricing_model: "one_time", starting_price: 50000, price_label: "₦50,000+",
      delivery_time: "Scoped per project", featured: false, active: true, coming_soon: false, related: [], order: 7, packages: []
    },
    {
      id: "third-party-integration", category_id: "automate", name: "Third-Party Integration",
      short_description: "Connecting a specific third-party tool into your system.",
      full_description: "SCARLS integrates a specific third-party tool or service into your existing website or workflow.",
      who_for: "Businesses adding a new tool that needs to connect to what they already have.",
      included: ["Integration build", "Testing"], excluded: ["Third-party subscription costs"],
      deliverables: ["Working integration"], requirements: ["Access to the third-party tool"],
      pricing_model: "one_time", starting_price: 30000, price_label: "₦30,000+",
      delivery_time: "Scoped per project", featured: false, active: true, coming_soon: false, related: [], order: 8, packages: []
    },
    {
      id: "business-automation-system", category_id: "automate", name: "Business Automation System",
      short_description: "A full automation system connecting multiple parts of your business.",
      full_description: "SCARLS designs and builds a complete automation system connecting your leads, follow-up, sales and reporting.",
      who_for: "Businesses ready to remove manual work across their whole operation.",
      included: ["Discovery & mapping", "Multi-tool automation build", "Testing"], excluded: ["Platform subscription costs"],
      deliverables: ["Working end-to-end automation system"], requirements: ["Access to all relevant tools"],
      pricing_model: "one_time", starting_price: 100000, price_label: "₦100,000+",
      delivery_time: "Scoped per project", featured: false, active: true, coming_soon: false, related: ["crm-setup", "lead-follow-up-automation"], order: 9, packages: []
    },

    /* ============================ STRATEGIZE ============================ */
    {
      id: "marketing-strategy", category_id: "strategize", name: "Marketing Strategy",
      short_description: "A clear marketing plan built around your business and goals.",
      full_description: "SCARLS builds a marketing strategy covering channels, messaging and priorities based on your business and goals.",
      who_for: "Businesses without a clear marketing plan, or ready to revisit theirs.",
      included: ["Business & audience review", "Channel recommendations", "Written strategy document"], excluded: ["Implementation (available separately)"],
      deliverables: ["Written marketing strategy document"], requirements: ["Business overview, current numbers"],
      pricing_model: "one_time", starting_price: 50000, price_label: "₦50,000–₦100,000",
      delivery_time: "7–10 business days", featured: false, active: true, coming_soon: false, related: ["growth-strategy"], order: 1, packages: []
    },
    {
      id: "growth-strategy", category_id: "strategize", name: "Growth Strategy",
      short_description: "A prioritized plan for what to fix or build next to grow.",
      full_description: "SCARLS identifies your biggest growth bottleneck and builds a prioritized plan to address it.",
      who_for: "Businesses unsure what to focus on next.",
      included: ["Business review", "Bottleneck identification", "Written strategy document"], excluded: ["Implementation (available separately)"],
      deliverables: ["Written growth strategy document"], requirements: ["Business overview, current numbers"],
      pricing_model: "one_time", starting_price: 50000, price_label: "₦50,000–₦100,000",
      delivery_time: "7–10 business days", featured: true, active: true, coming_soon: false, related: ["scarls-growth-consultation"], order: 2, packages: []
    },
    {
      id: "content-strategy", category_id: "strategize", name: "Content Strategy",
      short_description: "A plan for what content to create and why.",
      full_description: "SCARLS builds a content strategy so your content creation has a clear purpose instead of posting randomly.",
      who_for: "Brands and creators publishing content without a clear plan.",
      included: ["Audience/content review", "Content pillars", "Written strategy document"], excluded: ["Content production (available separately)"],
      deliverables: ["Written content strategy document"], requirements: ["Brand overview, current content"],
      pricing_model: "one_time", starting_price: 70000, price_label: "₦70,000",
      delivery_time: "7–10 business days", featured: false, active: true, coming_soon: false, related: [], order: 3, packages: []
    },
    {
      id: "social-media-strategy", category_id: "strategize", name: "Social Media Strategy",
      short_description: "A plan for growing and monetizing your social presence.",
      full_description: "SCARLS builds a social media strategy covering platform focus, content direction and growth tactics.",
      who_for: "Brands and creators wanting a real plan for social media.",
      included: ["Platform review", "Strategy document"], excluded: ["Content production (available separately)"],
      deliverables: ["Written social strategy document"], requirements: ["Current social accounts"],
      pricing_model: "one_time", starting_price: 80000, price_label: "₦80,000",
      delivery_time: "7–10 business days", featured: false, active: true, coming_soon: false, related: [], order: 4, packages: []
    },
    {
      id: "lead-generation-strategy", category_id: "strategize", name: "Lead Generation Strategy",
      short_description: "A plan for generating more qualified leads.",
      full_description: "SCARLS builds a strategy focused specifically on increasing your qualified lead flow.",
      who_for: "Businesses that need more leads, not just more traffic.",
      included: ["Review", "Strategy document"], excluded: ["Implementation (available separately)"],
      deliverables: ["Written lead generation strategy document"], requirements: ["Current lead numbers and sources"],
      pricing_model: "one_time", starting_price: 50000, price_label: "₦50,000",
      delivery_time: "5–7 business days", featured: false, active: true, coming_soon: false, related: ["lead-generation-funnel"], order: 5, packages: []
    },
    {
      id: "customer-acquisition-strategy", category_id: "strategize", name: "Customer Acquisition Strategy",
      short_description: "A plan for turning leads into paying customers.",
      full_description: "SCARLS builds a strategy focused on converting the leads you already have into customers.",
      who_for: "Businesses with leads that aren't converting into sales.",
      included: ["Review", "Strategy document"], excluded: ["Implementation (available separately)"],
      deliverables: ["Written acquisition strategy document"], requirements: ["Current conversion numbers"],
      pricing_model: "one_time", starting_price: 50000, price_label: "₦50,000",
      delivery_time: "5–7 business days", featured: false, active: true, coming_soon: false, related: [], order: 6, packages: []
    },
    {
      id: "funnel-strategy", category_id: "strategize", name: "Funnel Strategy",
      short_description: "A plan for what your funnel should look like before it's built.",
      full_description: "SCARLS maps out the ideal funnel structure for your offer before any pages are built.",
      who_for: "Businesses about to build a funnel who want the strategy right first.",
      included: ["Funnel mapping", "Strategy document"], excluded: ["Funnel build (available separately)"],
      deliverables: ["Written funnel strategy document"], requirements: ["Offer details"],
      pricing_model: "one_time", starting_price: 20000, price_label: "₦20,000",
      delivery_time: "3–5 business days", featured: false, active: true, coming_soon: false, related: ["lead-generation-funnel", "webinar-funnel", "vsl-funnel"], order: 7, packages: []
    },
    {
      id: "offer-strategy", category_id: "strategize", name: "Offer Strategy",
      short_description: "Sharpening what you're actually selling and how it's positioned.",
      full_description: "SCARLS reviews and sharpens your offer so it's clearer, more compelling and easier to sell.",
      who_for: "Businesses whose offer feels unclear or underpriced/overpriced.",
      included: ["Offer review", "Recommendations document"], excluded: ["Copywriting (available separately)"],
      deliverables: ["Written offer strategy document"], requirements: ["Current offer details"],
      pricing_model: "one_time", starting_price: 7000, price_label: "₦7,000",
      delivery_time: "2–4 business days", featured: false, active: true, coming_soon: false, related: ["offer-copywriting"], order: 8, packages: []
    },
    {
      id: "sales-strategy", category_id: "strategize", name: "Sales Strategy",
      short_description: "A plan for how you actually close the sale.",
      full_description: "SCARLS builds a sales strategy covering how leads are qualified, presented to, and closed.",
      who_for: "Businesses with leads but no consistent sales process.",
      included: ["Sales process review", "Strategy document"], excluded: ["Implementation (available separately)"],
      deliverables: ["Written sales strategy document"], requirements: ["Current sales process details"],
      pricing_model: "one_time", starting_price: 35000, price_label: "₦35,000",
      delivery_time: "5–7 business days", featured: false, active: true, coming_soon: false, related: [], order: 9, packages: []
    },
    {
      id: "marketing-audit", category_id: "strategize", name: "Marketing Audit",
      short_description: "A full review of everything you're currently doing to market your business.",
      full_description: "SCARLS reviews your current marketing end to end and identifies what's working, what isn't, and what to fix.",
      who_for: "Businesses unsure what's actually working across their marketing.",
      included: ["Full marketing review", "Written report"], excluded: ["Implementation (available separately)"],
      deliverables: ["Written marketing audit report"], requirements: ["Access to relevant accounts/data"],
      pricing_model: "one_time", starting_price: 12000, price_label: "₦12,000",
      delivery_time: "4–6 business days", featured: false, active: true, coming_soon: false, related: [], order: 10, packages: []
    },
    {
      id: "scarls-growth-consultation", category_id: "strategize", name: "SCARLS Growth Consultation",
      short_description: "A guided consultation to identify your real growth bottleneck.",
      full_description: "SCARLS runs a guided consultation to understand your business and identify the real bottleneck standing in the way of growth.",
      who_for: "Businesses unsure where to start.",
      included: ["Guided consultation", "Summary of findings & recommendations"], excluded: ["Implementation (available separately)"],
      deliverables: ["Consultation summary document"], requirements: ["Business overview"],
      pricing_model: "one_time", starting_price: 20000, price_label: "₦20,000–₦50,000",
      delivery_time: "3–5 business days", featured: true, active: true, coming_soon: false, related: ["growth-strategy"], order: 11, packages: []
    },

    /* ============================== CUSTOM ============================== */
    {
      id: "make-an-offer", category_id: "custom", name: "Make an Offer",
      short_description: "Tell SCARLS what you're trying to build and propose your own budget.",
      full_description: "Don't see exactly what you need? Tell SCARLS what you're trying to build, your proposed budget and your timeline. We'll review your project and create a solution around your needs.",
      who_for: "Anyone with a project that doesn't fit neatly into a single service.",
      included: [], excluded: [], deliverables: ["A custom proposal built around your project"], requirements: ["Project details, proposed budget and timeline"],
      pricing_model: "custom", starting_price: null, price_label: "You propose the budget",
      delivery_time: "Reviewed within 2 business days", featured: true, active: true, coming_soon: false,
      related: [], order: 1, packages: [], is_offer_cta: true
    }
  ]
};
