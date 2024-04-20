import shake from '../Effects/shake';
import { keyDownHandlers, keyUpHandlers } from './keyhandlers';
import confetti from 'canvas-confetti';
import { pColors } from './prd';
import { Howl } from 'howler';
import { SettingsKey, settings } from '../Settings/settings';

export default function (
	name: string | `p:${SettingsKey}`,
	{
		buttons,
	}: {
		buttons: {
			text: string;
			onclick?: () => void;
			focus?: boolean;
			clickedText?: string;
			confetti?: boolean;
			close?: boolean;
			confettiFlag?: string;
		}[];
	}
): {
	dialog: HTMLDialogElement;
	actionbar: HTMLDivElement;
	content: HTMLDivElement;
	buttonElements: HTMLButtonElement[];
	close: () => void;
} {
	// create a dialog
	const dialog = document.createElement('dialog');

	// create the header
	const header = document.createElement('header');

	// create the title
	const title = document.createElement('h1');
	title.textContent = name;
	if (name.startsWith('p:')) {
		settings.bind<string>(name.substring(2) as SettingsKey, (value) => {
			title.textContent = value;
		})
	}

	// add the title and close button to the header
	header.appendChild(title);

	// add the header to the dialog
	dialog.appendChild(header);

	// create the content
	const content = document.createElement('div');
	content.classList.add('content');

	// add the content to the dialog
	dialog.appendChild(content);

	// add the dialog to the document
	document.body.appendChild(dialog);

	const actionbar = document.createElement('div');

	actionbar.classList.add('submit-bar');

	if (buttons.length > 0) {
		dialog.appendChild(actionbar);
	}

	const buttonElements: HTMLButtonElement[] = [];

	for (const button of buttons) {
		const buttonElm = document.createElement('button');
		buttonElm.textContent = button.text;
		if (button.onclick) {
			buttonElm.addEventListener('click', button.onclick);
		}
		buttonElm.addEventListener('click', async () => {
			if (button.clickedText) {
				buttonElm.textContent = button.clickedText;
			}
			if (button.confetti) {
				const confettiCanvas = document.createElement('canvas');
				confettiCanvas.classList.add('confetti');
				dialog.appendChild(confettiCanvas);
				const confettiBox = confettiCanvas.getBoundingClientRect();
				const buttonBox = buttonElm.getBoundingClientRect();
				const buttonCenter = [
					buttonBox.left + buttonBox.width / 2,
					buttonBox.top + buttonBox.height / 2,
				];
				const prideColors = (
					button.confettiFlag
						? [
								(
									pColors as Record<
										string,
										{ stripes: { code: string }[] }
									>
								)[button.confettiFlag],
						  ]
						: Object.values(pColors)
				).map(v => v.stripes.map(stripe => stripe.code));
				//const chosenColors =
				//	prideColors[Math.floor(Math.random() * prideColors.length)];
				const chosenColors = pColors.poly;
				const colors = chosenColors.stripes.map(s => s.code);
				const confettiPromise = confetti
					.create(confettiCanvas, {
						resize: true,
					})({
						origin: {
							x:
								(buttonCenter[0] - confettiBox.x) /
								confettiBox.width,
							y:
								(buttonCenter[1] - confettiBox.y) /
								confettiBox.height,
						},
						colors,
						gravity: 6,
					})
					?.then(() => {
						confettiCanvas.remove();
					});

				for (let i = 0; i < 5; i++)
					new Howl({
						src: ['/SFX/clack.wav'],
						rate: 0.8,
					}).play();

				await shake({
					target: dialog,
					time: 100,
					intensity: 10,
					frequency: 500,
				});

				await confettiPromise;
			}
			if (button.close) {
				close();
			}
		});
		actionbar.appendChild(buttonElm);

		if (button.focus) {
			buttonElm.focus();
		}

		buttonElements.push(buttonElm);
	}

	// temporarily disable window.keydown and keyup

	const dummy = () => {};

	function close() {
		dialog.close();
		dialog.remove();
		keyDownHandlers.splice(keyDownHandlers.indexOf([dummy]), 1);
		keyUpHandlers.splice(keyUpHandlers.indexOf([dummy]), 1);
	}

	keyDownHandlers.push([dummy]);
	keyUpHandlers.push([dummy]);

	dialog.showModal();

	// return the dialog
	return {
		dialog,
		actionbar,
		content,
		buttonElements,
		close,
	};
}
