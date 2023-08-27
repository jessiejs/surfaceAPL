import Unfonts from 'unplugin-fonts/vite'
import { exec } from 'child_process';

const gitProc = exec(`git rev-parse HEAD`);

// get git result
let hash = '';

gitProc.stdout!.on('data', (data) => {
	hash = data.toString();
})

await new Promise(resolve => gitProc.stdout!.on('end', resolve));

hash = hash.trim().toLowerCase();

// get first chars
const shortHash = hash.substring(0, 7);

export default {
	plugins: [],
	define: {
		APP_VERSION: JSON.stringify(process.env.npm_package_version),
		COMMIT_HASH: JSON.stringify(shortHash),
	},
}
