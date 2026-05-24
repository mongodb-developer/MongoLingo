# MongoLingo

MongoLingo is an interactive, Duolingo-style game for learning MongoDB by doing. Players select a learning path, complete short hands-on lessons, and practice MongoDB concepts through domain-specific or value-proposition levels, stages, and challenges.

## What is included

- **Learning paths** with proprietary examples for each domain, plus competitive value-proposition tracks.
- **Stage-based exercises** that teach MongoDB document modeling, querying, aggregation, indexing, and Atlas concepts.
- **Gamified progression** with XP, streaks, leaves, level completion, and challenge screens.
- **Static web deployment** that runs directly from GitHub Pages.

## Learning paths

MongoLingo includes content packs for:

- General MongoDB learning
- MongoDB vs Postgres value proposition
- Manufacturing
- Financial Services
- Cybersecurity
- Healthcare
- Retail
- Telecom
- Insurance
- Media
- Gaming

Each industry or value-proposition path has its own `data.jsx` content pack so stages and levels can use relevant examples instead of sharing one generic dataset everywhere.

## Project structure

```text
.
├── index.html              # Static app entry point
├── app.jsx                 # Root React app and state management
├── screens.jsx             # Main app screens
├── components.jsx          # Shared UI components
├── exercises.jsx           # Exercise rendering logic
├── data.jsx                # General/default content pack
├── styles.css              # App styling
├── assets/                 # MongoDB brand assets and icons
├── manufacture/data.jsx    # Manufacturing content pack
├── fsi/data.jsx            # Financial Services content pack
├── cyber/data.jsx          # Cybersecurity content pack
├── healthcare/data.jsx     # Healthcare content pack
├── retail/data.jsx         # Retail content pack
├── telecom/data.jsx        # Telecom content pack
├── insurance/data.jsx      # Insurance content pack
├── media/data.jsx          # Media content pack
├── gaming/data.jsx         # Gaming content pack
└── postgres/data.jsx       # MongoDB vs Postgres value-proposition content pack
```

## Run locally

Because this is a static React/Babel prototype, you can open `index.html` directly in a browser.

For a local web server, run:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Deploy with GitHub Pages

This repository is ready for GitHub Pages deployment from the root of the `main` branch.

Deployment checklist:

1. Push the repository to GitHub.
2. Open the repository settings.
3. Go to **Pages**.
4. Set the source to **Deploy from a branch**.
5. Select branch `main` and folder `/root`.
6. Save.

The `.nojekyll` file is included so GitHub Pages serves all static assets without Jekyll processing.

## Credits

Designed and built with Claude's Design System, using MongoDB brand-inspired visuals and learning patterns.
