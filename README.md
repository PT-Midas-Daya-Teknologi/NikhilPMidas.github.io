# Midas Corporate Website

A modern, high-performance corporate website for **PT Midas Daya Teknologi**, showcasing enterprise financial technology solutions, banking platforms, and industry perspectives.

Built on a lightweight, zero-overhead static multi-page architecture powered by **HTML5**, **SCSS**, **Bootstrap**, and **Gulp**, delivering sub-second page loads and seamless responsive design across desktop and mobile devices.

---

## 🌟 Key Highlights & Modern Design System

- **Corporate Enterprise Aesthetic**: Styled with Midas design tokens—Corporate Navy (`#28496B`), Primary Blue (`#0D7DFC`), Warm Orange (`#FF9360`), and crisp light surfaces (`#F8FAFD`, `#FFFFFF`).
- **Interactive Dual-Arrow CTAs**: Signature directional animation where resting arrows fly out to the top-right (`translate(100%, -100%)`) and incoming arrows slide in from the bottom-left (`translate(0, 0)`), paired with animated expanding underlines (`.cta_underline`) and pill buttons (`.cta_bg`).
- **Full-Width 2-Column Capability Accordions**: 100% edge-to-edge section grids featuring a contextual overview on the left and interactive capability accordions with smooth `+`/`−` animated toggles on the right.
- **Related Resource / Recent Posts Cards**: High-converting standalone `.whiteCard` layout replacing cramped legacy thumbnails in blog sidebars, featuring category tags, bold typography, hover elevation (`translateY(-4px)`), and integrated dual-arrow swap.
- **Touch & Draggable Product Insights Slider**: Horizontal touch-enabled and mouse-draggable carousel with dynamic progress indicator and custom navigation controls.
- **Shared AI Agent Skill Package**: Includes [`.agents/skills/corporate-website-development`](./.agents/skills/corporate-website-development) so team members using Antigravity (AGY) agents automatically inherit all component patterns, animation physics, and workflow recipes.

---

## 📁 Repository Structure

```text
Wowoni_Corporate_Website/
├── assets/
│   ├── css/
│   │   └── main.css                        # Consolidated single stylesheet for all pages
│   ├── images/
│   │   ├── background/                     # Feature hero backgrounds
│   │   ├── banner/                         # Product & service banners
│   │   ├── service/                        # Service diagrams & icons
│   │   └── clients/                        # Partner & client logos
│   └── js/
│       ├── script.js                       # Main site logic & component loader
│       ├── wowoni-home-service-reveal.js   # Home page interactions
│       ├── digital-transformation.js       # Digital transformation interactions
│       ├── elite-it-resources.js           # Elite IT resources interactions
│       └── career.js                       # Careers interactions
├── component/                              # Reusable HTML components (loaded via data-wowoni-include)
│   ├── header.html                         # Desktop navigation & branding (all services mapped)
│   ├── mobile-menu.html                    # Mobile slide-out drawer
│   ├── footer.html                         # Corporate footer
│   ├── css-links.html                      # Unified stylesheet includes
│   ├── preloader.html                      # Brand preloader animation
│   └── scroll-to-top.html                  # Back to top button
├── about/                                  # About Us feature
│   └── about.html
├── services/                               # Core Services feature
│   ├── service.html                        # Services overview & catalog
│   ├── core-banking-transformation.html    # Core Banking Transformation
│   ├── digital-transformation.html         # Digital Transformation
│   ├── application-development.html        # Application Development
│   ├── application-and-infrastructure-management.html # App & Infra Management
│   ├── elite-it-resources.html             # Elite IT Resources
│   └── testing-services.html               # Testing Services
├── career/                                 # Careers feature
│   ├── career.html                         # Life at Wowoni
│   └── open-positions.html                 # Job listings & recruitment
├── contact/                                # Contact feature
│   └── contact.html                        # Interactive global map & inquiries
├── index.html                              # Main Homepage
├── sendemail.php                           # Contact form mail handler
└── README.md                               # Project documentation
```

---

## 🚀 Quick Start & Development

### 1. Prerequisites
- **Node.js** (v18.x or later recommended)
- **npm** (v9.x or later)
- **PHP** (optional, for testing the local contact form handler)

### 2. Installation
Clone the repository and install dev dependencies:
```bash
git clone <repository-url>
cd Midas_Corporate_Website
npm install
```

### 3. Local Development with LiveReload
Start the local development server with BrowserSync, SCSS watching, and automatic HTML compilation:
```bash
npm run dev
```

### 4. Production Build
Compile SCSS, minify CSS, process HTML partials (`@@include`), and bundle static assets into `dist/`:
```bash
npm run build
```

### 5. Testing PHP Forms Locally
To test contact form submissions (`sendemail.php`) with the compiled output:
```bash
php -S localhost:8000 -t dist
```
Then visit `http://localhost:8000` in your browser.

---

## 🎨 Component Usage Guide

### 1. Dual-Arrow Underline CTA
```html
<a href="/target-page.html" class="cta cta_underline">
  Read more
  <img loading="lazy" class="arrow arrow_default" src="/assets/images/cta-arrow.svg" alt="Default Arrow" />
  <img loading="lazy" class="arrow arrow_hover" src="/assets/images/cta-arrow.svg" alt="Hover Arrow" />
</a>
```

### 2. Dual-Arrow Pill Button CTA
```html
<a href="/target-page.html" class="cta cta_bg">
  Explore All Solutions
  <img loading="lazy" class="arrow arrow_default" src="/assets/images/cta-arrow.svg" alt="Default Arrow" />
  <img loading="lazy" class="arrow arrow_hover" src="/assets/images/cta-arrow.svg" alt="Hover Arrow" />
</a>
```

### 3. Related Resource / Recent Posts Sidebar Cards
```html
<div class="related_resource">
  <h4>Recent Posts</h4>
  <a href="/blog/target-article.html" class="whiteCard cta-card-hover">
    <p class="fnt_14">Digital Banking</p>
    <h5>Headline of the Article Goes Here</h5>
    <div class="cta cta_underline">
      Read more
      <img loading="lazy" class="arrow arrow_default" src="/assets/images/cta-arrow.svg" alt="Default Arrow" />
      <img loading="lazy" class="arrow arrow_hover" src="/assets/images/cta-arrow.svg" alt="Hover Arrow" />
    </div>
  </a>
</div>
```

---

## 🤖 Antigravity (AGY) Agent Integration

This repository includes a pre-configured AI pair-programming skill located in:
[`.agents/skills/corporate-website-development/`](./.agents/skills/corporate-website-development/)

When any team member uses an **Antigravity (AGY)** agent in this workspace, the agent automatically detects this skill and uses it to:
- Build new pages adhering to Midas corporate branding tokens.
- Apply the dual-arrow swap motion physics without CSS transform conflicts.
- Implement full-width capability accordions and related resource cards.
- Follow the Gulp multi-page build pipeline and avoid template branding leaks.

---

## 📊 Performance & Auditing

Run automated Lighthouse and performance audit scripts:
```bash
# Run local performance audit
npm run audit:perf

# Run PageSpeed Insights audit
npm run audit:psi

# Clean generated audit reports
npm run audit:clean
```

---

## 🛡️ Brand & Quality Guidelines

1. **Brand Integrity**: All new pages, metadata, alt attributes, and CSS comments must align with **Midas** (`PT Midas Daya Teknologi`). Ensure no legacy third-party template strings remain.
2. **Responsive Standards**: All components must be tested across mobile (360px), tablet (768px), laptop (1024px), and desktop (1440px+).
3. **Asset Optimization**: Use WebP format for all banner and news imagery, and SVG for UI icons and directional arrows.
4. **Build Verification**: Always verify that `npm run build` exits cleanly before committing or opening pull requests.

---

## 📄 License
Copyright © PT Midas Daya Teknologi. All rights reserved.