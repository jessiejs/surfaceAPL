import { join } from 'path-browserify';
import { settings } from '../../Settings/settings';
import chroma from 'chroma-js';
import { NetData, PluginData, PluginTable, SettingsData } from './data';

export async function showInstallPluginUI() {
	let isAccentColorBright = false;

	const pluginDialog = document.createElement('dialog');
	pluginDialog.classList.add('custom-dialog');
	pluginDialog.classList.add('plugin-dialog');
	pluginDialog.style.setProperty('--accent', `#6600cc`);

	let setTitle = (_:string) => {
		// do nothing
	};

	let setBody = (_:string) => {
		// do nothing
	}

	let setButtons = (_:{text:string, onclick:()=>void, primary:boolean}[]) => {
		// do nothing
	}

	const content = document.createElement('main');
	pluginDialog.appendChild(content); {
		const title = document.createElement('h1');
		title.textContent = `Loading`;
	
		const description = document.createElement('p');
		description.textContent = `Loading...`;

		const spacer = document.createElement('div');
		spacer.classList.add('spacer');
	
		const buttons = document.createElement('div');
		buttons.classList.add('buttons');

		content.appendChild(title);
		content.appendChild(description);
		content.appendChild(spacer);
		content.appendChild(buttons);

		setTitle = (text) => {
			title.textContent = text;
		}
		setBody = (text) => {
			description.textContent = text;
		}
		setButtons = (btns) => {
			buttons.innerHTML = '';
			for (const btn of btns) {
				const button = document.createElement('button');
				button.textContent = btn.text;
				button.addEventListener('click', btn.onclick);
				buttons.appendChild(button);
				
				if (btn.primary) {
					button.classList.add('primary');

					if (isAccentColorBright) {
						button.style.color = 'black';
					} else {
						button.style.color = 'white';
					}
				}
			}
		}
	}

	const image = document.createElement('div');
	image.classList.add('image');

	const icon = document.createElement('img');
	icon.src = '/PluginIcons/Loading.svg';
	icon.classList.add('spinning');
	
	image.appendChild(icon);

	pluginDialog.appendChild(image);

	document.body.appendChild(pluginDialog);
	pluginDialog.showModal();

	// Get started with the actual setup flow
	let pluginPathParam = new URLSearchParams(window.location.search).get('plugin');

	if (!pluginPathParam) {
		pluginDialog.style.setProperty('--accent', `#ff0066`);
		setTitle(`Error`);
		setBody(`The url parameter 'plugin' is missing.`);
		setButtons([]);
		icon.src = '/PluginIcons/Error.svg';
		icon.classList.remove('spinning');
		throw `The url parameter 'plugin' is missing.`;
	}

	// add implicit meta.json
	pluginPathParam = pluginPathParam.split('/').join(' ').trimEnd().split(' ').join('/');
	if (!pluginPathParam.endsWith('.json')) {
		pluginPathParam += '/meta.json';
	}

	// get base resolution url
	const baseResolutionURL = join(pluginPathParam,'../');

	// Load plugin metadata
	const fs = new NetData(baseResolutionURL);

	let metadataText = "";

	const res = await fs.readFile('/meta.json');
	if (res.status == 200) {
		metadataText = await res.text();
	} else {
		pluginDialog.style.setProperty('--accent', `#ff0066`);
		setTitle(`Error`);
		setBody(`Error while loading the plugin metadata: ${res.status}: ${res.statusText}`);
		setButtons([]);
		icon.src = '/PluginIcons/Error.svg';
		icon.classList.remove('spinning');
		throw `Error while loading the plugin metadata: ${res.status}: ${res.statusText}`;
	}

	let meta = {} as PluginMetadata;

	try {
		meta = JSON.parse(metadataText);
	} catch (e) {
		pluginDialog.style.setProperty('--accent', `#ff0066`);
		setTitle(`Error`);
		setBody(`The plugin metadata is not valid JSON.
${e}`);
		setButtons([]);
		icon.src = '/PluginIcons/Error.svg';
		icon.classList.remove('spinning');
		throw `The plugin metadata is not valid JSON.`;
	}

	// Validate plugin metadata
	const validation = validatePluginMetadata(meta);
	if (validation !== true) {
		pluginDialog.style.setProperty('--accent', `#ff0066`);
		setTitle(`Error`);
		setBody(`The plugin metadata is not valid.
${validation}`);
		setButtons([]);
		icon.src = '/PluginIcons/Error.svg';
		icon.classList.remove('spinning');
		throw validation;
	}

	// We have the metadata, let's pull up some clean UI
	pluginDialog.style.setProperty('--accent', meta.accentColor);
	isAccentColorBright = true;
	setTitle(meta.name);
	setBody(meta.description);
	setButtons([{
		text: 'Install',
		onclick: async () => {
			// show throbber
			icon.classList.add('spinning');
			setTitle('Installing');
			setBody('Installing...');
			setButtons([]);
			icon.src = '/PluginIcons/Loading.svg';
			pluginDialog.style.setProperty('--accent', `#6600cc`);

			await installPlugin(meta,fs);
		},
		primary: true,
	}]);
	icon.src = join(baseResolutionURL,meta.icon);
	icon.classList.remove('spinning');
	icon.style.filter = isAccentColorBright ? 'invert(100%)' : 'none';

	throw `Early return`;
}

async function installPlugin(meta:PluginMetadata, fs:PluginData) {
	if (!meta) {
		throw `Not possible`;
	}

	const importPaths = [
		'meta.json',
		meta.icon,
		meta.script,
		...meta.resources
	];

	const dedupImportPaths = [...new Set(importPaths)];

	const plugins = settings.getTable<PluginTable>('plugins');

	plugins[meta.identifier] = {
		files: {}
	};

	const pluginFS = new SettingsData(meta.identifier);

	for (const importPath of dedupImportPaths) {
		// Load
		const bin = new Uint8Array(await (await fs.readFile(importPath)).arrayBuffer());

		// Write
		await pluginFS.writeFile(importPath, bin);
	}

	window.location.pathname = '/';
}

export function validatePluginMetadata(meta:any) {
	if (typeof meta !== 'object') {
		return 'Expected meta to be an object';
	}
	if (typeof meta.name !== 'string') {
		return 'Expected meta.name to be a string';
	}
	if (typeof meta.description !== 'string') {
		return 'Expected meta.description to be a string';
	}
	if (typeof meta.version !== 'string') {
		return 'Expected meta.version to be a string';
	}
	if (typeof meta.author !== 'string') {
		return 'Expected meta.author to be a string';
	}
	if (typeof meta.script !== 'string') {
		return 'Expected meta.script to be a string';
	}
	if (typeof meta.icon !== 'string') {
		return 'Expected meta.icon to be a string';
	}
	if (typeof meta.accentColor !== 'string') {
		return 'Expected meta.accentColor to be a string';
	}
	if (typeof meta.identifier !== 'string') {
		return 'Expected meta.identifier to be a string';
	}
	if (typeof meta.resources !== 'object' || !(meta.resources instanceof Array)) {
		return 'Expected meta.resources to be an array';
	}
	for (let i = 0; i < meta.resources.length; i++) {
		if (typeof meta.resources[i] !== 'string') {
			return `Expected meta.resources[${i}] to be a string`;
		}
	}
	return true;
}

export type PluginMetadata = {
	readonly name: string;
	readonly description: string;
	readonly version: string;
	readonly author: string;
	readonly script: string;
	readonly icon: string;
	readonly accentColor: string;
	readonly identifier: string;
	readonly resources: string[];
}
