export function wait(ms: number) {
	return new Promise<number>(resolve => {
		setTimeout(() => {
			resolve(new Date().getTime());
		}, ms);
	});
}

export function waitFrame() {
	return new Promise<number>(resolve => requestAnimationFrame(resolve));
}
