# remyanddoug.com

The website for Remy & Doug ("Remy remembers, Doug does"), hosted on GitHub Pages.

- `index.html`, `privacy.html`, `support.html`: the pages
- `style.css`: shared styles (greys plus one red-orange accent, light and dark mode)
- `js/sea.js`: the pixel background engine
- `art/*.js`: the background art, changed each quarter

## Changing the background art each quarter

The dragonfly logo stays the same. The background art rotates.

1. Copy `art/dragonflies.js` to a new file, like `art/2027-q1-snowflakes.js`.
2. Change `name`, `season`, and the four functions:
   - `population(W)`: how many creatures and how big (keep phones to about 3)
   - `spawn(c, W, H, fresh)`: where each one starts
   - `move(c, dt, t, W, H)`: how it moves
   - `shape(u, v, time, ph)`: how dark each pixel is (0 to 1); `u` runs head (+1) to tail (−1)
3. In `index.html`, point the `<script src="art/...">` line at the new file.

The footer shows the current season and art name automatically.
