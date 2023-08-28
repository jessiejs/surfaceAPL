import GZip from 'gzip-js';
import copy from '../IO/copy';

export async function loadLevelURL() {
	// get code from search params
	const code = new URLSearchParams(window.location.search).get('code');

	if (!code) {
		window.location.pathname = '/';
	}

	// convert the base64 string to a Uint8Array
	const uint8Array = new Uint8Array(
		atob(code!)
			.split('')
			.map(char => char.charCodeAt(0))
	);

	// un gzip
	const data = await GZip.unzip(uint8Array);

	// convert to text
	const text = new TextDecoder().decode(Uint8Array.from(data));

	// show dialog
	copy('Get this level', text);
}
