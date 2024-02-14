import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import obfuscatorPlugin from 'vite-plugin-javascript-obfuscator';

export default defineConfig({
	plugins: [sveltekit()]
});
