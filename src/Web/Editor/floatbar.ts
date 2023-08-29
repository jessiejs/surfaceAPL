import { Howl } from 'howler';
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

export function createStarfloat() {
	const { floatbar, content, visible, accent } = createFloatbar('Starzone', '/Textures/Icons/starzone.svg');

	accent('red');

	return {
		visible
	}
}
