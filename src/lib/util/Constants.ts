/* eslint-disable @typescript-eslint/no-namespace */

/** @internal */
export namespace TimestampUtils { // eslint-disable-line @typescript-eslint/no-namespace
	/** @internal */
	export const enum Time {
		Second = 1000,
		Minute = Second * 60,
		Hour = Minute * 60,
		Day = Hour * 24
	}
	/** @internal */
	export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	/** @internal */
	export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	/** @internal */
	export const TOKENS = new Map<string, number>([
		['Y', 4],
		['Q', 1],
		['M', 4],
		['D', 4],
		['d', 4],
		['X', 1],
		['x', 1],
		['H', 2],
		['h', 2],
		['a', 1],
		['A', 1],
		['m', 2],
		['s', 2],
		['S', 3],
		['Z', 2],
		['l', 4],
		['L', 4],
		['T', 1],
		['t', 1]
	]);
}

/** @internal */
export namespace CronUtils {
	export const partRegex = /^(?:(\*)|(\d+)(?:-(\d+))?)(?:\/(\d+))?$/;
	export const wildcardRegex = /\bh\b|\B\?\B/g;
	export const allowedNum = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 6]];
	export const predefined: Record<string, string> = {
		'@annually': '0 0 1 1 *',
		'@yearly': '0 0 1 1 *',
		'@monthly': '0 0 1 * *',
		'@weekly': '0 0 * * 0',
		'@daily': '0 0 * * *',
		'@hourly': '0 * * * *'
	};

	export const tokens: Record<string, number> = {
		jan: 1,
		feb: 2,
		mar: 3,
		apr: 4,
		may: 5,
		jun: 6,
		jul: 7,
		aug: 8,
		sep: 9,
		oct: 10,
		nov: 11,
		dec: 12,
		sun: 0,
		mon: 1,
		tue: 2,
		wed: 3,
		thu: 4,
		fri: 5,
		sat: 6
	};

	export const tokensRegex = new RegExp(Object.keys(tokens).join('|'), 'g');
}
