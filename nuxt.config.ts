export default defineNuxtConfig({
	modules: ["@nuxt/content"],
	srcDir: "src/",
	devtools: { enabled: true },
	typescript: {
		shim: false,
	},
	content: {
		experimental: {
			search: {},
		},
	},
});
