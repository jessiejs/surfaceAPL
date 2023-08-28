let extendedID = 1000;
export const TileType = {
	Blank: 1,
	Green1111: 2,
	Green2: 3,
	Green1100: 4,
	Green1000: 5,
	BIG: 6,
	Green0101: 7,
	Window: 8,
	Spike2: 9,
	Unused: 10,
	MobA: 11,
	Green3: 12,
	Green1101: 13,
	Green1110: 14,
	Apple: 15,
	Stop1: 16,
	Spike0909: 17,
	Spike0099: 18,
	Saw2: 19,
	Saw3: 20,
	Green1111b: 21,
	OutOfShot: 22,
	Lift2x2: 23,
	Lift2x3: 24,
	Checkpoint9: 25,
	Checkpoint2: 26,
	Checkpoint7: 27,
	Checkpoint4: 28,
	Checkpoint8: 29,
	Checkpoint6: 30,
	BIRD01: 31,
	Stomp01: 32,
	Green1111Bang: 33,
	Crumble00118: 34,
	Crumble00111: 35,
	Crumble00112: 36,
	Crumble00113: 37,
	Crumble00114: 38,
	Crumble00115: 39,
	Crumble00116: 40,
	Crumble00117: 41,
	Spring2: 42,
	Spring3: 43,
	Launcher1111d: 44,
	Launcher1111d2: 45,
	Crumble0010: 46,
	Crumble0010b: 47,
	Crumble0010c: 48,
	Crumble0010d: 49,
	Convey2: 50,
	Convey3: 51,
	Convey21: 52,
	Convey22: 53,
	Convey23: 54,
	Convey24: 55,
	Convey25: 56,
	Convey26: 57,
	EnemyPip: 58,
	Burtha: 59,
	Spider: 60,
	WormA: 61,
	WormA2: 62,
	End1: 63,
	End2: 64,
	End3: 65,
	End4: 66,
	End5: 67,
	Costume1: 68,
	AppleAttach: 69,
	Key01: 70,
	Activate: 71,
	Lock02: 72,
	Lift2x4: 73,
	SpikeAround: 74,
	EnemyB: 75,
	Player: 76,
	Costume2: 77,
	Costume3: 78,
	Green4: 79,
	Green5: 80,
	Green6: 81,
	Green7: 82,
	Costume4: 83,
	Activate2: 84,
	Costume5: 85,
	Costume6: 86,
	WallFlat: extendedID++,
	WallDown: extendedID++,
	WallUp: extendedID++,
	WallSpike: extendedID++,
	PropertyGrab: extendedID++,
	PropertyDrop: extendedID++,
	PropertyEdit: extendedID++,
};

export type EditorBehaviour = {
	editStyle:
		| 'tiles'
		| 'wall'
		| 'property.grab'
		| 'property.drop'
		| 'property.edit';
	placingID: number;
	placingRotation: number;
	showTiles: boolean;
	showWall: boolean;
	lockY: boolean;
};

export function getBehaviour(id: number, rotation: number): EditorBehaviour {
	if (id >= TileType.WallFlat && id <= TileType.WallSpike) {
		return {
			editStyle: 'wall',
			placingID: id,
			showTiles: false,
			showWall: true,
			lockY: true,
			placingRotation: rotation,
		};
	} else if (id == TileType.PropertyGrab) {
		return {
			editStyle: 'property.grab',
			placingID: id,
			showTiles: true,
			showWall: false,
			lockY: false,
			placingRotation: rotation,
		};
	} else if (id == TileType.PropertyDrop) {
		return {
			editStyle: 'property.drop',
			placingID: id,
			showTiles: true,
			showWall: false,
			lockY: false,
			placingRotation: rotation,
		};
	} else if (id == TileType.PropertyEdit) {
		return {
			editStyle: 'property.edit',
			placingID: id,
			showTiles: true,
			showWall: false,
			lockY: false,
			placingRotation: rotation,
		};
	} else {
		return {
			editStyle: 'tiles',
			placingID: id,
			showTiles: true,
			showWall: false,
			lockY: false,
			placingRotation: rotation,
		};
	}
}

export const IdToString: string[] = [];

for (const name in TileType) {
	IdToString[(TileType as Record<string, number>)[name]] = name;
}

export const Direction = {
	Default: 1,
	Right: 2,
	UpsideDown: 3,
	Left: 0,
};
export const WallType = {
	Flat: 1,
	Down: 2,
	Up: 3,
	Spike: 4,
};

export const mask = `        
5555   1h
5555   1h
5005   1h
5000   1h
5050   xh
5..5   3h
       2
.00.   3
5555   1h
    02 4
111100 2
5055   1h
5000   1
****   5
100100 2
5555   1h
5555   1h
    04 4
5555   1h
5555   1h
    00 2
    80 6
    81 6
       5
       5
        
        
        
        
    06 4
    82 4h
5555   1h
0660   6
0660    
0660    
0660    
0660    
0660    
        
        
5665   6h
5555    h
5555   6h
    08 4
0600   6
0600   
0600   
0600   
5775   6h
5775   6h






    09 4
    84 4
    60 7
    10 4
    11 4
       5




5555   1h
    12 5
    00 5
    00 2
6600   6
100181 6
....   3h
    13 4
    00 5
.      3h
   .   3h
1111   2h
1111   5h
5115   2h
5111   2h
.00.   3h
111100 2
****00 5
5555   1h`;

let maskIndex = 0;

export const unknown_1 = maskIndex++;
export const unknown_2 = maskIndex++;
export const unknown_3 = maskIndex++;
export const unknown_4 = maskIndex++;
export const unknown_5 = maskIndex++;
export const unknown_6 = maskIndex++;
export const unknown_7 = maskIndex++;
export const mask_category = maskIndex++;

export const categories: number[][] = [[], [], [], [], [], [], []];
export const rotatables: number[] = [
	TileType.Checkpoint2,
	TileType.End1,
	TileType.Green1100,
	TileType.Green1111Bang,
	TileType.Launcher1111d2,
	TileType.Spring2,
	TileType.Launcher1111d,
	TileType.Crumble0010,
	TileType.Crumble00118,
	TileType.Convey2,
	TileType.Convey3,
	TileType.Lift2x2,
	TileType.Lift2x3,
	TileType.Lift2x4,
	TileType.Lock02,
	TileType.Saw2,
	TileType.Green0101,
	TileType.Spike2,
	TileType.Costume2,
	TileType.Costume3,
	TileType.AppleAttach,
	TileType.Stomp01,
	TileType.Costume1,
	TileType.Costume6,
	TileType.Green6,
	TileType.Green7,
	TileType.WormA,
	TileType.WormA2,
	TileType.Checkpoint9,
	TileType.Green1101,
	TileType.Unused,
];

let objIndex = 0;
for (const object of mask.split('\n')) {
	const category = object[mask_category];

	if (category) {
		categories[Number(category) - 1]?.push(objIndex + 1);
	}
	objIndex++;
}
