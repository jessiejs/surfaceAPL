import createDialog from '../IO/dialog';

export type SettingsData = {
	kv: Record<SettingsKey, SettingsValue>;
};

export type SettingsValue = number | string | boolean;

export type SettingsKey = 'propertyPicker.style' | 'camera.scaledMotion' | 'camera.speed' | 'privacy.linkShortener' | 'setup.flow' | 'loca.export' | 'loca.settings' | 'loca.about' | 'settings.showDeveloperInfo' | 'flags.divergent' | `ff.${FlagName}` | 'pro.enabled' | 'ui.scale';
export type FlagName = 'WALL_EDITING' | 'PROPERTY_VISUAL_EDITOR' | 'ANIMATED_FLAGS' | 'STAR_TOOL';

export const defaults: Record<SettingsKey, SettingsValue> = {
	'propertyPicker.style': 'classic',
	'camera.scaledMotion': true,
	'camera.speed': 400,
	'privacy.linkShortener': true,
	'setup.flow': false,
	'loca.about': 'About',
	'loca.export': 'Export',
	'loca.settings': 'Settings',
	'settings.showDeveloperInfo': false,
	'flags.divergent': false,
	'ff.WALL_EDITING': false,
	'ff.PROPERTY_VISUAL_EDITOR': false,
	'ff.ANIMATED_FLAGS': false,
	'ff.STAR_TOOL': false,
	'pro.enabled': false,
	"ui.scale": 'comfy'
};

type Immutable<T> = {
	readonly [P in keyof T]: Immutable<T[P]>;
};

export type SettingsManager = {
	setPref<T extends SettingsValue>(key: SettingsKey, value: T): void;
	getNumber<T extends number>(key: SettingsKey): T;
	getString<T extends string>(key: SettingsKey): T;
	getBoolean<T extends boolean>(key: SettingsKey): T;
	bind<T extends SettingsValue>(key: SettingsKey, handler: (value: T, key: SettingsKey) => void): void;
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

	const settingsHandlers:Record<SettingsKey,((value:SettingsValue,key:SettingsKey)=>void)[]> = Object.fromEntries(Object.keys(defaults).map(k => [k,[]])) as any;

	return {
		setPref(key, value) {
			data.kv[key] = value;
			console.log(`[settings]: saving ${value} to ${key}`);
			localStorage.setItem('settings', JSON.stringify(data));
			for (const handler of settingsHandlers[key]) {
				handler(value, key);
			}
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
		},
		bind<T>(key: SettingsKey, handler: (value: T, key: SettingsKey) => void) {
			settingsHandlers[key].push(handler as any);
			handler(data.kv[key] as T, key);
		}
	};
}

const proKeys:SettingsKey[] = ['ui.scale'];

export function showSettingsWindow({ showFlags }:{ showFlags:boolean }) {
	const { content, dialog } = createDialog('p:loca.settings', {
		buttons: [
			{
				text: 'Close',
				close: true,
			},
		],
	});

	settings.bind<boolean>('pro.enabled', (v)=>{
		if (v) {
			dialog.classList.add('pro-size');
		} else {
			dialog.classList.remove('pro-size');
		}
	})

	let flagInfoVisibility: "hidden" | "toggleable" | "all" = "toggleable";

	if (settings.getBoolean('flags.divergent')) {
		flagInfoVisibility = "all";
	}

	if (!showFlags) {
		flagInfoVisibility = "hidden";
	}

	let options: (
		| [SettingsKey, string, 'text']
		| [SettingsKey, string, 'number']
		| [SettingsKey, string, 'tickbox']
		| [SettingsKey, string, 'select', Record<string, string>]
		| ['category', string]
	)[] = [
		['category','Common'],
		[
			'propertyPicker.style',
			'Property Picker Style',
			'select',
			{
				Classic: 'classic',
				Modern: 'batch',
			},
		],
		['ui.scale', 'UI Scale', 'select', {
			Comfy: 'comfy',
			Compact: 'compact',
		}],
		['category','Privacy'],
		['privacy.linkShortener', 'Use Link Shortener', 'tickbox'],
		['category', 'Camera'],
		['camera.scaledMotion', 'Magic Panning', 'tickbox'],
		['camera.speed', 'Camera Speed', 'number'],
		['category', 'Localization'],
		['loca.about', 'About Title', 'text'],
		['loca.export', 'Export Title', 'text'],
		['loca.settings', 'Settings Title', 'text'],
		['category', 'Advanced'],
		['settings.showDeveloperInfo', 'Show internal setting names', 'tickbox'],
		['pro.enabled', 'Pro Mode', 'tickbox'],
		['setup.flow', 'Completed flow setup', 'tickbox']
	];

	if (flagInfoVisibility == "toggleable" || flagInfoVisibility == "all") {
		options.push([
			'flags.divergent',
			'Allow Flag Modifications',
			'tickbox',
		]);
	}

	if (flagInfoVisibility == "all") {
		for (const pref in defaults) {
			if (pref.startsWith('ff.')) {
				options.push([pref as SettingsKey, pref, 'tickbox']);
			}
		}
	}

	for (const [key, title, type, data] of options) {
		const row = document.createElement('label');
		row.classList.add('settings-row');

		if (key == 'category') {
			row.classList.add('category-row');
			const text = document.createElement('label');
			text.textContent = title;
			row.appendChild(text);
			content.appendChild(row);
			continue;
		}

		const label = document.createElement('span');
		label.textContent = title;

		const subtleLabel = document.createElement('span');
		subtleLabel.style.opacity = '0.5';
		subtleLabel.textContent = ` (${key})`;
		settings.bind<boolean>('settings.showDeveloperInfo', (value) => {
			subtleLabel.style.display = value ? 'inline' : 'none';
		});
		if (proKeys.includes(key)) {
			settings.bind<boolean>('pro.enabled', (value) => {
				row.style.display = value ? 'flex' : 'none';
			})
		}

		label.appendChild(subtleLabel);

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
					elm.oninput = () => {
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
