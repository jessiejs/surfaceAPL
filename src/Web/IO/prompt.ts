import createDialog from './dialog';

export default function (
	text: string,
	placeholder: string,
	{
		validateFunction,
		defaultValue
	}: { validateFunction: (text: string) => string | undefined, defaultValue?: string } = {
		validateFunction: _ => undefined,
		defaultValue: undefined
	}
): Promise<string> {
	return new Promise(resolve => {
		const label = document.createElement('label');
		label.textContent = text;

		const inputElm = document.createElement('input');
		inputElm.placeholder = placeholder;

		if (defaultValue) {
			inputElm.value = defaultValue;
		}

		label.appendChild(inputElm);

		const errorElm = document.createElement('p');
		errorElm.classList.add('error');
		errorElm.style.display = 'none';

		const { content, close, buttonElements } = createDialog(`Prompt`, {
			buttons: [
				{
					text: 'Submit',
					focus: true,
					onclick: () => {
						if (validateFunction(inputElm.value)) {
							errorElm.style.display = 'block';
							errorElm.textContent = validateFunction(
								inputElm.value
							)!;
							inputElm.focus();
							buttonElements[0].disabled = true;
							return;
						}
						close();
						resolve(inputElm.value);
					},
				},
			],
		});

		const submitButton = buttonElements[0];

		submitButton.disabled = true;

		inputElm.addEventListener('keyup', event => {
			const error = validateFunction(inputElm.value);

			if (error) {
				errorElm.textContent = error;
				errorElm.style.display = 'block';
				submitButton.disabled = true;
			} else {
				errorElm.style.display = 'none';
				submitButton.disabled = false;
			}

			if (event.key === 'Enter') {
				if (!error) {
					submitButton.click();
				}
				event.preventDefault();
			}
		});

		const interval = setInterval(() => {
			inputElm.focus();			
		}, 0);

		setTimeout(() => {
			clearInterval(interval);
		},500);

		content.appendChild(label);
		content.appendChild(errorElm);
	});
}
