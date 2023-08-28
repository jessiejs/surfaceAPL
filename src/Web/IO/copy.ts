import createDialog from './dialog';

export default function (title: string, textToCopy: string) {
	return new Promise<void>(resolve => {
		const { content, buttonElements, close } = createDialog(title, {
			buttons: [
				{
					text: 'Copy',
					focus: true,
					clickedText: 'Copied!',
					confetti: true,
					onclick: () => {
						navigator.clipboard.writeText(textToCopy);
						buttonElements[1].focus();
					},
				},
				{
					text: 'Done',
					onclick: () => {
						close();
						resolve();
					},
				},
			],
		});

		const label = document.createElement('label');

		label.textContent = `What you're copying`;

		const textarea = document.createElement('textarea');

		textarea.textContent = textToCopy;

		textarea.onkeydown = e => {
			e.preventDefault();
			textarea.textContent = textToCopy;
		};

		label.appendChild(textarea);

		content.appendChild(label);
	});
}
