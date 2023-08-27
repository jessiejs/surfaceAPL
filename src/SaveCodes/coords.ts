export function indexToStandardCoords(index:number,width:number,height:number):[number,number] {
	// index 0 is bottom left, 1 is bottom right, 2 is top left, 3 is top right in a 2x2 grid
	return [
		index % width,
		height - Math.floor(index / width)
	];
}
export function standardCoordsToIndex(pos:[number, number],width:number,height:number):number {
	const gameHeight = height - pos[1];
	return gameHeight * width + pos[0];
}
