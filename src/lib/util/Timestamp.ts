import { TimestampUtils } from './Constants';

/** @internal */
interface TokenResolver {
	(time: Date): string;
}

/* eslint-disable max-len */
/** @internal */
const tokens = new Map<string, TokenResolver>([
	// Dates
	['Y', (time): string => String(time.getFullYear()).slice(2)],
	['YY', (time): string => String(time.getFullYear()).slice(2)],
	['YYY', (time): string => String(time.getFullYear())],
	['YYYY', (time): string => String(time.getFullYear())],
	['Q', (time): string => String((time.getMonth() + 1) / 3)],
	['M', (time): string => String(time.getMonth() + 1)],
	['MM', (time): string => String(time.getMonth() + 1).padStart(2, '0')],
	['MMM', (time): string => TimestampUtils.MONTHS[time.getMonth()]],
	['MMMM', (time): string => TimestampUtils.MONTHS[time.getMonth()]],
	['D', (time): string => String(time.getDate())],
	['DD', (time): string => String(time.getDate()).padStart(2, '0')],
	['DDD', (time): string => String(Math.floor((time.getTime() - new Date(time.getFullYear(), 0, 0).getTime()) / TimestampUtils.Time.Day))],
	['DDDD', (time): string => String(Math.floor((time.getTime() - new Date(time.getFullYear(), 0, 0).getTime()) / TimestampUtils.Time.Day))],
	['d', (time): string => {
		const day = String(time.getDate());
		if (day !== '11' && day.endsWith('1')) return `${day}st`;
		if (day !== '12' && day.endsWith('2')) return `${day}nd`;
		if (day !== '13' && day.endsWith('3')) return `${day}rd`;
		return `${day}th`;
	}],
	['dd', (time): string => TimestampUtils.DAYS[time.getDay()].slice(0, 2)],
	['ddd', (time): string => TimestampUtils.DAYS[time.getDay()].slice(0, 3)],
	['dddd', (time): string => TimestampUtils.DAYS[time.getDay()]],
	['X', (time): string => String(time.valueOf() / TimestampUtils.Time.Second)],
	['x', (time): string => String(time.valueOf())],

	// Locales
	['H', (time): string => String(time.getHours())],
	['HH', (time): string => String(time.getHours()).padStart(2, '0')],
	['h', (time): string => String(time.getHours() % 12 || 12)],
	['hh', (time): string => String(time.getHours() % 12 || 12).padStart(2, '0')],
	['a', (time): string => time.getHours() < 12 ? 'am' : 'pm'],
	['A', (time): string => time.getHours() < 12 ? 'AM' : 'PM'],
	['m', (time): string => String(time.getMinutes())],
	['mm', (time): string => String(time.getMinutes()).padStart(2, '0')],
	['s', (time): string => String(time.getSeconds())],
	['ss', (time): string => String(time.getSeconds()).padStart(2, '0')],
	['S', (time): string => String(time.getMilliseconds())],
	['SS', (time): string => String(time.getMilliseconds()).padStart(2, '0')],
	['SSS', (time): string => String(time.getMilliseconds()).padStart(3, '0')],
	['T', (time): string => `${String(time.getHours() % 12 || 12)}:${String(time.getMinutes()).padStart(2, '0')} ${time.getHours() < 12 ? 'AM' : 'PM'}`],
	['t', (time): string => `${String(time.getHours() % 12 || 12)}:${String(time.getMinutes()).padStart(2, '0')}:${String(time.getSeconds()).padStart(2, '0')} ${time.getHours() < 12 ? 'am' : 'pm'}`],
	['L', (time): string => `${String(time.getMonth() + 1).padStart(2, '0')}/${String(time.getDate()).padStart(2, '0')}/${String(time.getFullYear())}`],
	['l', (time): string => `${String(time.getMonth() + 1)}/${String(time.getDate()).padStart(2, '0')}/${String(time.getFullYear())}`],
	['LL', (time): string => `${TimestampUtils.MONTHS[time.getMonth()]} ${String(time.getDate()).padStart(2, '0')}, ${String(time.getFullYear())}`],
	['ll', (time): string => `${TimestampUtils.MONTHS[time.getMonth()].slice(0, 3)} ${String(time.getDate()).padStart(2, '0')}, ${String(time.getFullYear())}`],
	['LLL', (time): string => `${TimestampUtils.MONTHS[time.getMonth()]} ${String(time.getDate()).padStart(2, '0')}, ${String(time.getFullYear())} ${String(time.getHours() % 12 || 12)}:${String(time.getMinutes()).padStart(2, '0')} ${time.getHours() < 12 ? 'AM' : 'PM'}`],
	['lll', (time): string => `${TimestampUtils.MONTHS[time.getMonth()].slice(0, 3)} ${String(time.getDate()).padStart(2, '0')}, ${String(time.getFullYear())} ${String(time.getHours() % 12 || 12)}:${String(time.getMinutes()).padStart(2, '0')} ${time.getHours() < 12 ? 'AM' : 'PM'}`],
	['LLLL', (time): string => `${TimestampUtils.DAYS[time.getDay()]}, ${TimestampUtils.MONTHS[time.getMonth()]} ${String(time.getDate()).padStart(2, '0')}, ${String(time.getFullYear())} ${String(time.getHours() % 12 || 12)}:${String(time.getMinutes()).padStart(2, '0')} ${time.getHours() < 12 ? 'AM' : 'PM'}`],
	['llll', (time): string => `${TimestampUtils.DAYS[time.getDay()].slice(0, 3)} ${TimestampUtils.MONTHS[time.getMonth()].slice(0, 3)} ${String(time.getDate()).padStart(2, '0')}, ${String(time.getFullYear())} ${String(time.getHours() % 12 || 12)}:${String(time.getMinutes()).padStart(2, '0')} ${time.getHours() < 12 ? 'AM' : 'PM'}`],
	['Z', (time): string => {
		const offset = time.getTimezoneOffset();
		const unsigned = offset >= 0, absolute = Math.abs(offset);
		return `${unsigned ? '+' : '-'}${String(Math.floor(absolute / 60)).padStart(2, '0')}:${String(absolute % 60).padStart(2, '0')}`;
	}],
	['ZZ', (time): string => {
		const offset = time.getTimezoneOffset();
		const unsigned = offset >= 0, absolute = Math.abs(offset);
		return `${unsigned ? '+' : '-'}${String(Math.floor(absolute / 60)).padStart(2, '0')}:${String(absolute % 60).padStart(2, '0')}`;
	}]
]);
/* eslint-enable max-len */

/**
 * Something that can be resolved into a form of time
 */
export type TimeResolvable = Date | number | string;

/**
 * A template entry
 * @private
 */
export interface TimestampTemplateEntry {
	type: string;
	content: string | null;
}

/**
 * Timestamp class, useful for parsing and displaying dates and time.
 */
export class Timestamp {

	/**
	 * The raw pattern
	 */
	public pattern: string;

	/**
	 * The raw template
	 */
	private _template: TimestampTemplateEntry[];

	/**
	 * Starts a new Timestamp and parses the pattern.
	 * @param pattern The pattern to parse
	 */
	public constructor(pattern: string) {
		this.pattern = pattern;
		this._template = Timestamp._parse(pattern);
	}

	/**
	 * Display the current date with the current pattern.
	 * @param time The time to display
	 */
	public display(time: TimeResolvable = new Date()): string {
		return Timestamp._display(this._template, time);
	}

	/**
	 * Display the current date utc with the current pattern.
	 * @param time The time to display in utc
	 */
	public displayUTC(time: TimeResolvable): string {
		return Timestamp._display(this._template, Timestamp.utc(time));
	}

	/**
	 * Edits the current pattern.
	 * @param pattern The new pattern for this instance
	 * @chainable
	 */
	public edit(pattern: string): this {
		this.pattern = pattern;
		this._template = Timestamp._parse(pattern);
		return this;
	}

	/**
	 * Defines the toString behavior of this Timestamp.
	 */
	public toString(): string {
		return this.display();
	}

	/**
	 * Display the current date with the current pattern.
	 * @param pattern The pattern to parse
	 * @param time The time to display
	 */
	public static displayArbitrary(pattern: string, time: TimeResolvable = new Date()): string {
		return Timestamp._display(Timestamp._parse(pattern), time);
	}

	/**
	 * Creates a UTC Date object to work with.
	 * @param time The date to convert to utc
	 */
	public static utc(time: TimeResolvable = new Date()): Date {
		time = Timestamp._resolveDate(time);
		return new Date(time.valueOf() + (time.getTimezoneOffset() * 60000));
	}

	/**
	 * Display the current date with the current pattern.
	 * @param template The pattern to parse
	 * @param time The time to display
	 */
	private static _display(template: TimestampTemplateEntry[], time: TimeResolvable): string {
		let output = '';
		const parsedTime = Timestamp._resolveDate(time);
		for (const { content, type } of template) output += content || tokens.get(type)!(parsedTime);
		return output;
	}

	/**
	 * Parses the raw pattern.
	 * @param pattern The pattern to parse
	 */
	private static _parse(pattern: string): TimestampTemplateEntry[] {
		const template = [];
		for (let i = 0; i < pattern.length; i++) {
			let current = '';
			const currentChar = pattern[i];
			const tokenMax = TimestampUtils.TOKENS.get(currentChar);
			if (typeof tokenMax === 'number') {
				current += currentChar;
				while (pattern[i + 1] === currentChar && current.length < tokenMax) current += pattern[++i];
				template.push({ type: current, content: null });
			} else if (currentChar === '[') {
				while (i + 1 < pattern.length && pattern[i + 1] !== ']') current += pattern[++i];
				i++;
				template.push({ type: 'literal', content: current });
			} else {
				current += currentChar;
				while (i + 1 < pattern.length && !TimestampUtils.TOKENS.has(pattern[i + 1]) && pattern[i + 1] !== '[') current += pattern[++i];
				template.push({ type: 'literal', content: current });
			}
		}

		return template;
	}

	/**
	 * Resolves a date.
	 * @param time The time to parse
	 */
	private static _resolveDate(time: TimeResolvable): Date {
		return time instanceof Date ? time : new Date(time);
	}

}
