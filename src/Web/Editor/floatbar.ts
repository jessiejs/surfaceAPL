import { Howl } from 'howler';
import { Level } from '../../SaveCodes/saveload';
import { click } from '../Effects/click';
import confirm from '../IO/confirm';
import { TileType } from '../../SaveCodes/tiles';
import { indexToStandardCoords, standardCoordsToIndex } from '../../SaveCodes/coords';
export function createFloatbar(title:string,icon:string) {
	// create the floatbar
	const floatbar = document.createElement('div');
	floatbar.classList.add('floatbar');
	floatbar.classList.add('hidden');
	
	// add the floatbar header
	const header = document.createElement('header');
	const iconImg = document.createElement('img');
	iconImg.src = icon;
	iconImg.alt = title;
	header.appendChild(iconImg);
	header.appendChild(document.createTextNode(title));
	floatbar.appendChild(header);

	// add the content
	const content = document.createElement('div');
	content.classList.add('content');
	floatbar.appendChild(content);

	// accent overlay
	const overlay = document.createElement('div');
	overlay.style.position = 'absolute';
	overlay.style.top = '0';
	overlay.style.left = '0';
	overlay.style.width = '100%';
	overlay.style.height = '100%';
	overlay.style.opacity = '0.05';
	overlay.style.pointerEvents = 'none';
	overlay.style.zIndex = '-1';
	overlay.style.transition = 'background 0.5s ease';
	content.appendChild(overlay);

	// body
	document.body.appendChild(floatbar);

	let pVisibility = false;

	return {
		floatbar,
		content,
		visible(v:boolean) {
			if (v) {
				floatbar.classList.remove('hidden');
			} else {
				floatbar.classList.add('hidden');
			}
			if (v != pVisibility) {
				pVisibility = v;
				if (v) {
					new Howl({
						src: '/SFX/float.wav'
					}).play();
				} else {
					new Howl({
						src: '/SFX/float-out.wav',
					}).play();
				}
			}
		},
		accent(color:string) {
			overlay.style.backgroundColor = color;
		}
	};
}

export function createStarfloat(level:Level) {
	const { floatbar, content, visible, accent } = createFloatbar('Starzone', '/Textures/Icons/starzone.svg');

	let hue = (level.hue / 200 * 360) + 128;

	accent(`hsl(${hue}deg, 100%, 50%)`);

	function setHue(value:number) {
		hue = value;
		accent(`hsl(${hue}deg, 100%, 50%)`);
		level.hue = (level.hue - 128) / 360 * 200;
	}

	const hueStripLabel = document.createElement('label');
	hueStripLabel.textContent = 'Hue';

	const hueStrip = document.createElement('div');
	hueStrip.classList.add('hue-strip');

	for (let i = 0; i < 360; i += 36) {
		const button = document.createElement('button');
		button.style.backgroundColor = `hsla(${i}deg, 100%, 50%, 0.2)`;
		button.addEventListener('click', () => {setHue(i);click()});
		hueStrip.appendChild(button);
	}

	hueStripLabel.appendChild(hueStrip);

	content.appendChild(hueStripLabel);

	const quickActions = document.createElement('label');
	quickActions.textContent = 'Quick Actions';

	const quickActionsList = [
		{
			title: 'Detail Grass',
			action: async () => {
				if (await confirm('Are you sure you want to detail grass? This will replace all grassy blocks in your level')) {
					let index = 0;
					for (const tile of level.tiles) {
						// check if we're a microblock, if so, reset to green1111
						const us = tile;
						const right = level.tiles[index + 1];
						const down = level.tiles[index + level.width];
						const downRight = level.tiles[index + level.width + 1];

						if (us.id == TileType.Unused && right.id == TileType.Unused && down.id == TileType.Unused && downRight.id == TileType.Unused) {
							tile.id = TileType.Green1111;
							right.id = TileType.Green1111;
							down.id = TileType.Green1111;
							downRight.id = TileType.Green1111;
						}

						const grassIds = [TileType.Green1111,TileType.Green2,TileType.Spike0909,TileType.Spike0099,TileType.Saw3,TileType.Green1111b,TileType.Green6,TileType.Green7];
						const probabilities = {
							[TileType.Green1111]: 3,
							[TileType.Green2]: 0,
							[TileType.Spike0909]: 0.2,
							[TileType.Spike0099]: 0.2,
							[TileType.Saw3]: 0.2,
							[TileType.Green1111b]: 0.3,
							[TileType.Green6]: 0.1,
							[TileType.Green7]: 0.1
						};

						if (grassIds.includes(tile.id)) {
							let maxValue = 0;
							for (const prob in probabilities) {
								maxValue += probabilities[prob];
							}

							let randomValue = Math.random() * maxValue;

							for (const prob in probabilities) {
								randomValue -= probabilities[prob];
								if (randomValue <= 0) {
									tile.id = Number(prob);
									break;
								}
							}
							
							if (Math.random() > 0.8) {
								let isEyeInRange = false;

								const tileCoords = indexToStandardCoords(index, level.width, level.height);;

								for (let x = tileCoords[0] - 3; x <= tileCoords[0] + 3; x++) {
									for (let y = tileCoords[1] - 3; y <= tileCoords[1] + 3; y++) {
										const checkIndex = standardCoordsToIndex([x, y], level.width, level.height);

										if (level.tiles[checkIndex]?.id == TileType.Green2) {
											isEyeInRange = true;
										}
									}
								}

								if (!isEyeInRange) {
									tile.id = TileType.Green2;
								}
							}
							//if (Math.random() > 0.9) {
							//	if (us.id == TileType.Green1111 && right.id == TileType.Green1111 && down.id == TileType.Green1111 && downRight.id == TileType.Green1111) {
							//		us.id = right.id = down.id = downRight.id = TileType.Unused;
							//		us.rotation = 0;
							//		right.rotation = 1;
							//		downRight.rotation = 3;
							//		down.rotation = 2;
							//	}
							//}
						}
						index++;
					}
				}
			}
		}
	];

	for (const { title, action } of quickActionsList) {
		const button = document.createElement('button');
		button.textContent = title;
		button.addEventListener('click', action);
		quickActions.appendChild(button);
	}

	content.appendChild(quickActions);

	return {
		visible
	}
}
