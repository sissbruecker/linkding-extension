import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

const production = !process.env.ROLLUP_WATCH;

export default [
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
			// some cases you'll need additional configuration
			resolve({
				browser: true,
				dedupe: importee => importee === 'svelte' || importee.startsWith('svelte/')
			}),

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
			// some cases you'll need additional configuration
			resolve({ browser: true }),

			// If we're building for production (npm run build
			// instead of npm run dev), minify
			production && terser()
		],
		watch: {
			clearScreen: false
		}
	}
];
