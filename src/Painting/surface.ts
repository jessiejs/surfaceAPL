import { indexToStandardCoords } from '../SaveCodes/coords';
import { Level, Tile } from '../SaveCodes/saveload';

export type Filter = (options: {
	level: Level;
	pos: [number, number];
	x: number;
	y: number;
	tile: Tile;
}) => Tile | undefined | void;

export function clip(filter: Filter, rect: [number, number, number, number]) {
	return function (options) {
		const x = rect[0];
		const y = rect[1];
		const rightX = rect[0] + rect[2];
		const bottomY = rect[1] + rect[3];
		if (
			options.x >= x &&
			options.x < rightX &&
			options.y >= y &&
			options.y < bottomY
		) {
			return filter(options);
		}
		return undefined;
	} satisfies Filter;
}

export function fill(type: number) {
	return function (options) {
		options.tile.id = type;
	} satisfies Filter;
}

export function set(pos: [number, number], filter: Filter) {
	return function (options) {
		if (options.pos == pos) {
			return filter(options);
		}
	} satisfies Filter;
}

export function Surface(level: Level) {
	return {
		level,
		_(filter: Filter) {
			let index = 0;
			for (const tile of level.tiles) {
				const result = filter({
					level,
					pos: indexToStandardCoords(
						index,
						level.width,
						level.height
					),
					x: indexToStandardCoords(
						index,
						level.width,
						level.height
					)[0],
					y: indexToStandardCoords(
						index,
						level.width,
						level.height
					)[1],
					tile,
				});
				if (result) {
					level.tiles[index] = result;
				}
				index++;
			}
		},
	};
}
