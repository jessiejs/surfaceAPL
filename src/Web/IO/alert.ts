import createDialog from "./dialog";

export default function(text:string):Promise<void> {
	return new Promise((resolve) => {
		// create a dialog
		const { content, close } = createDialog(`Notice`, {
			buttons: [{
				text: 'OK',
				focus: true,
				onclick: () => {
					close();
					resolve();
				}
			}]
		});

		// create our alert text
		const alertElm = document.createElement('p');
		alertElm.textContent = text;

		content.appendChild(alertElm);
	});
}
