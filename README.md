Chromaphone
===========

Cross-sensory assistive technology for hearing light.

How to Use
----------

Open the `dist/index.html` file in an up-to-date version of Google Chrome. Currently other browser support is inconsistent due to WebAudio inconsistencies that will likely be resolved in the near future (it's an experimental technology).

Building from Source
--------------------

Ensure you have [node](https://nodejs.org/) installed, then:

	npm run watch

will load a local development server which will auto-reload any changes 

Dependencies
------------

- `babel` for transpiling/polyfilling for older browser targets
- `cpx` for watching non-JS assets and auto-reloading dev server
- `webpack` for bundling JS together with assets/compilation workflow
- `react` from UI
- `tone.js` to interact with WebAudio
