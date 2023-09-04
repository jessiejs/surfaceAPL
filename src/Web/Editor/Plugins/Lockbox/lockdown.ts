let fuse = false;

export function isLockdownFuseBlown() {
	return fuse;
}

export function lock(obj:any) {
	Object.freeze(obj);
	Object.seal(obj);
}

export function lockPrimitive(obj:{prototype:any}) {
	lock(obj);
	lock(obj.prototype);
}

export function lockdown() {
	lockPrimitive(Object);
	lockPrimitive(Array);
	lockPrimitive(Function);
	lockPrimitive(RegExp);
	lockPrimitive(Date);
	//lockPrimitive(Error);
	lockPrimitive(Number);
	lockPrimitive(String);
	lockPrimitive(Boolean);
	lock(Math);
	lock(JSON);

	fuse = true;
}
