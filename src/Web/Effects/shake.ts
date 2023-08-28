import { wait } from '../../Promises/wait';

export default async function ({
	time,
	intensity,
	frequency,
	target,
}: {
	time: number;
	intensity: number;
	frequency: number;
	target?: HTMLElement | undefined;
}) {
	const ourTarget = target ?? document.body;

	// shake the screen
	const timeBetweenMotions = 1 / frequency;
	const timeBetweenMotionsMS = timeBetweenMotions * 1000;
	const totalMotions = time / timeBetweenMotionsMS;

	for (let i = 0; i < totalMotions; i++) {
		const intensityMultiplier = (1 - i / totalMotions) * intensity;
		const x = (Math.random() - 0.5) * 2 * intensityMultiplier;
		const y = (Math.random() - 0.5) * 2 * intensityMultiplier;
		const transform = `translate(${x}px,${y}px)`;
		ourTarget.animate(
			[
				{
					transform: ourTarget.style.transform,
				},
				{ transform },
			],
			{
				duration: timeBetweenMotionsMS,
			}
		);
		//ourTarget.style.transform = transform;
		await wait(timeBetweenMotionsMS);
	}

	ourTarget.style.transform = '';
}

export async function bump({
	time,
	direction,
	target,
}: {
	time: number;
	direction: [number, number];
	target?: HTMLElement | undefined;
}) {
	const ourTarget = target ?? document.body;

	// bump
	const transform = `translate(${direction[0]}px,${direction[1]}px)`;
	ourTarget.animate(
		[
			{
				transform: '',
			},
			{ transform },
		],
		{
			duration: time / 2,
		}
	);
	ourTarget.animate(
		[
			{
				transform,
			},
			{
				transform: '',
			},
		],
		{
			duration: time / 2,
		}
	);
	ourTarget.style.transform = '';
}
