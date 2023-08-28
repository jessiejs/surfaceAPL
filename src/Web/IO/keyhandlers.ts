export const keyDownHandlers: ((e: KeyboardEvent) => void)[][] = [];
export const keyUpHandlers: ((e: KeyboardEvent) => void)[][] = [];

export function keyDown(e: KeyboardEvent) {
	keyDownHandlers[keyDownHandlers.length - 1]?.forEach(i => i(e));
}

export function keyUp(e: KeyboardEvent) {
	keyUpHandlers[keyDownHandlers.length - 1]?.forEach(i => i(e));
}
