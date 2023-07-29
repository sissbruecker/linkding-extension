const svelte = require('rollup-plugin-svelte');
const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const terser = require('@rollup/plugin-terser');

const production = !process.env.ROLLUP_WATCH;

module.exports = [
	// Main bundle (browser action, options page)
	{
		input: 'src/index.js',
		output: {
			sourcemap: true,
			format: 'iife',
			name: 'linkding',
			file: 'build/bundle.js'
		},
		plugins: [
			svelte({
				emitCss: false
			}),

			// If you have external dependencies installed from
			// npm, you'll most likely need these plugins. In
			// some cases you'll need additional configuration —
			// consult the documentation for details:
			// https://github.com/rollup/rollup-plugin-commonjs
			resolve({
				browser: true,
				dedupe: importee => importee === 'svelte' || importee.startsWith('svelte/')
			}),
			commonjs(),

			// If we're building for production (npm run build
			// instead of npm run dev), minify
			production && terser()
		],
		watch: {
			clearScreen: false
		}
	},
	// Background bundle
	{
		input: 'src/background.js',
		output: {
			sourcemap: true,
			format: 'iife',
			file: 'build/background.js'
		},
		plugins: [
			// If you have external dependencies installed from
			// npm, you'll most likely need these plugins. In
			// some cases you'll need additional configuration —
			// consult the documentation for details:
			// https://github.com/rollup/rollup-plugin-commonjs
			resolve({ browser: true }),
			commonjs(),

			// If we're building for production (npm run build
			// instead of npm run dev), minify
			production && terser()
		],
		watch: {
			clearScreen: false
		}
	}
];
