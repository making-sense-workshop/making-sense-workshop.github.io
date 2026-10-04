# Making Sense: Foundation Models for Multisensory Intelligence

Website for the Making Sense workshop at AAAI-27: https://making-sense-workshop.github.io/

## Editing

The site is plain HTML, CSS and a little JavaScript, with no build step.

- `index.html` holds all the content. Submission dates and the submission link are marked "To be announced" until they are confirmed. The speakers section shows placeholder cards, and the program is the tentative half-day schedule (14:00–18:00) without speaker names. The program committee section's "Join the Program Committee" button emails the workshop chair until an application form exists. The call for sponsors lists opportunities without prices or tiers; inquiries go to the workshop chair.
- `assets/style.css` holds the styles. Colors are defined once at the top, with a dark-mode set below them. Fonts are DM Serif Display, Manrope and DM Mono from Google Fonts.
- `assets/signals.js` draws the sensor streams in the hero.
- `assets/script.js` runs the mobile menu and highlights the section in view.
- `assets/organizers/` holds the organizer photos as square JPEGs. Yaxuan Kong's and Qingsong Wen's were supplied by the organizers. The others come from public profile pages: Chaoli Zhang and Zhiguang Wang from Google Scholar, Ming Jin from his homepage (kimmeen.github.io), and Patrick Langer from the ETH Agentic Systems Lab team page. Zhiguang Wang's is a low-resolution crop; replace it when a better photo is available.

To preview locally:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Publishing

GitHub Pages serves the `main` branch. Every push to `main` goes live within a minute or two.
