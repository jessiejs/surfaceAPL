import alert from "../../IO/alert";
import confirm from "../../IO/confirm";
import prompt from "../../IO/prompt";
import { buildLockedFunction } from "./Lockbox/LockedFunction";
import { PluginData, PluginTable } from "./data";
import { PluginMetadata } from "./installUI";

export type APIVersion = '1' | 1;

export type PluginAPIV1 = {
	reflection: {
		getMeta():PluginMetadata;
		getVersion():string;
	};
	log: {
		log(message:string, indent?:number):void;
	};
	dialog: {
		alert(message:string):Promise<void>;
		confirm(message:string):Promise<boolean>;
		prompt(message:string, options:undefined | {
			validator?: (value:string) => string | undefined;
			defaultValue?: string;
			placeholder?: string;
		}):Promise<string>;
	}
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
				}
			} satisfies PluginAPIV1;
		}
	}

	destroy() {
		
	}
}
