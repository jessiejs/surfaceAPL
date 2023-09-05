import { FireguardRule, fireguardRules } from "./basic";

export function heuristic(rule:FireguardRule, src: string):number {
	switch (rule[0]) {
		case 'ADD':
			return (rule.slice(1) as FireguardRule[]).map(h => heuristic(h, src)).reduce((a, b) => a + b, 0);
		case 'SUB':
			return heuristic(rule[1], src) - heuristic(rule[2], src);
		case 'MUL':
			return heuristic(rule[1], src) * heuristic(rule[2], src);
		case 'DIV':
			return heuristic(rule[1], src) / heuristic(rule[2], src);
		case 'STATIC':
			return rule[1];
		case 'REGEX':
			return rule[1].test(src) ? rule[2] : 0;
		case 'STR':
			return rule[1].includes(src) ? rule[2] : 0;
		case 'OR':
			return (rule.slice(1) as FireguardRule[]).map(h => heuristic(h, src)).reduce((a, b) => a + b, 0);
		case 'XOR':
			const heuristics = [heuristic(rule[1], src), heuristic(rule[2], src)];
			return Math.max(...heuristics) - Math.min(...heuristics);
		case 'AND':
			return (rule.slice(1) as FireguardRule[]).map(h => heuristic(h, src)).reduce((a, b) => Math.min(a,b), 0);
	}
}

export function stringify(rule:FireguardRule):string {
	switch (rule[0]) {
		case 'ADD':
			return `${(rule.slice(1) as FireguardRule[]).map(h => stringify(h)).join(' + ')}`;
		case 'SUB':
			return `(${stringify(rule[1])} - ${stringify(rule[2])})`;
		case 'MUL':
			return `(${stringify(rule[1])} * ${stringify(rule[2])})`;
		case 'DIV':
			return `(${stringify(rule[1])} / ${stringify(rule[2])})`;
		case 'STATIC':
			return `${rule[1]}`;
		case 'REGEX':
			return `(${rule[2]} if matches ${JSON.stringify(rule[1])})`;
		case 'STR':
			return `(${rule[2]} if contains ${JSON.stringify(rule[1])})`;
		case 'OR':
			return `(${(rule.slice(1) as FireguardRule[]).map(h => stringify(h)).join(' + ')})`;
		case 'XOR':
			return `XOR(${stringify(rule[1])}, ${stringify(rule[2])})`;
		case 'AND':
			return `AND(${(rule.slice(1) as FireguardRule[]).map(h => stringify(h)).join(', ')})`;
	}
}

console.log(stringify(fireguardRules[0]));
