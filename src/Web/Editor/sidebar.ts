import shake, { bump } from '../Effects/shake';
import { keyDownHandlers, keyUpHandlers } from '../IO/keyhandlers';
import { Selection } from './editor';
import {
	IdToString,
	TileType,
	categories,
	mask,
	rotatables,
} from '../../SaveCodes/tiles';
import { openDialogTestMenu } from './dialogtest';
import { click } from '../Effects/click';
import {
	Level,
	encodeLevel,
	mainLevelCodeToOpenCode,
} from '../../SaveCodes/saveload';
import copy from '../IO/copy';

export function createSidebar(
	level: Level,
	sidebar: HTMLElement,
	getTool: () => Selection,
	setTool: (tool: Selection) => void
) {
	const selectorEventListeners: ((event: KeyboardEvent) => void)[] = [];

	keyDownHandlers.push(selectorEventListeners);
	keyUpHandlers.push([]);

	const handler = (event: KeyboardEvent) => {
		if (event.code == 'KeyR') {
			const tool = getTool();

			let rotation = tool.rotation + 1;

			if (rotation > 4) {
				rotation = 1;
			}

			setTool({
				rotation,
				id: tool.id,
			});
			updateSidebar(getTool());
			click();

			//shake({
			//	target: sidebar,
			//	time: 5,
			//	intensity: 5,
			//	frequency: 800
			//});
			const bumpAmount = 10;
			if (rotation == 1) {
				bump({
					target: sidebar,
					time: 5,
					direction: [0, -bumpAmount],
				});
			} else if (rotation == 2) {
				bump({
					target: sidebar,
					time: 5,
					direction: [bumpAmount, 0],
				});
			} else if (rotation == 3) {
				bump({
					target: sidebar,
					time: 5,
					direction: [0, bumpAmount],
				});
			} else if (rotation == 4) {
				bump({
					target: sidebar,
					time: 5,
					direction: [-bumpAmount, 0],
				});
			}
		} else if (event.code == 'KeyB') {
			//openDialogTestMenu();
		} else if (event.code == 'KeyZ') {
			// Export
			const internalCode = encodeLevel(level, {
				compress: true,
				makeNonEditableByJS: false,
			});
			const openCode = mainLevelCodeToOpenCode(internalCode);

			copy('Download your level', openCode);
		} else if (event.code == 'KeyP') {
			// replace all the flags with air
			for (const tile of level.tiles) {
				if (tile.id == TileType.Checkpoint9) {
					tile.id = TileType.Blank;
				}
				if (tile.id == TileType.MobA) {
					tile.id = TileType.EnemyPip;
				}
				if (tile.id == TileType.Apple) {
					tile.id = TileType.MobA;
				}
				if (tile.id == TileType.Stomp01) {
					tile.data = 'r0';
				}
				if (
					mask[tile.id - 1].doHue &&
					![
						TileType.Green1111,
						TileType.Stomp01,
						TileType.Saw3,
						TileType.Spike0099,
						TileType.Spike0909,
						TileType.Green1111b,
						TileType.Unused,
						TileType.Green1000,
					].includes(tile.id)
				) {
					tile.id = TileType.Crumble00118;
				}
				if (tile.id == TileType.Saw2) {
					tile.id = TileType.BIRD01;
				}
			}
			console.log(`Pee`);
		}
	};

	selectorEventListeners.push(handler);

	let catIndex = 0;
	for (const category of categories) {
		catIndex++;
		const ci = catIndex;

		const handler = (event: KeyboardEvent) => {
			if (Number(event.key) === ci) {
				const indexInCategory = category.indexOf(getTool().id);
				const newIndex = (indexInCategory + 1) % category.length;
				setTool({
					id: category[newIndex],
					rotation: getTool().rotation,
				});
				updateSidebar(getTool());
				click();

				shake({
					target: sidebar,
					time: 15,
					intensity: 10,
					frequency: 500,
				});
			}
		};
		selectorEventListeners.push(handler);

		const row = document.createElement('div');
		row.classList.add('row');

		for (const tile of category) {
			if (rotatables.includes(tile)) {
				const containerElm = document.createElement('div');
				containerElm.classList.add('widget');

				const rot1Elm = document.createElement('button');
				const rot1Img = document.createElement('img');

				const rot2Elm = document.createElement('button');
				const rot2Img = document.createElement('img');

				const rot3Elm = document.createElement('button');
				const rot3Img = document.createElement('img');

				const rot4Elm = document.createElement('button');
				const rot4Img = document.createElement('img');

				rot1Elm.appendChild(rot1Img);
				rot2Elm.appendChild(rot2Img);
				rot3Elm.appendChild(rot3Img);
				rot4Elm.appendChild(rot4Img);

				rot1Elm.dataset.rotation1For = `${tile}`;
				rot2Elm.dataset.rotation2For = `${tile}`;
				rot3Elm.dataset.rotation4For = `${tile}`;
				rot4Elm.dataset.rotation3For = `${tile}`;

				rot1Elm.title = `${IdToString[tile]} (${tile}) 1`;
				rot2Elm.title = `${IdToString[tile]} (${tile}) 2`;
				rot3Elm.title = `${IdToString[tile]} (${tile}) 4`;
				rot4Elm.title = `${IdToString[tile]} (${tile}) 3`;

				rot1Elm.addEventListener('click', () => {
					setTool({
						id: tile,
						rotation: 1,
					});
					updateSidebar(getTool());
				});

				rot2Elm.addEventListener('click', () => {
					setTool({
						id: tile,
						rotation: 2,
					});
					updateSidebar(getTool());
				});

				rot3Elm.addEventListener('click', () => {
					setTool({
						id: tile,
						rotation: 4,
					});
					updateSidebar(getTool());
				});

				rot4Elm.addEventListener('click', () => {
					setTool({
						id: tile,
						rotation: 3,
					});
					updateSidebar(getTool());
				});

				rot1Img.src = `/Textures/Icons/${IdToString[
					tile
				]?.toLowerCase()}.svg`;
				rot2Img.src = `/Textures/Icons/${IdToString[
					tile
				]?.toLowerCase()}.svg`;
				rot3Img.src = `/Textures/Icons/${IdToString[
					tile
				]?.toLowerCase()}.svg`;
				rot4Img.src = `/Textures/Icons/${IdToString[
					tile
				]?.toLowerCase()}.svg`;

				containerElm.appendChild(rot1Elm);
				containerElm.appendChild(rot2Elm);
				containerElm.appendChild(rot3Elm);
				containerElm.appendChild(rot4Elm);

				row.appendChild(containerElm);
			} else {
				const tileElm = document.createElement('button');
				tileElm.classList.add('widget');
				tileElm.title = `${IdToString[tile]} (${tile})`;

				const img = document.createElement('img');
				img.src = `/Textures/Icons/${IdToString[
					tile
				]?.toLowerCase()}.svg`;

				if (mask[tile - 1].isAccessible) {
					img.classList.add('accessible');
				}

				tileElm.appendChild(img);

				tileElm.dataset.rotation1For = `${tile}`;
				tileElm.dataset.rotation2For = `${tile}`;
				tileElm.dataset.rotation3For = `${tile}`;
				tileElm.dataset.rotation4For = `${tile}`;

				tileElm.addEventListener('click', () => {
					const tool = getTool();

					setTool({
						id: tile,
						rotation: tool.rotation,
					});
					updateSidebar(getTool());
				});

				row.appendChild(tileElm);
			}
		}

		sidebar.appendChild(row);
	}

	return {
		destroy() {
			for (const child of sidebar.children) {
				child.remove();
			}
			keyDownHandlers.pop();
		},
	};
}

export function updateSidebar(tool: Selection) {
	for (const selected of document.querySelectorAll('.selected-button')) {
		selected.classList.remove('selected-button');
	}

	if (tool.rotation == 1) {
		document
			.querySelector(`[data-rotation1-for="${tool.id}"]`)
			?.classList.add('selected-button');
	} else if (tool.rotation == 2) {
		document
			.querySelector(`[data-rotation2-for="${tool.id}"]`)
			?.classList.add('selected-button');
	} else if (tool.rotation == 3) {
		document
			.querySelector(`[data-rotation3-for="${tool.id}"]`)
			?.classList.add('selected-button');
	} else if (tool.rotation == 4) {
		document
			.querySelector(`[data-rotation4-for="${tool.id}"]`)
			?.classList.add('selected-button');
	}
}
