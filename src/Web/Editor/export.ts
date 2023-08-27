import createDialog from "../IO/dialog";
import copy from "../IO/copy";
import select from "../IO/select";
import alert from "../IO/alert";
import { Level, encodeLevel, mainLevelCodeToOpenCode } from "../../SaveCodes/saveload";
import QRCode from 'qrcode';
import GZip from 'gzip-js';

async function bufferToBase64(buffer:Uint8Array) {
	// use a FileReader to generate a base64 data URI:
	const base64url = await new Promise<string>(r => {
	  const reader = new FileReader()
	  reader.onload = () => r(reader.result as string)
	  reader.readAsDataURL(new Blob([buffer]))
	});
	// remove the `data:...;base64,` part from the start
	return base64url.slice(base64url.indexOf(',') + 1);
  }

export async function showQRCode(text:string) {
	const gzipped = Uint8Array.from(GZip.zip(text));
	const gzippedText = await bufferToBase64(gzipped);

	const url = new URL(window.location.href);

	url.pathname = '/level';
	url.searchParams.set('code', gzippedText);

	const dataURL = await QRCode.toDataURL(url.toString(),{
		margin: 1,
		width: 512,
		color: {
			dark: '#7856FF',
			light: '#000'
		},
		errorCorrectionLevel: 'L'
	});

	const img = document.createElement('img');
	img.src = dataURL;
	img.alt = 'QR Code';
	img.style.borderRadius = '5px';
	img.style.width = '100%';

	const { content } = createDialog('QR Code', {
		buttons: [
			{
				text: 'Close',
				close: true
			}
		]
	});
	content.appendChild(img);
}

export async function showExportDialog(level:Level) {
	// select the export type
	const type = await select('Export Type', [
		'Copy',
		'QR Code'
	]);

	const levelCode = mainLevelCodeToOpenCode(encodeLevel(level, {
		compress: true,
		makeNonEditableByJS: false
	}))

	if (type == 'Copy') {
		copy('Copy your level code',levelCode);
	} else if (type == 'QR Code') {
		showQRCode(levelCode);
	} else {
		alert(`Oops! It looks like when we were trying to figure out which option you selected, we got "${type}", instead of "Copy" or "QR Code"`);
	}
}
