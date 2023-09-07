import { indexToStandardCoords } from '../../SaveCodes/coords';
import { Level, Tile } from '../../SaveCodes/saveload';
import { IdToString, mask, TileType } from '../../SaveCodes/tiles';
import { settings } from '../Settings/settings';
import { transformWorldCoordinatesToCameraCoordinates } from './coordinates';
import { Camera } from './editor';
import transforms from './RenderData/transforms.json';

export const frameInfo = {
	visibleTiles: 0,
};

const textureOffsets = {
	'/textures/fg/spike2.svg': [0, 0.3],
	'/textures/bg/spike2.svg': [0, 0.3],
	'/textures/icons/spike2.svg': [0, 0.3],
	'/textures/fg/green0101.svg': [0, 0.22],
	'/textures/fg/crumble00118.svg': [0, -0.25],
	'/textures/icons/crumble00118.svg': [0, -0.25],
	'/textures/icons/green1100.svg': [0, 0.25],
	'/textures/bg/checkpoint9.svg': [0, 0.1],
	'/textures/icons/checkpoint9.svg': [0, 0.1],
	'/textures/icons/moba.svg': [0, 0.25],
	'/textures/fg/moba.svg': [0, 0.25],
	'/textures/fg/worma2.svg': [0, 0.25],
	'/textures/icons/worma2.svg': [0, 0.25],
	'/textures/fg/worma.svg': [0, 0.25],
	'/textures/icons/worma.svg': [0, 0.25],
	'/textures/fg/costume2.svg': [-0.25, 0.25],
	'/textures/bg/costume2.svg': [-0.25, 0.25],
	'/textures/icons/costume2.svg': [-0.25, 0.25],
	'/textures/fg/costume3.svg': [0.25, 0.25],
	'/textures/bg/costume3.svg': [0.25, 0.25],
	'/textures/icons/costume3.svg': [0.25, 0.25],
	'/textures/bg/spring2.svg': [0, 0.26],
	'/textures/fg/crumble0010.svg': [-0.25, -0.25],
	'/textures/icons/crumble0010.svg': [-0.25, -0.25],
	'/textures/fg/lift2x2.svg': [0,-0.25],
	'/textures/bg/lift2x2.svg': [0,-0.25],
	'/textures/icons/lift2x2.svg': [0,-0.25],
	'/textures/fg/lift2x3.svg': [0,-0.25],
	'/textures/bg/lift2x3.svg': [0,-0.25],
	'/textures/icons/lift2x3.svg': [0,-0.25],
	'/textures/fg/lock02.svg': [-0.25, 0],
	'/textures/bg/lock02.svg': [-0.25, 0],
	'/textures/icons/lock02.svg': [-0.25, 0],
	'/textures/fg/burtha.svg': [0.5,-0.5],
	'/textures/icons/burtha.svg': [0.5,-0.5]
};

//TODO: SEE BELOW
// FIXME: This, is quite possibly the worst sin i've ever committed
//        this code is so shit, it makes me want to cry
//        fixing this function would fix world hunger, death, and most of all, my sanity
/**
 * @deprecated
*/
export function drawTile({
	ctx,
	src,
	pos,
	cam,
	lazyload,
	rotationInAppelDegrees,
	hue,
	id,
	superPain,
	data,
	drawImg,
	time
}: {
	ctx: CanvasRenderingContext2D;
	src: string;
	pos: [number, number];
	cam: Camera;
	lazyload: (src: string) => HTMLImageElement | undefined;
	rotationInAppelDegrees: number;
	hue: number;
	id: number;
	superPain?: boolean;
	data?: string;
	drawImg: boolean;
	time: number
}) {
	let img = lazyload(src);

	if (settings.getBoolean('ff.ANIMATED_FLAGS')) {
		if (id == TileType.Checkpoint2 || id == TileType.End1) {
			let newId = id;
			newId += Math.abs((Math.floor(time * 5) % 8) - 3); // ew, but it's technically correct
			img = lazyload(`/Textures/BG/${IdToString[newId].toLowerCase()}.svg`);
		}
	}

	if (img) {
		const realRotation = (rotationInAppelDegrees - 1) * 90;

		const multipliedPos: [number, number] = [
			pos[0] * 62 + 31,
			pos[1] * 62 + 31,
		];

		const imgSize = [img.width, img.height];

		const screenSpacePos = [
			transformWorldCoordinatesToCameraCoordinates(multipliedPos, cam)[0],
			transformWorldCoordinatesToCameraCoordinates(multipliedPos, cam)[1],
		];

		const screenSpaceSize = [
			(imgSize[0] * cam.zoom * 62) / 60,
			(imgSize[1] * cam.zoom * 62) / 60,
		];

		if (
			screenSpacePos[0] + screenSpaceSize[0] / 2 < 0 ||
			screenSpacePos[1] + screenSpaceSize[1] / 2 < 0 ||
			screenSpacePos[0] - screenSpaceSize[0] / 2 > cam.resolution[0] ||
			screenSpacePos[1] - screenSpaceSize[1] / 2 > cam.resolution[1]
		) {
			return;
		}

		const radians = (realRotation * Math.PI) / 180;

		if (mask[id - 1].doHue) {
			// hue shift
			ctx.filter = `hue-rotate(${Math.round((hue / 200) * 360)}deg)`;
		} else {
			ctx.filter = 'none';
		}

		if (superPain) ctx.filter = 'none';

		const offset = (
			textureOffsets as unknown as Record<
				string,
				[number, number] | undefined
			>
		)[src.toLowerCase()] ?? [0, 0];

		if (drawImg) {
			ctx.save();
			ctx.translate(screenSpacePos[0], screenSpacePos[1]);
			ctx.rotate(radians);
			ctx.drawImage(
				img,
				-screenSpaceSize[0] / 2 + offset[0] * 62 * cam.zoom,
				-screenSpaceSize[1] / 2 + offset[1] * 62 * cam.zoom,
				screenSpaceSize[0],
				screenSpaceSize[1]
			);
			ctx.restore();
		}

		frameInfo.visibleTiles++;

		ctx.filter = 'none';

		if (data) {
			const text = `${data}`;
			// draw a small little info bubble above the tile
			const doRounding = false;
			const size = (doRounding ? Math.round : ($: number) => $)(
				12 * cam.zoom
			); // it gets rounded anyways, so its better to explicitly do it so we at least lay out correctly
			ctx.font = 'bold ' + size + 'px monospace';
			const textWidth = ctx.measureText(text).width;
			const upDownPadding = 12 * cam.zoom;
			const leftRightPadding = 14 * cam.zoom;
			const bubbleWidth = textWidth + leftRightPadding;
			const bubbleHeight = size + upDownPadding;
			const cornerRadius = 5 * cam.zoom;
			const bubbleCenterX = screenSpacePos[0];
			const bubbleCenterY =
				screenSpacePos[1] -
				screenSpaceSize[1] / 2 -
				bubbleHeight / 2 -
				10 * cam.zoom;

			ctx.fillStyle = 'white';
			ctx.beginPath();
			ctx.roundRect(
				bubbleCenterX - bubbleWidth / 2,
				bubbleCenterY - bubbleHeight / 2,
				bubbleWidth,
				bubbleHeight,
				cornerRadius
			);
			ctx.fill();

			// draw a tiny arrow below the bubble
			const arrowUnits = 5 * cam.zoom;
			ctx.beginPath();
			ctx.moveTo(
				bubbleCenterX - arrowUnits,
				bubbleCenterY + bubbleHeight / 2
			);
			ctx.lineTo(
				bubbleCenterX + arrowUnits,
				bubbleCenterY + bubbleHeight / 2
			);
			ctx.lineTo(
				bubbleCenterX,
				bubbleCenterY + bubbleHeight / 2 + arrowUnits
			);
			ctx.fill();

			ctx.fillStyle = 'black';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(text, bubbleCenterX, bubbleCenterY);
		}
	}
}

export type TileRenderData = undefined | {
	center: [number, number];
	size: [number, number];
	rotationRadians: number;
	rotationDegrees: number;
	foregroundImage: HTMLImageElement;
	backgroundImage: HTMLImageElement;
	foregroundImageSize: [number, number];
	backgroundImageSize: [number, number];
	renderingDebugText: string | undefined
};

export function isTileAnimated(tile:Tile) {
	return tile.id == TileType.Checkpoint2 || tile.id == TileType.End1;
}

const sizeCache: Record<string, [number, number]> = {};

export function getRenderData({
	cam,
	time,
	lazyloader,
	index,
	level,
	canvasWidth,
	canvasHeight
}: {
	cam: Camera;
	time: number;
	lazyloader: (src: string) => HTMLImageElement | undefined;
	index: number;
	level: Level;
	canvasWidth: number;
	canvasHeight: number;
}):TileRenderData {
	let renderingDebugText: string | undefined;

	// Get arguments that we don't want to be exposed publically
	const tile = level.tiles[index];

	// Do not even *attempt* to waste performance on air
	if (tile.id == TileType.Blank) {
		return undefined;
	}

	// Step 1: Calculate src
	let foregroundSrc = '';
	let backgroundSrc = '';

	if (isTileAnimated(tile)) {
		// 1.A: Animated, pick a new id
		let id = tile.id;
		id += Math.abs((Math.floor(time * 5) % 8) - 3); // Stolen straight from Appel :D
		foregroundSrc = `/Textures/BG/${IdToString[id].toLowerCase()}.svg`;
		backgroundSrc = `/Textures/FG/${IdToString[id].toLowerCase()}.svg`;
	} else {
		// 1.B: Static
		foregroundSrc = `/Textures/FG/${IdToString[tile.id].toLowerCase()}.svg`;
		backgroundSrc = `/Textures/BG/${IdToString[tile.id].toLowerCase()}.svg`;
	}

	// Step 1.5: Mostly unnecessary, but it helps with performance a lot
	//           If the image is not onscreen, DO NOT EVEN ATTEMPT TO LOAD
	const tileCoords = indexToStandardCoords(index, level.width, level.height);
	const topLeftCornerUniversal = transformWorldCoordinatesToCameraCoordinates([
		tileCoords[0] * 62,
		tileCoords[1] * 62,
	], cam);

	if (topLeftCornerUniversal[0] < -62 * cam.zoom || topLeftCornerUniversal[1] < -62 * cam.zoom || topLeftCornerUniversal[0] > canvasWidth || topLeftCornerUniversal[1] > canvasHeight) {
		return undefined;
	}

	// Step 2: Load images
	const foregroundImage = lazyloader(foregroundSrc);
	const backgroundImage = lazyloader(backgroundSrc);

	// 2.A: Early return if not loaded
	if (!foregroundImage || !backgroundImage) {
		return undefined;
	}

	// Step 3: Perform calculations

	// 3.A: Calculate world coordinates in tile space
	// Moved to step 1.5

	// 3.B: Calculate world coordinates in pixels
	const offset = (textureOffsets as unknown as Record<string, [number, number]>)[foregroundSrc.toLowerCase()];
	let worldCoords:[number, number] = [
		(tileCoords[0] + 0.5 + (offset || [0,0])[0]) * 62,
		(tileCoords[1] + 0.5 + (offset || [0,0])[1]) * 62,
	];

	// 3.C: Calculate screen space coordinates
	const screenSpacePosition = transformWorldCoordinatesToCameraCoordinates(
		worldCoords,
		cam
	);

	// 3.D: Calculate screen space size
	const foregroundImageSize = sizeCache[foregroundSrc] || (sizeCache[foregroundSrc] = [foregroundImage.width, foregroundImage.height]);
	const backgroundImageSize = sizeCache[backgroundSrc] || (sizeCache[backgroundSrc] = [backgroundImage.width, backgroundImage.height]);

	const appelScalingFactor = 62 / 60;

	const foregroundImageSizeCamera:[number, number] = [
		foregroundImageSize[0] * cam.zoom * appelScalingFactor,
		foregroundImageSize[1] * cam.zoom * appelScalingFactor,
	];

	const backgroundImageSizeCamera:[number, number] = [
		backgroundImageSize[0] * cam.zoom * appelScalingFactor,
		backgroundImageSize[1] * cam.zoom * appelScalingFactor,
	]

	// Step 4: Rotation calculations
	const appelRotation = tile.rotation;
	const realRotationDegrees = (appelRotation - 1) * 90;
	const realRotationRadians = (realRotationDegrees * Math.PI) / 180;

	// Step 5: Return
	return {
		center: screenSpacePosition,
		size: foregroundImageSizeCamera,
		rotationRadians: realRotationRadians,
		rotationDegrees: realRotationDegrees,
		foregroundImage,
		backgroundImage,
		foregroundImageSize: foregroundImageSizeCamera,
		backgroundImageSize: backgroundImageSizeCamera,
		renderingDebugText
	}
}

export function renderTile(pass:"background" | "foreground", renderData: TileRenderData, ctx: CanvasRenderingContext2D) {
	// Step 1: Check if we need to render
	if (!renderData) return;

	// Step 2: Get render data
	const center = renderData.center;
	const size = pass === "background" ? renderData.backgroundImageSize : renderData.foregroundImageSize;
	const image = pass === "background" ? renderData.backgroundImage : renderData.foregroundImage;

	// Step 3: Perform simple calculations
	const topLeftCorner = [
		center[0] - size[0] / 2,
		center[1] - size[1] / 2
	];

	// Step 4: Draw
	ctx.drawImage(image, topLeftCorner[0], topLeftCorner[1], size[0], size[1]);

	// Step 5: Debug
	if (pass === "foreground" && renderData.renderingDebugText) {
		ctx.font = "12px JetBrains Mono";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillStyle = "white";
		ctx.fillText(renderData.renderingDebugText, center[0], center[1]);
	}
}

export function renderBubble(text:string, renderData: TileRenderData, ctx: CanvasRenderingContext2D) {
	// Step 1: Check if we need to render
	if (!renderData) return;

	// Step 2: Calculate tip of the arrow
	const arrowTip = [
		renderData.center[0],
		renderData.center[1] - renderData.size[1] / 2 - 10
	];

	// Step 3: Calculate sizings
	// Config
	const textSize = 12;
	const textPaddingHoriz = 14;
	const textPaddingVert = 12;
	const cornerRadius = 4;
	const arrowSize = 20;

	// Calculations
	ctx.font = `${textSize}px JetBrains Mono`;

	const textWidth = ctx.measureText(text).width;
	const bubbleWidth = textWidth + textPaddingHoriz*2;
	const bubbleHeight = textSize + textPaddingVert*2;
	const bubbleCenterX = arrowTip[0];
	const bubbleCenterY = arrowTip[1] - arrowSize - bubbleHeight / 2;
	const arrowLeft = arrowTip[0] - arrowSize;
	const arrowRight = arrowTip[0] + arrowSize;
	const arrowBottom = arrowTip[1];
	const arrowTop = arrowTip[1] + arrowSize;

	// Step 4: Draw
	// 4.A: Rectangle
	ctx.fillStyle = 'black'; // Dark mode 😎

	ctx.beginPath();
	ctx.roundRect(
		bubbleCenterX - bubbleWidth / 2,
		bubbleCenterY - bubbleHeight / 2,
		bubbleWidth,
		bubbleHeight,
		cornerRadius
	);
	ctx.fill();

	// 4.B: Arrow
	ctx.beginPath();
	ctx.moveTo(arrowLeft, arrowTop);
	ctx.lineTo(arrowRight, arrowTop);
	ctx.lineTo(arrowTip[0], arrowBottom);
	ctx.fill();

	// 4.C: Text
	ctx.fillStyle = 'white'; // More dark mode 😎
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	ctx.fillText(text, bubbleCenterX, bubbleCenterY);
}
