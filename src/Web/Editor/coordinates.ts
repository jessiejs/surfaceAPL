import { Camera } from './editor';

/**
 * Transforms world coordinates to camera coordinates.
 *
 * @param pPos - The world position coordinates.
 * @param camera - The camera object containing zoom, pos, and resolution.
 * @returns The camera coordinates.
 */
export function transformWorldCoordinatesToCameraCoordinates(
	pPos: [number, number],
	camera: Camera
) {
	// Destructure the pPos array into worldX and worldY variables
	const [worldX, worldY] = pPos;

	// Destructure the camera object into zoom, pos, and resolution variables
	const { zoom, pos, resolution } = camera;

	// Destructure the resolution array into width and height variables
	const [width, height] = resolution;

	// Destructure the pos array into x and y variables
	const [x, y] = pos;

	// Calculate the center coordinates
	const centerX = x + width / 2;
	const centerY = y + height / 2;

	// Calculate the camera coordinates based on the world coordinates, center coordinates, zoom, and resolution
	const cameraX = (worldX - centerX) * zoom + width / 2;
	const cameraY = (worldY - centerY) * zoom + height / 2;

	// Return the camera coordinates
	return [cameraX, cameraY];
}

/**
 * Transforms camera coordinates to world coordinates.
 * @param pos - The coordinates to transform.
 * @param camera - The camera object containing the camera position.
 * @returns The transformed world coordinates.
 */
export function transformCameraCoordinatesToWorldCoordinates(
	cameraPos: [number, number],
	camera: Camera
) {
	// Destructure the cameraPos array into cameraX and cameraY variables
	const [cameraX, cameraY] = cameraPos;

	// Destructure the camera object into zoom, pos, and resolution variables
	const { zoom, pos, resolution } = camera;

	// Destructure the resolution array into width and height variables
	const [width, height] = resolution;

	// Destructure the pos array into x and y variables
	const [x, y] = pos;

	// Calculate the center coordinates
	const centerX = x + width / 2;
	const centerY = y + height / 2;

	// Calculate the world coordinates based on the camera coordinates, center coordinates, zoom, and resolution
	const worldX = (cameraX - width / 2) / zoom + centerX;
	const worldY = (cameraY - height / 2) / zoom + centerY;

	// Return the world coordinates
	return [worldX, worldY];
}
