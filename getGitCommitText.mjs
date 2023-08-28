import { exec } from 'child_process';

const gitCommand = `git log -1 --pretty=%B`;

let commitText = '';

await new Promise(resolve => exec(gitCommand, (err, stdout) => {
	commitText = stdout;
	resolve();
}));

// send to a discord webhook
const webhook = process.env.SURFACEAPL_WEBHOOK;
if (webhook) {
	// send message
	const result = await fetch(webhook, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			content: `Commit message: ${commitText}`,
		}),
	}).then(rs => rs.text());
} else {
	console.log(`No webhooks :raised_eyebrows:`);
}
