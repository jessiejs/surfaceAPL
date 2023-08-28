import { readFile, writeFile } from 'node:fs/promises';
// semver
import { parse } from 'semver';

const packageJson = await readFile('package.json', 'utf-8');
const packageJsonObject = JSON.parse(packageJson);

const version = parse(packageJsonObject.version);
// read args
const versionUpdateType = process.argv[2];
if (versionUpdateType == 'major') {
	version.major++;
	version.minor = 0;
	version.patch = 0;
} else if (versionUpdateType == 'minor') {
	version.minor++;
	version.patch = 0;
} else if (versionUpdateType == 'patch') {
	version.patch++;
} else {
	throw new Error('Invalid version update type');
}

packageJsonObject.version = version.format();

await writeFile('package.json', JSON.stringify(packageJsonObject, null, '\t'));
