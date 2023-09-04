import { isLockdownFuseBlown, lockdown } from './lockdown';
import { Parser } from 'acorn';

export class SecurityError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'SecurityError';
	}
}

export function buildLockedFunction(src:string) {
	while (!isLockdownFuseBlown()) {
		lockdown();
	}

	// Try to parse the source
	try {
		const parser = new Parser({
			ecmaVersion: 2018,
			allowAwaitOutsideFunction: true,
		},src);
		parser.parse();
	} catch (e) {
		console.info(`[buildLockedFunction]: ${src}`);
		throw new SecurityError(`Failed to parse locked function: ${e}`);
	}

	// Build the function
	const win = {} as Record<string, any>;
	let lockdownCode = '';
	let internalLockdownCode = '';

	for (const key in window) {
		win[key] = undefined;
	}

	function getFunction(sr=src,async=false):Function {
		const finalKeys = Object.keys(win);

		const finalSrc = `return (function(win){// Our lockdown code
${lockdownCode};
// Other lockdown code
${internalLockdownCode}
// Destructure window
const {${finalKeys.join(',')}} = win;
// Execute untrusted code
${async ? 'async ' : ''}function untrusted() {
${sr};
}
return untrusted;
})`;
		const f = new Function(finalSrc);
		return f()(win);
	};

	return {
		extendWindow(callback:(win:Record<string, any>)=>void) {
			callback(win);
			return this;
		},
		addCode(code:string) {
			lockdownCode += code + ';\n';
			return this;
		},
		//allow(...objs:string[]) {
		//	for (const obj of objs) {
		//		this.extendWindow((win)=>{
		//			win[obj] = (window as any)[obj];
		//		})
		//	}
		//	return this;
		//},
		addVirtualEval() {
			win['Function'] = function (src:string) {
				if (!(this instanceof win['Function'])) {
					return new win['Function'](src);
				}
				return getFunction(src);
			};

			win['eval'] = (src:string) => {
				const fn = win['Function'](src);
				return fn();
			}

			return this;
		},
		share(obj:Record<string,any>) {
			for (const key in obj) {
				win[key] = obj[key];
			}
			return this;
		},
		getFunction
	};
}

// add to global scope for debugging
//@ts-ignore
window.buildLockedFunction = buildLockedFunction;
