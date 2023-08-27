import Unfonts from 'unplugin-fonts/vite'

export default {
	plugins: [],
	define: {
		APP_VERSION: JSON.stringify(process.env.npm_package_version),
	},
}
