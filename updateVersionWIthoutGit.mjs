import { readFile, writeFile } from 'node:fs/promises';
// semver
import { parse } from 'semver';

const packageJson = await readFile('package.json', 'utf-8');
const packageJsonObject = JSON.parse(packageJson);

const beforeVersion = packageJsonObject.version;
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
const afterVersion = packageJsonObject.version;

// post to a discord webhook
const webhook = process.env.SURFACEAPL_WEBHOOK;
if (webhook) {
	// send message
	const result = await fetch(webhook, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			content: `Updated from ${beforeVersion} to ${afterVersion}, update type ${versionUpdateType}`,
		}),
	}).then(rs => rs.text());

	console.log(result);
} else {
	console.log(`No webhooks :raised_eyebrows:`);
}
