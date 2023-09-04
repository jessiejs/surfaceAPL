import alert from "../../IO/alert";
import confirm from "../../IO/confirm";
import prompt from "../../IO/prompt";
import { buildLockedFunction } from "./Lockbox/LockedFunction";
import { PluginData, PluginTable } from "./data";
import { PluginMetadata } from "./installUI";

export type APIVersion = '1' | 1;

export type UIElement<T extends Record<string,any>> = {
	[key in keyof T]: ((value: T[key]) => void) & {
		value: () => T[key];
	};
};

export const { getLockdownDBItem, setLockdownDBItem } = (() => {
	const lockdownDB = new WeakMap<any, any>();

	return {
		getLockdownDBItem<T>(key:any):T | undefined {
			return lockdownDB.get(key) as T;
		},
		setLockdownDBItem(key:any, value:any) {
			lockdownDB.set(key, value);
		}
	}
})();

export function createUIElement<T extends Record<string,any>>(gs:{
	[key in keyof T]: {
		getter: () => T[key];
		setter: (value:T[key]) => void;
	} 
}, elm:HTMLElement):UIElement<T> {
	const out = {
	} as UIElement<T>;

	setLockdownDBItem(out, elm);

	for (const key in gs) {
		out[key] = ((value:T[typeof key]) => {
			(gs[key].setter as any)(value);
			return out;
		}) as any;
		out[key].value = gs[key].getter;
	}

	return out;
}

export function createButton() {
	const button = document.createElement('button');
	
	return createUIElement<{
		text: string;
		onclick: (() => void) | null;
		disabled: boolean;
	}>({
		text: {
			getter() {
				return button.textContent!;
			},
			setter(value) {
				button.textContent = value;
			}
		},
		onclick: {
			getter() {
				return button.onclick as () => void;
			},
			setter(value) {
				button.onclick = () => {
					if (value) {
						value()
					}
				};
			}
		},
		disabled: {
			getter() {
				return button.disabled;
			},
			setter(value) {
				button.disabled = value;
			}
		}
	}, button);
}

export type PluginAPIV1 = {
	reflection: {
		getMeta():PluginMetadata;
		getVersion():string;
	};
	log: {
		log(message:string, indent?:number):void;
		obj(obj:any, indent?:number):void;
	};
	dialog: {
		alert(message:string):Promise<void>;
		confirm(message:string):Promise<boolean>;
		prompt(message:string, options:undefined | {
			validator?: (value:string) => string | undefined;
			defaultValue?: string;
			placeholder?: string;
		}):Promise<string>;
	};
	ui: {
		button(): UIElement<{
			text: string;
			onclick: (() => void) | null;
			disabled: boolean;
		}>;
	};
}

export class Plugin {
	src:string;
	meta:PluginMetadata;

	constructor(src:string,meta:PluginMetadata) {
		this.src = src;
		this.meta = meta;

		let hasAqquiredAPI = false;

		const self = this;

		const fn = buildLockedFunction(src).share({
			getAPI(version:APIVersion) {
				if (hasAqquiredAPI) {
					throw new Error(`Plugins may only request the API once`);
				}
				return self.getAPI(version);
			}
		}).addVirtualEval().getFunction(src,true);
		fn();
	}

	getAPI(version:APIVersion) {
		const self = this;

		if (version.toString() == '1') {
			return {
				reflection: {
					getMeta() {
						return self.meta;
					},
					getVersion() {
						return version.toString();
					}
				},
				log: {
					log(message:string, indent=0) {
						console.log(`\t`.repeat(indent) + `[plugin/${self.meta.identifier.split('.').reverse()[0]}]: ${message}`);
					},
					obj(obj:any, indent=0) {
						console.log(`\t`.repeat(indent) + `[plugin/${self.meta.identifier.split('.').reverse()[0]}]:`, obj);
					}
				},
				dialog: {
					alert(message:string) {
						return alert(message);
					},
					confirm(message:string) {
						return confirm(message);
					},
					prompt(message:string, options) {
						const validator = options?.validator;
						const defaultValue = options?.defaultValue;
						const placeholder = options?.placeholder || 'Text';

						return prompt(message, placeholder, {
							validateFunction: validator || ((_) => undefined),
							defaultValue,
						});
					}
				},
				ui: {
					button: createButton
				}
			} satisfies PluginAPIV1;
		}
	}

	destroy() {
		
	}
}
