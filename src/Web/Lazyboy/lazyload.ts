export function lazyload() {
	const store: Record<string, HTMLImageElement> = {};
	let loaded: string[] = [];

	const lazyboy = function (src: string) {
		if (!store[src]) {
			store[src] = new Image();
			store[src].src = src;
			console.info(`[lazyload] adding ${src} to store`);
			lazyboy.loading++;
			store[src].onload = () => {
				console.info(`[lazyload] ${src} loaded`);
				loaded.push(src);
				lazyboy.loaded++;
				lazyboy.loading--;
			};
			store[src].onerror = () => {
				console.error(`[lazyload] ${src} failed to load`);
				if (src.endsWith('.png')) {
					console.warn(
						`[lazyload] this may be caused by writing ${src}, try writing ${src
							.split('png')
							.join('svg')}`
					);
				}
				lazyboy.failed++;
				lazyboy.loading--;
			};
		}

		if (store[src]?.complete) {
			return store[src];
		}

		return undefined;
	} as ((src: string) => HTMLImageElement | undefined) & {
		remove(src: string): void;
		reload(): void;
		loading: number;
		loaded: number;
		failed: number;
	};

	lazyboy.remove = (src: string) => {
		const img = store[src];
		delete store[src];
		img.onload = _ => _;
		img.onerror = _ => _;
		if (store[src].complete) {
			if (loaded.includes(src)) {
				lazyboy.loaded--;
				loaded = loaded.filter(v => v !== src);
			} else {
				lazyboy.failed--;
			}
		} else {
			lazyboy.loading--;
		}
	};

	lazyboy.reload = () => {
		loaded = [];
		for (const key in store) {
			delete store[key];
		}
	};

	lazyboy.loading = 0;
	lazyboy.loaded = 0;
	lazyboy.failed = 0;

	return lazyboy;
}
