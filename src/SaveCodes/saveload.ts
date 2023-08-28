import { Direction, TileType, Wall } from './tiles';

export type Level = {
	width: number;
	height: number;
	tiles: Tile[];
	walls: number[];
	hue: number;
	hue2: number;
};
export type Tile = {
	id: number;
	data: string;
	rotation: number;
};

export function loadLevel(level: string): Level {
	// Parse the level
	const sections = level.split(' ');

	const width = Number(sections.shift());

	// Read the ids
	const ids: number[] = [];

	let tile = sections.shift();
	while (tile != '' && tile) {
		const count = Number(sections.shift());

		for (let i = 0; i < count; i++) {
			ids.push(Number(tile));
		}

		tile = sections.shift();
	}

	if (sections.length == 0) {
		const walls: number[] = [];

		for (let i = 0; i < width; i++) {
			walls.push(Wall.Flat);
		}

		return {
			width,
			height: ids.length / width,
			tiles: ids.map(id => ({
				id,
				data: '',
				rotation: Direction.Default,
			})),
			walls,
			hue: 0,
			hue2: 0,
		};
	}

	// Read the rotations
	const rotations: number[] = [];

	let rotation = sections.shift();
	while (rotation != '' && rotation) {
		const count = Number(sections.shift());

		for (let i = 0; i < count; i++) {
			rotations.push(Number(rotation));
		}

		rotation = sections.shift();
	}

	// Read the data
	const datas: string[] = [];

	let data = sections.shift();
	while (data != '' && data) {
		datas.push(data);

		data = sections.shift();
	}

	// Read the walls
	const walls: number[] = [];

	let wall = sections.shift();
	while (wall != '' && wall) {
		walls.push(Number(wall));

		wall = sections.shift();
	}

	let h = 0;
	let h2 = 0;

	const hue = sections.shift();
	if (hue != '' && hue) {
		const hue2 = sections.shift();

		h = Number(hue);
		h2 = Number(hue2);
	}

	// Now let's convert the weird janky arrays in the scratch format to a nice clean modern format
	const tiles: Tile[] = [];

	for (let i = 0; i < ids.length; i++) {
		const id = ids[i];
		const rotation = rotations[i];

		tiles.push({
			id,
			data: '',
			rotation,
		});
	}

	while (datas.length > 0) {
		const index = Number(datas.shift()?.slice(1));
		const data = datas.shift();

		tiles[index - 1].data = data!;
	}

	return {
		width,
		height: ids.length / width,
		tiles,
		walls,
		hue: h,
		hue2: h2,
	};
}

function compressData(data: number[], compress: boolean): number[] {
	if (!compress) {
		const output = [];
		for (const value of data) {
			output.push(1, value);
		}
		return output;
	}
	let previousValue = 99999999999;
	let previousValueCount = 0;

	const encoded: number[] = [];

	for (const value of data) {
		if (value != previousValue) {
			if (previousValueCount > 0) {
				encoded.push(previousValue, previousValueCount);
			}

			previousValueCount = 0;
			previousValue = value;
		}
		previousValueCount++;
	}

	if (previousValueCount > 0) {
		encoded.push(previousValue, previousValueCount);
	}

	return encoded;
}

export function encodeLevel(
	level: Level,
	{
		compress,
		makeNonEditableByJS,
	}: { compress: boolean; makeNonEditableByJS: boolean }
): string {
	const segments: (string | number)[] = [];

	segments.push(level.width);

	// Write the ids
	const ids: number[] = compressData(
		level.tiles.map(tile => tile.id),
		compress
	);
	if (makeNonEditableByJS) {
		ids.push(0, -1);
	}
	segments.push(...ids, '');

	// Write the rotations
	const rotations: number[] = compressData(
		level.tiles.map(tile => tile.rotation),
		compress
	);
	segments.push(...rotations, '');

	// Write the data
	let index = 0;
	for (const tile of level.tiles) {
		index++;
		if (tile.data != '') {
			segments.push(`+${index}`, tile.data);
		}
	}
	segments.push('');

	// Write the walls
	for (const wall of level.walls) {
		segments.push(wall);
	}
	segments.push('');

	// Write the hue
	segments.push(level.hue);
	segments.push(level.hue2);

	return segments.join(' ');
}

export function mainLevelCodeToOpenCode(code: string): string {
	let x = code.split(' ').join('Z').split('+').join('B').split('-').join('C');
	x = x.length + 1234567 + x;
	return x;
}

export function openCodeToMainLevelCode(code: string): string {
	return code
		.split('Z')
		.join(' ')
		.split('B')
		.join('+')
		.split('C')
		.join('-')
		.split('z')
		.join(' ')
		.split('b')
		.join('+')
		.split('c')
		.join('-')
		.slice(7);
}
