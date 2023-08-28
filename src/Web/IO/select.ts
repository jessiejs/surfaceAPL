import createDialog from './dialog';

export default function (
	label: string,
	options: { text: string; isThereMore: boolean }[]
): Promise<string> {
	return new Promise(resolve => {
		const { content, close, buttonElements } = createDialog(`Select`, {
			buttons: [],
		});

		const labelElm = document.createElement('label');

		labelElm.textContent = label;

		content.appendChild(labelElm);

		for (const option of options) {
			const button = document.createElement('button');
			button.textContent =
				option.text + (option.isThereMore ? '...' : '');
			button.addEventListener('click', () => {
				resolve(option.text);
				close();
			});
			button.style.display = 'block';
			button.style.width = '100%';
			button.style.textAlign = 'left';
			content.appendChild(button);
		}
	});
}
