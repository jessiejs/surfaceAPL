import {
	IdToString,
	TileType,
	getBehaviour,
	rotatables,
} from '../../SaveCodes/tiles';
import { keyDownHandlers, keyUpHandlers } from '../IO/keyhandlers';
import { createSidebar, updateSidebar } from './sidebar';
import {
	transformCameraCoordinatesToWorldCoordinates,
	transformWorldCoordinatesToCameraCoordinates,
} from './coordinates';
import { createDebugger } from './debugger';
import { lazyload } from '../Lazyboy/lazyload';
import { TileRenderData, drawTile, frameInfo, getRenderData, renderTile } from './renderer';
import {
	Level,
	encodeLevel,
	mainLevelCodeToOpenCode,
} from '../../SaveCodes/saveload';
import {
	indexToStandardCoords,
	standardCoordsToIndex,
} from '../../SaveCodes/coords';
import copy from '../IO/copy';
import about from './about';
import { showExportDialog } from './export';
import prompt from '../IO/prompt';
import { propertyPickerStyle } from '../config';
import { SettingsManager, settings, showSettingsWindow } from '../Settings/settings';
import { createStarfloat } from './floatbar';

export interface Editor {
	tick(deltatime: number): Promise<void>;

	destroy(): void;
}

export type Selection = {
	id: number;
	rotation: number;
};

export interface Camera {
	zoom: number;
	pos: [number, number];
	resolution: [number, number];
}

export function createEditor(level: Level): Editor {
	let tool: Selection = {
		id: TileType.Green1111,
		rotation: 1,
	};

	// get the sidebar
	const sidebar = document.querySelector('aside')!;

	// add the rows
	const sidebarResult = createSidebar(
		level,
		sidebar,
		() => tool,
		newT => {
			tool = newT;
		}
	);

	// aquire the canvas
	const canvas = document.querySelector('canvas')!;
	const ctx = canvas.getContext('2d', { alpha: false })!;

	let time = 0;

	let coreCamera: Camera = {
		zoom: 1.8,
		pos: [0, (level.height - 2) * 62],
		resolution: [canvas.width, canvas.height],
	};

	let smoothCamera: Camera = {
		zoom: 1,
		pos: [0, 0],
		resolution: [canvas.width, canvas.height],
	};

	let mousePos = [0, 0];
	let isMouseDown = false;
	let parralaxSmoothMousePos = [0, 0];
	let keysDown: string[] = [];
	let solidFPSTime = 0;

	settings.bind<'classic' | 'batch'>('propertyPicker.style', (value) => {
		if (value == 'batch') {
			if (tool.id == TileType.PropertyEdit) {
				tool.id = TileType.PropertyGrab;
			}
		}
	})

	updateSidebar(tool);

	function mouseMoveEventHandler(event: MouseEvent) {
		// set the position to the mouse position relative to the canvas
		mousePos = [
			event.clientX - canvas.getBoundingClientRect().left,
			event.clientY - canvas.getBoundingClientRect().top,
		];
	}

	let deathProgress = 0;
	let deathKeys = ['KeyD','KeyI','KeyE'];

	function keyDownEventHandler(event: KeyboardEvent) {
		if (!keysDown.includes(event.code)) {
			keysDown.push(event.code);
		}
		if (deathKeys[deathProgress] == event.code) {
			deathProgress++;
		} else {
			deathProgress = 0;
		}
	}

	function keyUpEventHandler(event: KeyboardEvent) {
		keysDown = keysDown.filter(key => key !== event.code);
	}

	let selectedIndex = 0;
	let behaviour = getBehaviour(tool.id, tool.rotation);
	let useEmpty = false;

	canvas.addEventListener('mousemove', mouseMoveEventHandler);
	canvas.addEventListener('mousedown', () => {
		isMouseDown = true;
		if (selectedIndex != -1) {
			useEmpty = level.tiles[selectedIndex].id == behaviour.placingID;
		} else {
			useEmpty = false;
		}
	});
	canvas.addEventListener('mouseup', () => {
		isMouseDown = false;
	});
	window.addEventListener('wheel', (ev) => {
		if (ev.deltaY < 0) {
			coreCamera.zoom *= 1.3;
			if (coreCamera.zoom > 3) {
				coreCamera.zoom = 3;
			}
		} else {
			coreCamera.zoom /= 1.3;
			if (coreCamera.zoom < 0.1) {
				coreCamera.zoom = 0.1;
			}
		}
	});
	keyDownHandlers.at(-1)!.push(keyDownEventHandler);
	keyUpHandlers.at(-1)!.push(keyUpEventHandler);

	const img = lazyload();

	let disableHueRendering = false;
	let dualRendering = false;
	let selectionCenterX = 0;
	let selectionCenterY = 0;
	let selectionWidth = 0;
	let selectionHeight = 0;

	const exportButton = document.createElement('a');
	exportButton.href = '#export';
	exportButton.addEventListener('click', async () => {
		showExportDialog(level);
	});
	settings.bind<string>('loca.export',(value) => {
		exportButton.textContent = value;
	});

	const settingsButton = document.createElement('a');
	settingsButton.href = '#settings';
	settingsButton.addEventListener('click', () => {
		showSettingsWindow({
			showFlags: keysDown.includes('KeyF')
		});
	});
	settings.bind<string>('loca.settings',(value) => {
		settingsButton.textContent = value;
	});

	const aboutButton = document.createElement('a');
	aboutButton.href = '#about';
	aboutButton.addEventListener('click', () => {
		about();
	});
	settings.bind<string>('loca.about',(value) => {
		aboutButton.textContent = value;
	})

	const docsButton = document.createElement('a');
	docsButton.href = 'https://surfaceapl.notion.site/surfaceAPL-Docs-83062a2665c34e30a223959b67e61275?pvs=4';
	settings.bind<string>('loca.docs',(value) => {
		docsButton.textContent = value;
	})

	document.querySelector('nav')!.appendChild(exportButton);
	document.querySelector('nav')!.appendChild(settingsButton);
	document.querySelector('nav')!.appendChild(aboutButton);
	document.querySelector('nav')!.appendChild(docsButton);

	let data: string = '';
	let lastNonTemporaryID = -1;

	const recoveryTimer = setInterval(() => {
		settings.setPref('recovery.level', mainLevelCodeToOpenCode(encodeLevel(level, {
			compress: true,
			makeNonEditableByJS: false
		})));
	}, 5000);

	const { visible: starVisible } = createStarfloat(level);

	return {
		async tick(deltaTime: number) {
			behaviour = getBehaviour(tool.id, tool.rotation);

			// intentional crash
			if (deathProgress == 3) {
				throw new Error(`Pressing D, I, E crashes (intentional)`);
			}

			// floatbars
			starVisible(behaviour.editStyle == 'starzone');

			// rendering
			frameInfo.visibleTiles = 0;

			// size the canvas
			canvas.width = canvas.getBoundingClientRect().width;
			canvas.height = canvas.getBoundingClientRect().height;

			// update camera sizes
			coreCamera.resolution = [canvas.width, canvas.height];
			smoothCamera.resolution = [canvas.width, canvas.height];

			// update parralax mouse position
			parralaxSmoothMousePos[0] +=
				(mousePos[0] - parralaxSmoothMousePos[0]) * deltaTime * 2;
			parralaxSmoothMousePos[1] +=
				(mousePos[1] - parralaxSmoothMousePos[1]) * deltaTime * 2;

			// update the camera
			smoothCamera.pos[0] +=
				(coreCamera.pos[0] - smoothCamera.pos[0]) * deltaTime * 5;
			smoothCamera.pos[1] +=
				(coreCamera.pos[1] - smoothCamera.pos[1]) * deltaTime * 5;
			smoothCamera.zoom +=
				(coreCamera.zoom - smoothCamera.zoom) * deltaTime * 5;

			// move the camera with arrow keys
			let speed = settings.getNumber<number>('camera.speed');
			if (settings.getBoolean("camera.scaledMotion")) {
				speed /= smoothCamera.zoom;
			}
			if (keysDown.includes('ArrowLeft') || keysDown.includes('KeyA')) {
				coreCamera.pos[0] -= deltaTime * speed;
			}
			if (keysDown.includes('ArrowRight') || keysDown.includes('KeyD')) {
				coreCamera.pos[0] += deltaTime * speed;
			}
			if (keysDown.includes('ArrowUp') || keysDown.includes('KeyW')) {
				coreCamera.pos[1] -= deltaTime * speed;
			}
			if (keysDown.includes('ArrowDown') || keysDown.includes('KeyS')) {
				coreCamera.pos[1] += deltaTime * speed;
			}
			if (keysDown.includes('KeyQ')) {
				coreCamera.zoom -= 0.1;
				if (coreCamera.zoom < 0.5) {
					coreCamera.zoom = 0.5;
				}
			}
			if (keysDown.includes('KeyE')) {
				coreCamera.zoom += 0.1;
				if (coreCamera.zoom > 3) {
					coreCamera.zoom = 3;
				}
			}

			// fill the canvas with a nice clean light blue
			ctx.fillStyle = 'white';
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			ctx.fillStyle = 'rgba(64,128,255,0.3)';
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// debugger
			const dbg = createDebugger(ctx);

			// draw a square
			ctx.fillStyle = 'black';
			ctx.fillRect(
				transformWorldCoordinatesToCameraCoordinates(
					[0, 0],
					smoothCamera
				)[0] -
					25 * smoothCamera.zoom,
				transformWorldCoordinatesToCameraCoordinates(
					[0, 0],
					smoothCamera
				)[1] -
					25 * smoothCamera.zoom,
				50 * smoothCamera.zoom,
				50 * smoothCamera.zoom
			);

			// pixelate
			ctx.imageSmoothingEnabled = false;

			// draw the player
			const playerSize = 0.6;
			const playerImg = img(`/Textures/Player/Main.png`);

			const playerOffset = [
				(coreCamera.pos[0] - smoothCamera.pos[0]) * smoothCamera.zoom,
				(coreCamera.pos[1] - smoothCamera.pos[1]) * smoothCamera.zoom,
			];

			if (playerImg) {
				ctx.drawImage(
					playerImg,
					(canvas.width -
						playerImg.width * smoothCamera.zoom * playerSize) /
						2 +
						playerOffset[0],
					(canvas.height -
						playerImg.height * smoothCamera.zoom * playerSize) /
						2 +
						playerOffset[1],
					playerImg.width * smoothCamera.zoom * playerSize,
					playerImg.height * smoothCamera.zoom * playerSize
				);
			}

			// draw all textures
			//for (let i = 0; i < level.tiles.length; i++) {
			//	if (level.tiles[i].id >= 2 && dualRendering)
			//		drawTile({
			//			cam: smoothCamera,
			//			src: `/Textures/BG/${IdToString[
			//				level.tiles[i].id
			//			].toLowerCase()}.svg`,
			//			pos: indexToStandardCoords(
			//				i,
			//				level.width,
			//				level.height
			//			),
			//			rotationInAppelDegrees: level.tiles[i].rotation,
			//			ctx,
			//			lazyload: img,
			//			hue: level.hue2,
			//			id: level.tiles[i].id,
			//			drawImg: true,
			//			time
			//		});
			//}

			//for (let i = 0; i < level.tiles.length; i++) {
			//	if (level.tiles[i].id >= 2)
			//		drawTile({
			//			cam: smoothCamera,
			//			src: `/Textures/${
			//				dualRendering ? 'FG' : 'Icons'
			//			}/${IdToString[level.tiles[i].id].toLowerCase()}.svg`,
			//			pos: indexToStandardCoords(
			//				i,
			//				level.width,
			//				level.height
			//			),
			//			rotationInAppelDegrees: level.tiles[i].rotation,
			//			ctx,
			//			lazyload: img,
			//			hue: level.hue,
			//			id: level.tiles[i].id,
			//			superPain: disableHueRendering,
			//			drawImg: true,
			//			time
			//		});
			//}

			// New rendering code using non-deprecated API's
			const renderData:TileRenderData[] = new Array(level.tiles.length);

			for (let i = 0; i < level.tiles.length; i++) {
				renderData[i] = getRenderData({
					cam: smoothCamera,
					time,
					lazyloader: img,
					index: i,
					level,
					canvasWidth: canvas.width,
					canvasHeight: canvas.height
				})
			}

			// Draw the background layer
			for (let i = 0; i < level.tiles.length; i++) {
				renderTile("background", renderData[i], ctx);
			}

			// Draw the foreground layer
			for (let i = 0; i < level.tiles.length; i++) {
				renderTile("foreground", renderData[i], ctx);
			}

			// draw the stencil
			const stencilImg = img(`/Textures/Player/Stencil.png`);

			ctx.globalAlpha = 0.2;

			if (stencilImg) {
				ctx.drawImage(
					stencilImg,
					(canvas.width -
						stencilImg.width * smoothCamera.zoom * playerSize) /
						2 +
						playerOffset[0],
					(canvas.height -
						stencilImg.height * smoothCamera.zoom * playerSize) /
						2 +
						playerOffset[1],
					stencilImg.width * smoothCamera.zoom * playerSize,
					stencilImg.height * smoothCamera.zoom * playerSize
				);
			}

			ctx.globalAlpha = 1;

			for (let i = 0; i < level.tiles.length; i++) {
				if (level.tiles[i].id >= 2)
					drawTile({
						cam: smoothCamera,
						src: `/Textures/${
							dualRendering ? 'FG' : 'Icons'
						}/${IdToString[level.tiles[i].id].toLowerCase()}.svg`,
						pos: indexToStandardCoords(
							i,
							level.width,
							level.height
						),
						rotationInAppelDegrees: level.tiles[i].rotation,
						ctx,
						lazyload: img,
						hue: level.hue,
						id: level.tiles[i].id,
						superPain: disableHueRendering,
						data: level.tiles[i].data,
						drawImg: false,
						time
					}); //TODO: FIXME, we shouldn't use drawTile for drawing the data bubble, that's just fucking stupid
			}

			// update the selection
			const mousePosInWorldCoords =
				transformCameraCoordinatesToWorldCoordinates(
					mousePos as [number, number],
					smoothCamera
				);

			selectedIndex = -1;
			if (
				mousePosInWorldCoords[0] > 0 &&
				mousePosInWorldCoords[1] > 0 &&
				mousePosInWorldCoords[0] < (level.width + 1) * 62 &&
				mousePosInWorldCoords[1] < (level.height + 1) * 62
			) {
				selectedIndex = Math.round(standardCoordsToIndex(
					[
						Math.round((mousePosInWorldCoords[0] - 31) / 62),
						Math.round((mousePosInWorldCoords[1] - 31) / 62),
					],
					level.width,
					level.height
				));
			}

			// place
			if (isMouseDown && behaviour.editStyle == 'tiles') {
				if (useEmpty) {
					if (selectedIndex != -1) {
						level.tiles[selectedIndex].id = TileType.Blank;
						level.tiles[selectedIndex].rotation = 0;
					}
				} else {
					if (selectedIndex != -1) {
						level.tiles[selectedIndex].id = behaviour.placingID;
						if (rotatables.includes(behaviour.placingID)) {
							level.tiles[selectedIndex].rotation =
								behaviour.placingRotation;
						} else {
							level.tiles[selectedIndex].rotation = 1;
						}
					}
				}
			}

			// data dropper
			if (isMouseDown && behaviour.editStyle == 'property.grab') {
				if (selectedIndex != -1) {
					data = level.tiles[selectedIndex].data;
				}
			}
			if (isMouseDown && behaviour.editStyle == 'property.drop') {
				if (selectedIndex != -1) {
					level.tiles[selectedIndex].data = data;
				}
			}
			if (behaviour.editStyle == 'property.edit') {
				if (propertyPickerStyle == "batch") {
					data = await prompt('Edit data', 'x10y10', {
						defaultValue: data,
						validateFunction() {
							return undefined;
						}
					});
				} else if (isMouseDown) {
					data = level.tiles[selectedIndex].data;
					data = await prompt('Edit data', 'x10y10', {
						defaultValue: data,
						validateFunction() {
							return undefined;
						}
					});
					level.tiles[selectedIndex].data = data;
					isMouseDown = false;
				}
			}
			if (behaviour.editStyle == 'settings') {
				showSettingsWindow({
					showFlags: keysDown.includes('KeyF')
				});
			}

			// temp magic
			let isTemporary = false;
			if (behaviour.editStyle == 'property.edit' && propertyPickerStyle == 'batch') 
				isTemporary = true;
			if (behaviour.editStyle == 'settings') 
				isTemporary = true;

			if (isTemporary) {
				tool.id = lastNonTemporaryID;
				updateSidebar(tool);
			} else {
				lastNonTemporaryID = tool.id;
			}

			let targetSelectionWidth = 50;
			let targetSelectionHeight = 50;
			let targetSelectionCenterX = mousePosInWorldCoords[0];
			let targetSelectionCenterY = mousePosInWorldCoords[1];

			if (selectedIndex >= 0) {
				targetSelectionWidth = 80;
				targetSelectionHeight = 80;
				targetSelectionCenterX =
					indexToStandardCoords(
						selectedIndex,
						level.width,
						level.height
					)[0] *
						62 +
					31;
				targetSelectionCenterY =
					indexToStandardCoords(
						selectedIndex,
						level.width,
						level.height
					)[1] *
						62 +
					31;
			}

			if (isMouseDown) {
				targetSelectionWidth *= 0.9;
				targetSelectionHeight *= 0.9;
			}

			// animate
			selectionCenterX +=
				(targetSelectionCenterX - selectionCenterX) * deltaTime * 25;
			selectionCenterY +=
				(targetSelectionCenterY - selectionCenterY) * deltaTime * 25;
			selectionWidth +=
				(targetSelectionWidth - selectionWidth) * deltaTime * 25;
			selectionHeight +=
				(targetSelectionHeight - selectionHeight) * deltaTime * 25;

			// draw the little rectangle to show selection
			ctx.strokeStyle = 'rgb(255,192,0)';
			let width = 4 * smoothCamera.zoom;
			let cornerRadius = 5 * smoothCamera.zoom;
			width -= (width - 2) * 0.2;
			cornerRadius -= (cornerRadius - 2) * 0.2;
			ctx.lineWidth = width;
			const topLeft = transformWorldCoordinatesToCameraCoordinates(
				[
					selectionCenterX - selectionWidth / 2,
					selectionCenterY - selectionHeight / 2,
				],
				smoothCamera
			);
			const bottomRight = transformWorldCoordinatesToCameraCoordinates(
				[
					selectionCenterX + selectionWidth / 2,
					selectionCenterY + selectionHeight / 2,
				],
				smoothCamera
			);
			ctx.beginPath();
			ctx.roundRect(
				topLeft[0],
				topLeft[1],
				bottomRight[0] - topLeft[0],
				bottomRight[1] - topLeft[1],
				cornerRadius
			);
			ctx.stroke();

			// debug

			if (Math.round(1 / deltaTime) >= 60) {
				solidFPSTime += deltaTime / 5;
				if (solidFPSTime > 1) {
					solidFPSTime = 1;
				}
			} else {
				solidFPSTime -= deltaTime;
				if (solidFPSTime < 0) {
					solidFPSTime = 0;
				}
			}

			dbg(`${Math.round(1 / deltaTime)} FPS`);
			if (keysDown.includes('KeyX')) {
				dbg.removeGap();
				dbg(`${Math.round(deltaTime * 1000)}ms`);
				dbg.title(`Camera Info`);
				if (keysDown.includes('KeyZ')) {
					dbg(`Camera:`);
					dbg.json(coreCamera);
					dbg(`SCamera:`);
					dbg.json(smoothCamera);
				} else {
					dbg(`Camera: ${JSON.stringify(coreCamera.pos)}`);
					dbg(`SCamera: ${JSON.stringify(smoothCamera.pos)}`);
				}
				dbg.title(`Behaviour Info`);
				dbg(`Behaviour:`);
				dbg.json(behaviour);
				dbg.title(`Lazyboy`);
				dbg(`${img.loading} Loading`);
				dbg(`${img.loaded} Loaded`);
				dbg(`${img.failed} Failed`);
				dbg.title(`Mouse`);
				dbg(`Pos: ${JSON.stringify(mousePos)}`);
				dbg(`IsMouseDown: ${isMouseDown}`);
				dbg.title(`Rendering`);
				dbg(`${frameInfo.visibleTiles} Visible`);
			}

			const tileLimit = 125;
			const isChromiumBased = window.navigator.userAgent
				.toLowerCase()
				.includes('chrome');

			if (disableHueRendering) {
				dbg.removeGap();
				dbg(
					`Hue rendering is disabled${
						isChromiumBased
							? '\nThis is because it is very slow in your browser'
							: ''
					}`
				);
			}

			if (!dualRendering) {
				dbg.removeGap();
				dbg(`Dual-rendering is disabled`);
			}

			if (behaviour.editStyle.startsWith("property.") && data != '') {
				dbg.title(`Property Picker`);
				dbg(`Data: ${data}`);
			}

			const superpainTileLimit = 100;

			if (!dualRendering) {
				dualRendering = frameInfo.visibleTiles <= tileLimit;
			} else {
				dualRendering = frameInfo.visibleTiles <= tileLimit * 2;
			}

			if (disableHueRendering) {
				disableHueRendering =
					frameInfo.visibleTiles > superpainTileLimit;
			} else {
				disableHueRendering =
					frameInfo.visibleTiles > superpainTileLimit * 2;
			}

			//if (isChromiumBased) {
			//	disableHueRendering = true;
			//}

			disableHueRendering = true;

			time += deltaTime;
		},
		destroy() {
			sidebarResult.destroy();
			canvas.removeEventListener('mousemove', mouseMoveEventHandler);
			canvas.removeEventListener('keydown', keyDownEventHandler);
			canvas.removeEventListener('keyup', keyUpEventHandler);
			exportButton.remove();
			aboutButton.remove();
			settingsButton.remove();
			docsButton.remove();
			clearInterval(recoveryTimer);
		},
	};
}
