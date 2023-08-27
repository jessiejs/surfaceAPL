import createDialog from '../IO/dialog';
import logoURL from '../../Art/Branding/Wordmark.svg';

export default function() {
	const { content } = createDialog('About', {
		buttons: [
			{
				text: 'Close',
				close:true
			}
		]
	});

	const title = document.createElement('img');
	title.src = logoURL;
	title.alt = 'surfaceAPL';
	title.height = 40;

	const description = document.createElement('p');
	description.innerHTML = `surfaceAPL is a custom editor for Appel, written in Typescript.
Any exported levels are owned by the user.

<span style="opacity:0.5;font-size:9px;">v${APP_VERSION} (${COMMIT_HASH})
Built with ${OS_INFO} ${NODE_INFO}
Please do not copy or redistribute without permission</span>`.split("\n\n").map(t => `<p>${t.split("\n").join("<br>")}</p>`).join("");

	content.appendChild(title);
	content.appendChild(description);
}
