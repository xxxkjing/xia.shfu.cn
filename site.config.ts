import siteConfig from "./src/utils/config";

const config = siteConfig({
	title: "MetaIllusion的博客",
	prologue: "Time, Truth, and Hearts",
	author: {
		name: "MetaIllusion",
		email: "xkjing.xiajing@gmail.com",
		link: "https://xia.shfu.cn"
	},
	description: "一个博客，记录一个高中生的生活",
	copyright: {
		type: "CC BY-NC-ND 4.0",
		year: "2025"
	},
	i18n: {
		locales: ["zh-cn", "en"],
		defaultLocale: "zh-cn"
	},
	feed: {
		section: "*",
		limit: 20
	},
	latest: "*"
});

export const monolocale = Number(config.i18n.locales.length) === 1;

export default config;
