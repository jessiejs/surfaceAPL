import createDialog from "./dialog";

export default function(text:string):Promise<boolean> {
	return new Promise((resolve) => {
		const { content } = createDialog(`Confirm`, {
			buttons: [{
				text: 'Yes',
				close: true,
				focus: true,
				onclick: () => {
					resolve(true);
				}
			}, {
				text: 'No',
				close: true,
				onclick: () => {
					resolve(false);
				}
			}]
		});

		const p = document.createElement('p');
		p.textContent = text;

		content.appendChild(p);

		
	});
}
