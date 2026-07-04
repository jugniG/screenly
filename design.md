================================================================================
                      SCREENLY LANDING PAGE DESIGN SPECIFICATION
================================================================================
Author: Senior Design Engineer
Status: Ready for Development
Target Brand Theme: Cyberpunk Minimalism / Dark Tech Premium
File Format: Raw Plain Text (No Markdown Syntax)
================================================================================

1. BRAND SYSTEM & DESIGN TOKENS
--------------------------------------------------------------------------------
To match the Screenly mobile app experience, the landing page uses a premium 
dark-tech theme. The interface relies on glow effects, glassmorphism, and high-
contrast orange accents to direct user focus to actionable elements.

[ COLORS ]
• Primary Dark BG       : #0E0F11 (Deep Charcoal / Pure Black Base)
• Card / Section BG     : #17181C (Elevated slate for component containers)
• Border / Stroke Color : #26272E (Subtle dark gray border)
• Primary Accent Orange : #F97316 (Vibrant Brand Orange - used for highlights, 
                          active buttons, and glow effects)
• Accent Orange Soft    : rgba(249, 115, 22, 0.15) (Translucent orange for glows)
• Success Emerald       : #10B981 (For active lock status and successful confirmations)
• Neutral White Text    : #F3F4F6 (High contrast off-white for body/headings)
• Neutral Gray Subtext  : #9CA3AF (Muted gray for secondary information)

[ TYPOGRAPHY & FONT HIERARCHY ]
• Header Font Family    : "Outfit" (Google Fonts) - Geometric, clean, tech-forward.
• Body Font Family      : "Inter" (Google Fonts) - Clean, highly readable neo-grotesque.

• Title Hero H1         : 64px | Line-Height: 1.15 | Font-Weight: 800 (Bold)
• Section H2            : 40px | Line-Height: 1.25 | Font-Weight: 700 (Semi-Bold)
• Component Header H3   : 24px | Line-Height: 1.30 | Font-Weight: 600
• Primary Copy (Body)   : 16px | Line-Height: 1.60 | Font-Weight: 400
• Secondary Copy        : 14px | Line-Height: 1.50 | Font-Weight: 400
• Buttons / Badges      : 14px | Line-Height: 1.00 | Font-Weight: 600 (Caps)

[ LAYOUT GRID ]
• Width                 : Max 1200px container width
• Columns               : 12-Column Desktop Grid | 1-Column Mobile Stack
• Gutter                : 32px grid-gap
• Padding               : Desktop: 80px Vertical / Mobile: 40px Vertical


2. COMPONENT-BY-COMPONENT SPECIFICATIONS
--------------------------------------------------------------------------------

[ NAVBAR ]
• Layout: 100% width, fixed to top. Height: 72px. Flexbox row: Logo (Left), 
  Navigation Links (Center), Primary CTA Button (Right).
• Styling: Background: rgba(14, 15, 17, 0.8) with 12px backdrop-filter (blur).
  Bottom border: 1px solid #26272E.
• Logo: Custom SVG logo - Icon of a padlock combined with a phone screen, 
  rendered in #F97316. Text "Screenly" in H3 Bold White.
• Links: Home, Features, Science, FAQ. Hover style: Text transitions from 
  #9CA3AF to #F3F4F6 with a subtle orange underline slide.
• CTA Button: "Install App" - Solid border style in #F97316, 12px horizontal 
  padding, rounded 8px.

[ SECTION 1: HERO SECTION - THE ATTENTION TRAP ]
• Layout: 2-Column Desktop grid (50/50 split).
  * Column 1 (Left) : Text hierarchy + dual CTA buttons.
  * Column 2 (Right): Interactive Mobile Device Simulator Widget.
• Text Copy:
  * Badge        : [PRE-ALPHA LIVE ON SOLANA DEVNET] - Orange text, border, 
                   pulsing dot.
  * Main Headline: "Your Willpower Fails. Real Penalties Succeed."
  * Sub-Headline : "Lock your most distracting apps behind Solana smart escrows. 
                   Stay disciplined or forfeit your USDC deposit directly to the 
                   treasury. Break the scroll loop with hard cash stakes."
• Left CTA Buttons:
  * Primary CTA  : "Get Screenly" (Solid orange background #F97316, white text, 
                   heavy drop shadow: rgba(249, 115, 22, 0.3) 15px blur).
  * Secondary CTA: "View Escrow Contract" (Transparent background, white text, 
                   thin border #26272E).
• Right Column Visual:
  * Interactive Phone Mockup: Dark tech outer frame. Inside, it simulates the 
    Screenly dashboard. A user is sliding a rule to lock Instagram. A pop-up asks: 
    "Deposit $10 USDC to lock Instagram for 8 hours?" with options "Confirm Deposit" 
    and "Cancel". Clicking confirm executes a small Web3 wallet-connect mock animation 
    showing the contract locking.

[ SECTION 2: INTERACTIVE LOSS AVERSION CALCULATOR ]
• Layout: Centered 1-column container, dark tech slate box (#17181C), max-width: 800px.
• Interaction:
  * Slider A: "How many hours do you waste scrolling per day?" (Range: 1 to 6 hrs).
  * Slider B: "What is your hourly value?" (Range: $15 to $150/hr).
  * Slider C: "How much USDC are you willing to bet on yourself?" (Range: $10 to $100).
• Dynamic Output Display:
  * "Annual lost productivity value: $X,XXX."
  * "Your commitment multiplier: 2.5x focus gain."
  * "If you fail, you lose $C. If you succeed, you save $X,XXX this year."
• Visual Style: Neumorphic sliders with glowing orange handles. Dynamic counts 
  spin and scale slightly on value change.

[ SECTION 3: THE ESCROW SMART CONTRACT VISUALIZER ]
• Layout: 2-Column Grid (60% graphics / 40% text explanation).
• Column 1 (Visual):
  * A live schematic representing Solana Devnet block transactions. 
  * Shows a self-custodial wallet icon on the left connected via a dotted orange 
    vector line to the "Screenly Escrow Program" (a glowing safe icon). 
  * Animated USDC coins float from the wallet to the safe.
  * A second pathway goes to the "Screenly Treasury" (glowing orange vault icon) 
    marked "FORFEITED (IF FAILED)".
  * A third pathway goes back to the "User Wallet" marked "RETURNED (IF SUCCESS)".
• Column 2 (Text):
  * Header: "Secured by Solana. Enforced by Code."
  * Copy: "No middleman. No manual overrides. Your commitments are handled 
    entirely by audited SBF WebAssembly bytecode. Once you deposit, the smart 
    contract locks the keys. Only discipline unlocks your funds. Giving in 
    instantly triggers the transaction to transfer the deposit to the treasury."

[ SECTION 4: THE PRODUCTIVITY MECHANICS (FEATURES GRID) ]
• Layout: 3-Column Grid. Card styling: #17181C background, 1px solid #26272E, 
  rounded 16px, padding 32px.
• Card 1:
  * Icon: Padlock combined with code brackets (SVG, orange glow).
  * Header: "On-Chain Escrows"
  * Description: "Every commitment creates a dedicated Program Derived Address 
    (PDA) on Solana. Your tokens are securely escrowed and verifiable on Solscan."
• Card 2:
  * Icon: Smartphone frame with alert shield (SVG, orange glow).
  * Header: "Un-bypassable App Blocking"
  * Description: "Our native Android enforcer runs inside a lightweight 
    accessibility service. It intercepts blocked apps and traps you on the 
    block screen—disabling the back key—until you either close the app or pay."
• Card 3:
  * Icon: Key combined with a user avatar (SVG, orange glow).
  * Header: "Self-Custodial Control"
  * Description: "Your keys, your discipline. Screenly generates a local Solana 
    wallet directly on your phone. You retain 100% ownership and sign every 
    escrow deposit locally."

[ SECTION 5: FOOTER & CONVERSION ZONE ]
• Layout: Centered dark card layout. Background gradient: Linear gradient from 
  #17181C to #0E0F11.
• Content:
  * Headline: "Ready to stop losing time?"
  * Description: "Deploy your first discipline contract on Solana Devnet today. 
    Requires Android 10+ and a minimum deposit of $10 USDC."
  * Inputs: "Download APK for Android" button (Heavy accent fill, pulse glow).
  * Bottom Metadata: Legal, Privacy, Github Repo link, Solana Program ID address 
    (displayed as a click-to-copy component). Bottom copyright.


3. ANIMATION & MICRO-INTERACTION SCHEMES
--------------------------------------------------------------------------------

[ SCROLL-DRIVEN GLOW EFFECTS ]
• Card Hover: Hovering over any feature card increases the border color from 
  #26272E to #F97316 (orange) and triggers a 25px box-shadow glow effect: 
  rgba(249, 115, 22, 0.1). Uses a 0.3s cubic-bezier ease-out transition.
• CTA Button Pulse: The main "Get Screenly" button has a continuous, subtle 
  pulse animation. The shadow radius expands from 10px to 25px every 2 seconds, 
  mimicking a heartbeat.

[ THE ESCROW VECTOR ANIMATION ]
• Dotted Lines: Dotted SVG path vectors representing the transaction routes have 
  a CSS stroke-dashoffset animation. Dotted dashes appear to slide smoothly 
  along the paths to represent flow direction.
• Coin Floating: Floating USDC coin icons have an infinite CSS floating keyframe: 
  translateY(0px) to translateY(-10px) with slight rotation, randomized offset 
  durations (3s, 4s, 5s) to make it feel organic.

[ TRANSITION BETWEEN SECTIONS ]
• Fade-in-up: Sections animate into view as the user scrolls. Utilizing a 
  simple intersection observer, elements start at opacity 0 and transform: 
  translateY(30px) and transition to opacity 1, transform: translateY(0px) over 
  a duration of 0.8s with a smooth ease-out.


4. RESPONSIVE DESIGN & ADAPTIVE COMPACT STATES
--------------------------------------------------------------------------------

[ DESKTOP STATE (1200px and up) ]
• Grids: Full 2-column hero split, 3-column features grid, 2-column escrow visualizer.
• Animations: Full interactive canvas, floating icons, and calculator transitions active.

[ TABLET STATE (768px to 1024px) ]
• Grids: 2-column hero collapses to 1-column if width is less than 850px. 3-column 
  features wrap into a 2-column grid (two on top, one centered below).
• Interactive Calculator: Stretches to full width, sliders scale down.

[ MOBILE STATE (320px to 767px) ]
• Grids: All layouts collapse to a single vertical column. Spacing reduces to 
  20px margins and 40px vertical gaps.
• Text: Title Hero H1 size drops to 36px. Section H2 size drops to 28px.
• Navbar: Collapses to Logo (Left) and Burger Menu (Right), which opens a 
  full-screen slide-out drawer containing links and installation button.
• Interactivity: Floating graphics are disabled or made static to preserve mobile 
  rendering performance. Sliders are replaced with tap-to-select incremental buttons 
  to make mobile interaction easier.

================================================================================
                               [END OF SPECIFICATION]
================================================================================
