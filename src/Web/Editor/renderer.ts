import { IdToString, mask, TileType } from '../../SaveCodes/tiles';
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
	'/textures/fg/costume2.svg': [-0.25, 0.25],
	'/textures/bg/costume2.svg': [-0.25, 0.25],
	'/textures/icons/costume2.svg': [-0.25, 0.25],
	'/textures/fg/costume3.svg': [0.25, 0.25],
	'/textures/bg/costume3.svg': [0.25, 0.25],
	'/textures/icons/costume3.svg': [0.25, 0.25],
	'/textures/bg/spring2.svg': [0, 0.26],
};

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
}) {
	const img = lazyload(src);

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

		//if (superPain) {
		//	ctx.fillStyle = 'lime';
		//	ctx.fillRect(
		//		Math.round(screenSpacePos[0] - screenSpaceSize[0] / 2),
		//		Math.round(screenSpacePos[1] - screenSpaceSize[1] / 2),
		//		Math.round(screenSpaceSize[0]),
		//		Math.round(screenSpaceSize[1])
		//	);
		//} else {
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
		//}

		// draw a small piece of text saying the texture name for debugging
		//ctx.fillStyle = 'black';
		//ctx.font = '10px monospace';
		//ctx.textAlign = 'center';
		//if (!src.includes("BG"))
		//	ctx.fillText(src.split("/").at(-1)!, screenSpacePos[0] + screenSpaceSize[0] / 2 + 10, screenSpacePos[1] + screenSpaceSize[1] / 2 + 10);

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
