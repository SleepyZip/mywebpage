export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    const css = `
      :root { --bg-page: #1b1e1b; --bg-panel: #263023; --text-main: #e1e4e1;
              --accent-green: #8ef79f; --border-color: #586d4e; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: monospace; background-color: var(--bg-page); color: var(--text-main); padding: 2rem; display: flex; justify-content: center; }
      .container { background-color: var(--bg-panel); border: 2px solid var(--border-color); padding: 2rem; width: 100%; max-width: 800px; box-shadow: 8px 8px 0px rgba(88, 109, 78, 0.3); }
      nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; border-bottom: 2px solid var(--border-color); padding-bottom: 1rem; }
      nav a { color: var(--accent-green); text-decoration: none; margin-right: 1rem; font-weight: bold; }
      nav a:hover { background: var(--accent-green); color: var(--bg-page); }
      .nav-icon { height: 2.6em; width: auto; display: block; }
      h1 { font-size: 2rem; margin-bottom: 1rem; text-transform: uppercase; font-weight: normal; }
      h2 { font-weight: normal; }
      h3 { margin-bottom: 0.5rem; }
      p { margin-bottom: 1.5rem; line-height: 1.6; }
      
      /* TWO-COLUMN BIO GRID STYLE */
      .intro-section { display: grid; grid-template-columns: 1fr 240px; gap: 2rem; align-items: start; }
      .bio-portrait-frame { border: 2px solid var(--border-color); background-color: rgba(0, 0, 0, 0.2); padding: 6px; box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.4); }
      .portrait-container { background: #000; overflow: hidden; display: flex; justify-content: center; align-items: center; }
      .portrait-container img { width: 100%; height: auto; display: block; }
      
      /* SECTION DIVIDER AND CONTACT BLOCKS */
      .section-divider { border: none; border-top: 2px dashed var(--border-color); margin: 2.5rem 0; width: 100%; }
      .contact-section h3 { font-size: 1.2rem; text-transform: uppercase; margin-bottom: 1rem; font-weight: normal; }
      
      /* CONTACT GRID ROW SPACING EXTENDED */
      .contact-grid { border: 1px solid var(--border-color); background-color: rgba(0, 0, 0, 0.1); padding: 1.25rem; display: flex; flex-direction: column; gap: 1.25rem; }
      .contact-item { display: flex; gap: 1rem; align-items: center; }
      .contact-item .label { color: var(--border-color); font-weight: bold; width: 85px; display: inline-block; }
      
      /* SCHEME COMPLIANT CONTACT LINKS WITH INLINE LOGO ALIGNMENT */
      .contact-link { color: var(--accent-green); text-decoration: none; font-weight: bold; padding: 2px 6px; display: inline-flex; align-items: center; gap: 6px; }
      .contact-link svg { fill: var(--accent-green); display: block; }
      .contact-link:hover { background: var(--accent-green); color: var(--bg-page); }
      .contact-link:hover svg { fill: var(--bg-page); }

      /* PROJECTS GALLERY & ENVIRONMENT FRAMES */
      .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
      .card { border: 1px solid var(--border-color); padding: 1rem; text-decoration: none; color: var(--text-main); display: block; transition: none; }
      .card:hover { border-color: var(--accent-green); background: rgba(142, 247, 159, 0.1); }
      .card img { width: 100%; height: 120px; object-fit: cover; border: 1px solid var(--border-color); margin-bottom: 1rem; }
      .live-environment { width: 100%; height: 600px; border: 2px solid var(--border-color); background: #000; margin-bottom: 1.5rem; }
      iframe { width: 100%; height: 100%; border: none; }
      .back-link { color: var(--accent-green); text-decoration: none; font-weight: bold; }
      .back-link:hover { background: var(--accent-green); color: var(--bg-page); }

      /* RESUME STRUCTURE STYLES */
      .resume-block { margin-bottom: 2rem; }
      .resume-section-title { font-size: 1.1rem; color: var(--accent-green); border-bottom: 1px solid var(--border-color); padding-bottom: 4px; margin-bottom: 1rem; text-transform: uppercase; }
      .resume-item { margin-bottom: 1.5rem; }
      .resume-header-row { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 4px; }
      .resume-sub { color: var(--accent-green); font-size: 0.9rem; margin-bottom: 6px; }
      .resume-list { list-style: none; padding-left: 12px; }
      .resume-list li { position: relative; margin-bottom: 6px; line-height: 1.5; }
      .resume-list li::before { content: ">"; position: absolute; left: -12px; color: var(--border-color); }
      .skills-group { display: flex; flex-wrap: wrap; gap: 0.5rem; }
      .skill-tag { border: 1px solid var(--border-color); padding: 4px 8px; background: rgba(0,0,0,0.1); font-size: 0.85rem; }

      /* MOBILE RESPONSIVE ADJUSTMENTS */
      @media (max-width: 680px) {
        .intro-section { grid-template-columns: 1fr; gap: 1.5rem; }
        .bio-portrait-frame { max-width: 240px; margin: 0 auto; }
        .contact-item { flex-direction: column; align-items: flex-start; gap: 0.25rem; }
        .resume-header-row { flex-direction: column; gap: 2px; }
      }
    `;

    let content = "";

    // ROUTING SYSTEM: Determines which content block to inject based on URL path
    if (path === "/projects") {
      
      // ==========================================
      // Project Gallery
      // ==========================================
      content = `
        <h1>Projects</h1>
        <div class="grid">
          <a href="/project/1" class="card">
            <img src="https://raw.githubusercontent.com/SleepyZip/mywebpage/refs/heads/main/Assets/Project%20thumbs/razer-deathadder-v3-split-key-cover.webp" alt="Sleepy's Mouse Diag">
            <h3>Sleepy's Mouse Diag</h3>
            <p>Interactive diagnostic utility.</p>
          </a>
          <a href="/project/2" class="card">
            <img src="https://raw.githubusercontent.com/SleepyZip/mywebpage/refs/heads/main/Assets/Project%20thumbs/HistorytoX.png" alt="Browser Activity Report">
            <h3>Browser Activity Report</h3>
            <p>SQLite forensics &amp; Excel reporting tool.</p>
          </a>
        </div>`;

    } else if (path === "/project/1") {
      
      // ==========================================
      // Project - Sleepy's Mouse Diag
      // ==========================================
      content = `
        <h1>Sleepy's Mouse Diag</h1>
        <p>A diagnostic tool for visualizing mouse input issues.</p>
        <div class="live-environment">
            <iframe src="https://sleepyzip.github.io/SleepyToolz/?v=11" title="Sleepy's Mouse Diag"></iframe>
        </div>
        <div class="description-block" style="margin-top: 2rem; border-top: 2px solid var(--border-color); padding-top: 1rem;">
            <h3 style="color: var(--accent-green);">> OVERVIEW</h3>
            <p>This utility was born out of necessity following recurring scroll-wheel inconsistencies with my Razer DeathAdder V3. <a href="https://fractalglider.github.io/fun/2018/02/13/testing-mouse-scroll-wheel.html" target="_blank" style="color: var(--accent-green);">Fractal Glider's scroll tester</a> established a strong proof-of-concept. It allows you to easily identify unintended scroll wheel skips/jumps due to faulty hardware. However, I identified a need for a more comprehensive diagnostic tool that provided similar telemetry across the entire mouse. I used Processing to recreate the tracer concept but added integrated duration timers and logic to detect double-click consistency. The tool was then rebuilt using Vanilla JavaScript (ES6) and HTML5 Canvas. By stripping away heavy dependency libraries, I reduced it from >5MB to under 10KB.</p>
            <h3 style="color: var(--accent-green); margin-top: 1.5rem;">> CONTROL_REFERENCE</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 1rem; border: 1px solid var(--border-color);">
                <thead>
                    <tr style="background-color: var(--border-color); color: var(--bg-page);">
                        <th style="padding: 0.5rem; text-align: left;">Input</th>
                        <th style="padding: 0.5rem; text-align: left;">Function</th>
                    </tr>
                </thead>
                <tbody style="font-family: monospace;">
                    <tr><td style="padding: 0.5rem; border-bottom: 1px solid var(--border-color);">Arrow Up / +</td><td style="padding: 0.5rem; border-bottom: 1px solid var(--border-color);">Increase Trail Persistence</td></tr>
                    <tr><td style="padding: 0.5rem; border-bottom: 1px solid var(--border-color);">Arrow Down / -</td><td style="padding: 0.5rem; border-bottom: 1px solid var(--border-color);">Decrease Trail Persistence</td></tr>
                    <tr><td style="padding: 0.5rem; border-bottom: 1px solid var(--border-color);">Arrow Left/Right</td><td style="padding: 0.5rem; border-bottom: 1px solid var(--border-color);">Adjust Tick Height</td></tr>
                </tbody>
            </table>
        </div>
        <a href="/projects" class="back-link" style="display: block; margin-top: 2rem;">← Back to Projects</a>`;

    } else if (path === "/project/2") {

      // ==========================================
      // Project - Browser Activity Report
      // ==========================================
      content = `
        <h1>Browser Activity Report</h1>
        <p>Turns Chrome/Edge SQLite history databases into categorized Excel reports.</p>
        <div class="description-block" style="margin-top: 1rem; border-top: 2px solid var(--border-color); padding-top: 1rem;">
            <h3 style="color: var(--accent-green);">> OVERVIEW</h3>
            <p>Chrome and Edge keep browsing history in a local SQLite database, but raw <code>History</code> files aren't something you can hand to anyone for review. This tool parses that database directly, runs each visit through a rule-driven categorizer (work tools, job searching, social media, shopping, and so on), and writes a formatted Excel workbook with a summary sheet, per-visit detail, downloads, and source-file hashes. There's a drag-and-drop GUI, a CLI, and optional PowerShell components for collecting history at scale via an RMM across a fleet of machines.</p>
            <p>Built for IT teams that occasionally need to review workstation activity as part of an authorized investigation &mdash; so the design leans on that constraint rather than treating it as an afterthought. The tool ships with a written appropriate-use policy, supports collecting from specific users instead of sweeping every profile, and treats every output file as confidential by default.</p>
            <h3 style="color: var(--accent-green); margin-top: 1.5rem;">> REPORT_CONTENTS</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 1rem; border: 1px solid var(--border-color);">
                <thead>
                    <tr style="background-color: var(--border-color); color: var(--bg-page);">
                        <th style="padding: 0.5rem; text-align: left;">Sheet</th>
                        <th style="padding: 0.5rem; text-align: left;">Contents</th>
                    </tr>
                </thead>
                <tbody style="font-family: monospace;">
                    <tr><td style="padding: 0.5rem; border-bottom: 1px solid var(--border-color);">Summary</td><td style="padding: 0.5rem; border-bottom: 1px solid var(--border-color);">Per-user visit counts by category</td></tr>
                    <tr><td style="padding: 0.5rem; border-bottom: 1px solid var(--border-color);">Visit Detail</td><td style="padding: 0.5rem; border-bottom: 1px solid var(--border-color);">Timestamped, filterable by date/PC/category</td></tr>
                    <tr><td style="padding: 0.5rem; border-bottom: 1px solid var(--border-color);">Downloads</td><td style="padding: 0.5rem; border-bottom: 1px solid var(--border-color);">Files downloaded per session</td></tr>
                    <tr><td style="padding: 0.5rem; border-bottom: 1px solid var(--border-color);">Uncategorized Domains</td><td style="padding: 0.5rem; border-bottom: 1px solid var(--border-color);">Domains with no rule match, for tuning</td></tr>
                </tbody>
            </table>
            <h3 style="color: var(--accent-green); margin-top: 1.5rem;">> STACK</h3>
            <div class="skills-group">
              <div class="skill-tag">Python</div>
              <div class="skill-tag">SQLite parsing</div>
              <div class="skill-tag">openpyxl</div>
              <div class="skill-tag">Tkinter GUI</div>
              <div class="skill-tag">PowerShell / RMM collection</div>
            </div>
            <p style="margin-top: 1.5rem;"><a href="https://github.com/SleepyZip/SleepyToolz/tree/main/browser-activity-report" target="_blank" class="contact-link" style="padding-left:0;">Source on GitHub &rarr;</a></p>
        </div>
        <a href="/projects" class="back-link" style="display: block; margin-top: 2rem;">← Back to Projects</a>`;

    } else if (path === "/resume") {

// ==========================================
// RESUME PAGE
// ==========================================
      content = `
        <h1>Resume</h1>
        <p>Technical track, system profiles, and core competencies.</p>
        <p style="margin-bottom: 2rem;">
          <a href="https://raw.githubusercontent.com/SleepyZip/mywebpage/refs/heads/main/Assets/Resume/TrevorDeMelo_Resume.pdf" download="TrevorDeMelo_Resume.pdf" class="contact-link" style="padding-left:0;">Download Resume (PDF) &darr;</a>
        </p>

        <div class="resume-block">
          <div class="resume-section-title">Core Competencies</div>
          <div class="skills-group">
            <div class="skill-tag">Network Administration</div>
            <div class="skill-tag">Information Systems Infrastructure</div>
            <div class="skill-tag">Systems Diagnostics</div>
            <div class="skill-tag">Vanilla JavaScript (ES6)</div>
            <div class="skill-tag">HTML5 Canvas Rendering</div>
            <div class="skill-tag">Database Environments</div>
            <div class="skill-tag">Windows / OS X System Optimization</div>
            <div class="skill-tag">Cloudflare Workers Deployment</div>
          </div>
        </div>

        <div class="resume-block">
          <div class="resume-section-title">Professional Experience</div>
          
          <div class="resume-item">
            <div class="resume-header-row">
              <div>Digital Network Solutions, LLC</div>
              <div>2022 - Present</div>
            </div>
            <div class="resume-sub">Tier 1 & Tier 2 Systems Support</div>
            <ul class="resume-list">
              <li>Providing comprehensive Tier 1 and Tier 2 technical infrastructure support across diverse, high-availability operational environments.</li>
              <li>Specializing in physical layer deployments and robust network management with a heavy focus on critical medical sector installations.</li>
            </ul>
          </div>

      <div class="resume-block">
          <div class="resume-section-title">Technical Education & Certifications</div>
          <div class="resume-item">
            <div class="resume-header-row">
              <div>Mississippi Gulf Coast Community College</div>
              <div>Aug 2013 - Dec 2016</div>
            </div>
            <div class="resume-sub">Computer Networking Technology</div>
          </div>

          <div class="resume-item">
            <div class="resume-header-row">
              <div>CompTIA A+, Net+ Certifications</div>
                <div>Certified</div>
                </div>
              </div>
          <div class="resume-item">
            <div class="resume-header-row">
              <div>Cisco Certified Network Associate (CCNA)</div>
              <div>In Progress</div>
            </div>
          </div>

            </div>
          </div>
        </div>
      `;

    } else {
      
      // ==========================================
      // HOME PAGE
      // ==========================================
      content = `
        <div class="intro-section">
          <div class="bio-text">
            <h2>Trevor DeMelo</h2>
            <p>
              Fascinated by computing from an early age, I spent hours in the environments of Windows and OS X, animating Flash cartoons and building my first websites from scratch. Now I provide Tier 1 and Tier 2 technical support across high-availability environments and medical-sector installations.
            </p>
            <p style="margin-top: 16px;">
              <a href="/projects" class="contact-link" style="padding-left:0;">View My Work &rarr;</a>
            </p>
          </div>
          <div class="bio-portrait-frame">
            <div class="portrait-container">
              <img src="https://github.com/SleepyZip/mywebpage/blob/main/Assets/Images/AboutMe.png?raw=true" alt="Trevor DeMelo Self-portrait Sketch">
            </div>
          </div>
        </div>

        <hr class="section-divider">

        <div class="contact-section">
          <h3>Contact</h3>
          <div class="contact-grid">
            <div class="contact-item">
              <span class="label">EMAIL:</span>
              <a href="mailto:Contact@TrevorDeMelo.com" class="contact-link">Contact@TrevorDeMelo.com</a>
            </div>
            <div class="contact-item">
              <span class="label">LINKS:</span>
              <a href="https://www.linkedin.com/in/trevor-demelo-33207595/" target="_blank" class="contact-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                LinkedIN
              </a>
            </div>
          </div>
        </div>
      `;
        
    }

    // Assemble the complete HTML document using the layout frame
    return new Response(`<!DOCTYPE html><html><head><title>Trevor DeMelo | Portfolio</title><link rel="icon" type="image/png" href="https://raw.githubusercontent.com/SleepyZip/mywebpage/refs/heads/main/Assets/Images/NOZfaviconduck.png"><meta name="description" content="Trevor DeMelo &mdash; IT professional. Network administration, systems diagnostics, and Cloudflare Workers projects."><meta property="og:title" content="Trevor DeMelo | Portfolio"><meta property="og:description" content="IT professional. Network administration, systems diagnostics, and Cloudflare Workers projects."><meta property="og:type" content="website"><meta property="og:url" content="https://trevordemelo.com"><meta property="og:image" content="https://github.com/SleepyZip/mywebpage/blob/main/Assets/Images/AboutMe.png?raw=true"><style>${css}</style></head><body>
      <div class="container">
        <nav>
          <div>
            <a href="/">HOME</a>
            <a href="/projects">PROJECTS</a>
            <a href="/resume">RESUME</a>
          </div>
          <img src="https://raw.githubusercontent.com/SleepyZip/mywebpage/refs/heads/main/Assets/Images/NOZfaviconduck.png" alt="Sleepy duck" class="nav-icon">
        </nav>
        ${content}
      </div>
    </body></html>`, { headers: { 'content-type': 'text/html;charset=UTF-8' } });
  }
};