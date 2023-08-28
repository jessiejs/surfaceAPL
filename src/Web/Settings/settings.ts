import createDialog from '../IO/dialog';

export type SettingsData = {
	kv:Record<SettingsKey,SettingsValue>;
};

export type SettingsValue = number | string | boolean

export type SettingsKey = 
	"propertyPicker.style";

const defaults:Record<SettingsKey,SettingsValue> = {
	"propertyPicker.style": "classic"
};

type Immutable<T> = {
	readonly [P in keyof T]: Immutable<T[P]>;
};

export type SettingsManager = {
	data: Immutable<SettingsData>;
	setPref<T extends SettingsValue>(key: SettingsKey, value: T): void;
	getPref<T extends SettingsValue>(key: SettingsKey): T;
}

export const settings = getSettings();

export function getSettings():SettingsManager {
	let data:SettingsData = {
		kv:{} as Record<SettingsKey,SettingsValue>
	};

	try {
		data = JSON.parse(localStorage.getItem('settings') || 'not parsable');
	} catch {
		console.info(`[settings]: db unininitialized, using defaults`);
	};

	console.group(`[settings]: checking defaults`)
	for (const k in defaults) {
		const key = k as SettingsKey;
		if (data.kv[key] == undefined) {
			console.info(`[settings]: pref ${key} not found, defaulting to ${defaults[key]}`);
			data.kv[key] = defaults[key];
		}
	}
	console.groupEnd();

	console.log(`[settings]: saving`);
	localStorage.setItem('settings', JSON.stringify(data));

	return {
		data: data as Immutable<SettingsData>,
		setPref(key, value) {
			data.kv[key] = value;
			console.log(`[settings]: saving ${value} to ${key}`);
			localStorage.setItem('settings', JSON.stringify(data));
		},
		getPref(key) {
			return data.kv[key] as any;
		}
	};
}

export function showSettingsWindow() {
	const { content } = createDialog('⚙ Settings', {
		buttons: [
			{
				text: 'Close',
				close: true,
			}
		]
	});

	const options:([SettingsKey,string,'text'] | [SettingsKey,string,'number'] | [SettingsKey,string,'tickbox'] | [SettingsKey,string,'select', Record<string,string>])[] = [
		['propertyPicker.style', 'Property Picker Style', 'select', {
			'Classic': 'classic',
			'Modern': 'batch'
		}],
	];

	for (const [key, title, type, data] of options) {
		const row = document.createElement('div');
		row.classList.add('settings-row');

		const label = document.createElement('span');
		label.textContent = title;

		let input:Node = document.createTextNode(`[placeholder]`);

		switch (type) {
			case 'select': {
				const selector = document.createElement('select');
				for (const [title,prefName] of Object.entries(data)) {
					const option = document.createElement('option');
					option.textContent = title;
					option.value = prefName;
					selector.appendChild(option);
				}
				selector.value = settings.getPref(key);
				selector.onchange = () => {
					settings.setPref(key, selector.value);
				}
				input = selector;
			}
			break;
			case 'tickbox': {
				const tick = document.createElement('input');
				tick.type = 'checkbox';
				tick.checked = settings.getPref(key);
				tick.onchange = () => {
					settings.setPref(key, tick.checked);
				}
				input = tick;
			}
			break;
			case 'number': {
				const num = document.createElement('input');
				num.type = 'number';
				num.value = settings.getPref(key);
				num.onchange = () => {
					settings.setPref(key, num.value);
				}
				input = num;
			}
			break;
			case 'text': {
				const elm = document.createElement('input');
				elm.type = 'text';
				elm.value = settings.getPref(key);
				elm.onchange = () => {
					settings.setPref(key, elm.value);
				}
				input = elm;
			}
			break;
		}

		row.appendChild(label);
		row.appendChild(input);

		content.appendChild(row);
	}
}
