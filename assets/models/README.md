# Mascot model

`tux.bin` is the Tux mascot drawn in ASCII on the home page (`assets/js/mascot.js`).

- **Model:** [Tux](https://sketchfab.com/3d-models/tux-157de95fa4014050a969a8361a83d366) by Andy Cuccaro, licensed under [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/). The credit is shown on the page, under the mascot.
- **Source file:** `scripts/models/tux.glb` (the Sketchfab GLB download).
- **Rebuild:** `node scripts/build-tux-model.js [grid]`. The grid (default 96, the site uses 40) is how many cells the model's height is split into when merging nearby vertices: lower is lighter and blockier.
