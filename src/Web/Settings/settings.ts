import createDialog from '../IO/dialog';

export type SettingsData = {
	kv: Record<SettingsKey, SettingsValue>;
};

export type SettingsValue = number | string | boolean;

export type SettingsKey = 'propertyPicker.style' | 'camera.scaledMotion' | 'camera.speed' | 'privacy.linkShortener' | 'setup.flow';

const defaults: Record<SettingsKey, SettingsValue> = {
	'propertyPicker.style': 'classic',
	'camera.scaledMotion': true,
	'camera.speed': 400,
	'privacy.linkShortener': true,
	'setup.flow': false
};

type Immutable<T> = {
	readonly [P in keyof T]: Immutable<T[P]>;
};

export type SettingsManager = {
	setPref<T extends SettingsValue>(key: SettingsKey, value: T): void;
	getNumber<T extends number>(key: SettingsKey): T;
	getString<T extends string>(key: SettingsKey): T;
	getBoolean<T extends boolean>(key: SettingsKey): T;
};

export const settings = getSettings();

export function getSettings(): SettingsManager {
	let data: SettingsData = {
		kv: {} as Record<SettingsKey, SettingsValue>,
	};

	try {
		data = JSON.parse(localStorage.getItem('settings') || 'not parsable');
	} catch {
		console.info(`[settings]: db unininitialized, using defaults`);
	}

	console.group(`[settings]: checking defaults`);
	for (const k in defaults) {
		const key = k as SettingsKey;
		if (data.kv[key] == undefined) {
			console.info(
				`[settings]: pref ${key} not found, defaulting to ${defaults[key]}`
			);
			data.kv[key] = defaults[key];
		}
	}
	console.groupEnd();

	console.log(`[settings]: saving`);
	localStorage.setItem('settings', JSON.stringify(data));

	function getPref<T extends SettingsValue>(key:SettingsKey) {
		return data.kv[key] as T;
	};

	return {
		setPref(key, value) {
			data.kv[key] = value;
			console.log(`[settings]: saving ${value} to ${key}`);
			localStorage.setItem('settings', JSON.stringify(data));
		},
		getNumber<T extends number>(key: SettingsKey) {
			const value = getPref(key);
			if (typeof value != 'number') {
				throw `[settings]: ${key} is not a number`;
			}
			return value as T;
		},
		getString<T extends string>(key: SettingsKey) {
			const value = getPref(key);
			if (typeof value != 'string') {
				throw `[settings]: ${key} is not a string`;
			}
			return value as T;
		},
		getBoolean<T extends boolean>(key: SettingsKey) {
			const value = getPref(key);
			if (typeof value != 'boolean') {
				throw `[settings]: ${key} is not a boolean`;
			}
			return value as T;
		}
	};
}

export function showSettingsWindow() {
	const { content } = createDialog('⚙ Settings', {
		buttons: [
			{
				text: 'Close',
				close: true,
			},
		],
	});

	const options: (
		| [SettingsKey, string, 'text']
		| [SettingsKey, string, 'number']
		| [SettingsKey, string, 'tickbox']
		| [SettingsKey, string, 'select', Record<string, string>]
	)[] = [
		[
			'propertyPicker.style',
			'Property Picker Style',
			'select',
			{
				Classic: 'classic',
				Modern: 'batch',
			},
		],
		['camera.scaledMotion', 'Magic Panning', 'tickbox'],
		['camera.speed', 'Camera Speed', 'number'],
		['privacy.linkShortener', 'Use Link Shortener', 'tickbox'],
		['setup.flow', 'Completed flow setup', 'tickbox'],
	];

	for (const [key, title, type, data] of options) {
		const row = document.createElement('label');
		row.classList.add('settings-row');

		const label = document.createElement('span');
		label.textContent = title;

		let input: Node = document.createTextNode(`[placeholder]`);

		switch (type) {
			case 'select':
				{
					const selector = document.createElement('select');
					for (const [title, prefName] of Object.entries(data)) {
						const option = document.createElement('option');
						option.textContent = title;
						option.value = prefName;
						selector.appendChild(option);
					}
					selector.value = settings.getString(key);
					selector.onchange = () => {
						settings.setPref(key, selector.value);
					};
					input = selector;
				}
				break;
			case 'tickbox':
				{
					const tick = document.createElement('input');
					tick.type = 'checkbox';
					tick.checked = settings.getBoolean(key);
					tick.onchange = () => {
						settings.setPref(key, tick.checked);
					};
					input = tick;
				}
				break;
			case 'number':
				{
					const num = document.createElement('input');
					num.type = 'number';
					num.value = settings.getNumber(key).toString();
					num.onchange = () => {
						settings.setPref(key, Number(num.value));
					};
					input = num;
				}
				break;
			case 'text':
				{
					const elm = document.createElement('input');
					elm.type = 'text';
					elm.value = settings.getString(key);
					elm.onchange = () => {
						settings.setPref(key, elm.value);
					};
					input = elm;
				}
				break;
		}

		row.appendChild(label);
		row.appendChild(input);

		content.appendChild(row);
	}

	// fix a bug in firefox
	content.classList.remove('content');
	content.getBoundingClientRect(); // force style recalc
	content.classList.add('content');
}
