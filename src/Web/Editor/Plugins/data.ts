import { SettingsKey, settings } from "../../Settings/settings";
import { PluginMetadata } from "./installUI";

export type PluginTable = {
	[key:string]: {
		files: {
			[key:string]: string | number[];
		}
	}
}

export interface PluginData {
	readFile(path:string):Promise<Response>;
	writeFile(path:string, data:Uint8Array):Promise<void>;
	writeFile(path:string, data:string):Promise<void>;
}

export class NetData implements PluginData {
	baseUrl: string;
	cache: Map<string,Uint8Array> = new Map();

	constructor(baseUrl:string) {
		this.baseUrl = baseUrl;
	}

	async readFile(path:string):Promise<Response> {
		if (!this.cache.has(path)) {
			const response = await fetch(`${this.baseUrl.split('/').join(' ').trimEnd().split(' ').join('/')}/${path.split('/').join(' ').trimStart().split(' ').join('/')}`);
			this.cache.set(path, new Uint8Array(await response.arrayBuffer()));
		}
		return new Response(this.cache.get(path));
	}

	async writeFile():Promise<void> {
		throw new TypeError(`NetData is read-only`);
	}
}

function makeUintSerializable(data:Uint8Array):number[] | string {
	try {
		const text = new TextDecoder().decode(data);
		const reencoded = new TextEncoder().encode(text);
		if (JSON.stringify([...reencoded]) == JSON.stringify([...data])) {
			return text;
		}
		return [...data];
	} catch(err) {
		return [...data];
	}
}

export class SettingsData implements PluginData {
	data: Record<string, Uint8Array> = {};
	pluginId: string;

	constructor(pluginId:string) {
		this.pluginId = pluginId;
		
		const pluginTable = settings.getTable<PluginTable>('plugins');

		this.data = {};

		for (const k in pluginTable[pluginId].files) {
			const data = pluginTable[pluginId].files[k];
			if (typeof data == 'string') {
				this.data[k] = new TextEncoder().encode(data);
			} else {
				this.data[k] = new Uint8Array(data);
			}
		}
	}

	async readFile(path:string):Promise<Response> {
		return new Response(this.data[path]);
	}

	async writeFile(path:string, data:Uint8Array | string):Promise<void> {
		const asUint = typeof data == 'string' ? new TextEncoder().encode(data) : data;
		this.data[path] = asUint;

		const serializableData:Record<string, string | number[]> = {};
		
		for (const k in this.data) {
			serializableData[k] = makeUintSerializable(this.data[k]);
		}

		const pluginTable = settings.getTable<PluginTable>('plugins');

		pluginTable[this.pluginId] = pluginTable[this.pluginId] || {
			files: {}
		};

		pluginTable[this.pluginId].files = serializableData;

		settings.setPref('plugins', pluginTable);
	}
}
