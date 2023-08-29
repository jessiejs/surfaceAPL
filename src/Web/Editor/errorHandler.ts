export function showErrorScreen(ctx:CanvasRenderingContext2D, message: string) {
	let x = 50;
	let y = 50;
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.fillStyle = "white";
	ctx.font = "50px Renogare";
	ctx.fillText(`:(`, x, y);
	y += 80;
	ctx.font = "20px Renogare";
	const text = `Oh no! surfaceAPL has crashed. :(

Info for developers:
${message}`;
	
	for (const line of text.split('\n')) {
		ctx.fillText(line, x, y);
		y += 25;
	}
}
