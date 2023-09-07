import { Howl } from "howler";

function noteURL(index:number) {
	return `https://assets.codepen.io/1468070/key-${index}.wav`;
}

const noteCount = 21;

export type ReturnType<T extends (...args: any[]) => any> = T extends (
	...args: any[]
) => infer R
	? R
	: never;

export class Jukebox {
	timers: ReturnType<typeof setInterval>[] = [];
	
	constructor() {
		const maxMinutes = 3;
		const maxSeconds = maxMinutes * 60;
		const maxMilliseconds = maxSeconds * 1000;

		const baseDivider = 1;

		for (let i = 0; i < noteCount + 1; i++) {
			this.timers.push(setInterval(() => {
				new Howl({
					src: [noteURL(i)],
				}).play();
			}, maxMilliseconds / (i + baseDivider)));
		}
	}

	destroy() {
		for (const timer of this.timers) {
			clearInterval(timer);
		}
	}
}
