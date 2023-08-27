import { Howl } from 'howler';

export function click() {
	new Howl({
		src: ['/SFX/clack.wav'],
	}).play();
}
