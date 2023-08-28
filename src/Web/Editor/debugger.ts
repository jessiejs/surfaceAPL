export function createDebugger(ctx: CanvasRenderingContext2D) {
	const size = 18;
	const gap = 2;
	const screenPadding = 10;
	let y = 0;

	const dbg = function (lines: string, padding = 5) {
		for (const text of lines.split('\n')) {
			ctx.font = `bold ${size}px monospace`;
			ctx.textBaseline = 'top';
			ctx.textAlign = 'left';
			ctx.fillStyle = 'rgba(0,0,0,0.5)';
			ctx.fillRect(
				screenPadding,
				y + screenPadding,
				ctx.measureText(text).width + padding * 2,
				size + padding * 2
			);

			ctx.fillStyle = 'white';
			ctx.fillText(
				text,
				padding + screenPadding,
				padding + y + screenPadding
			);

			y += size + padding * 2;
		}
		y += gap;
	} as ((lines: string, padding?: number) => void) & {
		removeGap(): void;
		section(): void;
		title(title: string): void;
		json(obj: any): void;
	};

	dbg.removeGap = function () {
		y -= gap;
	};

	dbg.section = function () {
		y += gap * 3;
	};

	dbg.title = function (title: string) {
		y += gap * 15;
		dbg(title, 10);
		y += gap * 3;
	};

	dbg.json = function (obj: any) {
		dbg(JSON.stringify(obj, undefined, '    '), 3);
	};

	return dbg;
}
