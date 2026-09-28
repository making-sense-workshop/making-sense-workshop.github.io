# Making Sense: Foundation Models for Multisensory Intelligence

Website for the Making Sense workshop at AAAI-27: https://making-sense-workshop.github.io/

## Editing

The site is plain HTML and CSS with no build step.

- `index.html` holds all the content. Dates, the submission link, speakers and the schedule are marked "To be announced" until they are confirmed.
- `assets/style.css` holds the styles. Colors are defined once at the top, with a dark-mode set below them.
- `assets/signals.js` draws the sensor streams in the header.

To preview locally:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Publishing

GitHub Pages serves the `main` branch. Every push to `main` goes live within a minute or two.
