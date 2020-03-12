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
