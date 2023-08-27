import createDialog from "./dialog"

export default function (
	label:string,
	options:string[]
): Promise<string> {
	return new Promise((resolve) => {
		const { content, close, buttonElements } = createDialog(`Select`, {
			buttons: []
		});

		const labelElm = document.createElement('label');

		labelElm.textContent = label;

		content.appendChild(labelElm);

		for (const option of options) {
			const button = document.createElement('button');
			button.textContent = option;
			button.addEventListener('click', () => {
				resolve(option);
				close();
			});
			button.style.display = 'block';
			button.style.width = '100%';
			button.style.textAlign = 'left';
			content.appendChild(button);
		}
	})
}
