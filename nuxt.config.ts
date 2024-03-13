export default defineNuxtConfig({
	modules: ["@nuxt/content", "@unocss/nuxt", "@vueuse/nuxt"],
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
