import { exec } from 'node:child_process';
import { version } from 'node:os';
import { join } from 'node:path';

const gitProc = exec(`git rev-parse HEAD`);

// get git result
let hash = '';

gitProc.stdout!.on('data', data => {
	hash = data.toString();
});

await new Promise(resolve => gitProc.stdout!.on('end', resolve));

hash = hash.trim().toLowerCase();

// get first chars
const shortHash = hash.substring(0, 7);

export default {
	plugins: [],
	define: {
		APP_VERSION: JSON.stringify(process.env.npm_package_version),
		COMMIT_HASH: JSON.stringify(shortHash),
		BUILD_TIME: JSON.stringify(new Date().getTime()),
		OS_INFO: JSON.stringify(
			`${process.platform}/${process.arch} (${version()})`
		),
		NODE_INFO: JSON.stringify(`Node ${process.version}`),
	},
	build: {
		rollupOptions: {
			input: {
				main: join(__dirname, 'index.html'),
				level: join(__dirname, 'level/index.html'),
			},
		},
	},
};
