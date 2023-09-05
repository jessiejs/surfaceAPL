export const fireguardRules: FireguardRule[] = [
	// Payload downloading
	[
		'AND',
		[
			'OR',
			['STR', 'XMLHttpRequest', 1],
			['STR', 'fetch', 1],
			['STR', 'sendBeacon', 1],
		],
		['STR', 'eval', 1],
	],
];

export type FireguardRule =
	| ['OR', ...FireguardRule[]]
	| ['XOR', FireguardRule, FireguardRule]
	| ['AND', ...FireguardRule[]]
	| ['ADD', ...FireguardRule[]]
	| ['SUB', FireguardRule, FireguardRule]
	| ['MUL', FireguardRule, FireguardRule]
	| ['DIV', FireguardRule, FireguardRule]
	| ['STATIC', number]
	| ['REGEX', RegExp, number]
	| ['STR', string, number];
