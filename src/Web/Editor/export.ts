import createDialog from '../IO/dialog';
import copy from '../IO/copy';
import select from '../IO/select';
import alert from '../IO/alert';
import {
	Level,
	encodeLevel,
	mainLevelCodeToOpenCode,
} from '../../SaveCodes/saveload';
import QRCode from 'qrcode';
import GZip from 'gzip-js';
import confirm from '../IO/confirm';

async function bufferToBase64(buffer: Uint8Array) {
	// use a FileReader to generate a base64 data URI:
	const base64url = await new Promise<string>(r => {
		const reader = new FileReader();
		reader.onload = () => r(reader.result as string);
		reader.readAsDataURL(new Blob([buffer]));
	});
	// remove the `data:...;base64,` part from the start
	return base64url.slice(base64url.indexOf(',') + 1);
}

export async function share(level: Level) {
	// compile the level
	const mainLevelCode = encodeLevel(level, {
		compress: true,
		makeNonEditableByJS: false,
	});
	const levelCode = mainLevelCodeToOpenCode(mainLevelCode);

	// build our URL
	let url = await getURLForLevel(levelCode);

	// check if we should use a link shortener
	if (
		await confirm(
			'Do you want to use a link shortener? This will make your QR Code or link a lot shorter, but it is put on a server not owned by us.'
		)
	) {
		let result = (await fetch('https://gotiny.cc/api', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ input: url }),
		}).then(res => res.json())) as { code?: string }[];

		if (!result[0]?.code) {
			await alert(`It looks like we couldn't host your level.`);
			if (window.location.href.includes('localhost')) {
				await alert(
					`This is probably due to the fact that you are using localhost, instead of our primary servers`
				);
			}
			return;
		}

		url = `https://gotiny.cc/${result[0]?.code}`;
	}

	// show a share type selector
	let canShare = true;

	if (
		!navigator.canShare ||
		!navigator.canShare({ url }) ||
		!navigator.share
	) {
		canShare = false;
	}

	const shareType = await select(
		'Sharing method' + (canShare ? '' : ' (share-sheet is unavailable)'),
		[
			{ text: 'Link', isThereMore: false },
			{ text: 'QR Code', isThereMore: false },
			...(canShare ? [{ text: 'Share-sheet', isThereMore: false }] : []),
		]
	);

	switch (shareType) {
		case 'Link':
			copy('Share this url with your friends', url);
			break;
		case 'QR Code':
			{
				let dataURL = '';

				try {
					dataURL = await QRCode.toDataURL(url, {
						margin: 1,
						width: 512,
						color: {
							dark: '#7856FF',
							light: '#000',
						},
						errorCorrectionLevel: 'L',
					});
				} catch {
					await alert(
						`This is unusual, your hosted level, the link to which should be quite small, could not be made into a QR code, please assume that it's our fault, and tell us!!!`
					);
				}

				const img = document.createElement('img');
				img.src = dataURL;
				img.alt = 'QR Code';
				img.style.borderRadius = '5px';
				img.style.width = '100%';

				const { content } = createDialog('QR Code', {
					buttons: [
						{
							text: 'Close',
							close: true,
						},
					],
				});

				content.appendChild(img);
			}
			break;
		case 'Share-sheet':
			{
				navigator.share({
					url,
					text: `This is your level, send it to your friends!`,
					title: `Level Download`,
				});
			}
			break;
	}
}

async function getURLForLevel(text: string) {
	const gzipped = Uint8Array.from(GZip.zip(text));
	const gzippedText = await bufferToBase64(gzipped);

	const url = new URL(window.location.href);

	url.pathname = '/level';
	url.searchParams.set('code', gzippedText);

	return url.toString();
}

export async function showExportDialog(level: Level) {
	// select the export type
	const type = await select('Export Type', [
		{ text: 'Copy', isThereMore: false },
		{ text: 'Share', isThereMore: true },
	]);

	const levelCode = mainLevelCodeToOpenCode(
		encodeLevel(level, {
			compress: true,
			makeNonEditableByJS: false,
		})
	);

	if (type == 'Copy') {
		await copy('Copy your level code', levelCode);
	} else if (type == 'Share') {
		await share(level);
	} else {
		await alert(
			`Oops! It looks like when we were trying to figure out which option you selected, we got "${type}", instead of "Copy" or "QR Code"`
		);
	}
}
