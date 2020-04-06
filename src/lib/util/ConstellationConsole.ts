import { Console } from 'console';
import { inspect } from 'util';
import { Timestamp } from './Timestamp';
import { ConsoleUtils } from './Constants';
import { Colors } from './Colors';
import { mergeDefault } from './Utils';
import type { DeepRequired } from './SharedTypes';
import type { WriteStream } from 'tty';

export interface ConsoleMessageObject {
	background?: keyof typeof Colors.BACKGROUNDS | null;
	style?: keyof typeof Colors.STYLES | null;
	text?: keyof typeof Colors.TEXTS | null;
}

export interface ConsoleTimeObject {
	background?: keyof typeof Colors.BACKGROUNDS | null;
	style?: keyof typeof Colors.STYLES | null;
	text?: keyof typeof Colors.TEXTS | null;
}

export interface ConsoleEvents {
	debug?: boolean;
	error?: boolean;
	log?: boolean;
	verbose?: boolean;
	warn?: boolean;
	wtf?: boolean;
}

export interface ConsoleColorObjects {
	message?: ConsoleMessageObject;
	time?: ConsoleTimeObject;
}

export interface ConsoleColorStyles {
	debug?: ConsoleColorObjects;
	error?: ConsoleColorObjects;
	info?: ConsoleColorObjects;
	log?: ConsoleColorObjects;
	verbose?: ConsoleColorObjects;
	warn?: ConsoleColorObjects;
	wtf?: ConsoleColorObjects;
}

export interface ConsoleOptions {
	utc?: boolean;
	colors?: ConsoleColorStyles;
	stderr?: NodeJS.WritableStream;
	stdout?: NodeJS.WritableStream;
	timestamps?: boolean | string;
	useColor?: boolean;
}

/**
 * Constellation's Console class, extends NodeJS' console.
 */
export class ConstellationConsole extends Console {

	/**
	 * The standard output stream for this console, defaults to process.stdout
	 */
	public readonly stdout!: NodeJS.WritableStream;

	/**
	 * The standard error stream for this console, defaults to process.stderr
	 */
	public readonly stderr!: NodeJS.WritableStream;

	/**
	 * The template for Timestamps in the console, if enabled
	 */
	public template: Timestamp | null;

	/**
	 * The colors for this console
	 */
	public colors: DeepRequired<ConsoleColorStyles>;

	/**
	 * Whether the timestamp should be in utc or not
	 */
	public utc: boolean;

	/**
	 * Construct our ConstellationConsole instance
	 * @param options The options for the constellation console
	 */
	public constructor(options: ConsoleOptions = {}) {
		options = mergeDefault(ConsoleUtils.defaults, options);

		super(options.stdout!, options.stderr!);

		Object.defineProperty(this, 'stdout', { value: options.stdout! });

		Object.defineProperty(this, 'stderr', { value: options.stderr! });

		Colors.useColors = typeof options.useColor === 'undefined' ? (this.stdout as unknown as WriteStream).isTTY ?? false : options.useColor!;

		this.template = options.timestamps !== false ? new Timestamp(options.timestamps === true ? 'YYYY-MM-DD HH:mm:ss' : options.timestamps!) : null;

		/* eslint-disable @typescript-eslint/ban-ts-ignore */
		// @ts-ignore
		this.colors = {};

		for (const [name, formats] of Object.entries(options.colors!) as [keyof ConsoleColorStyles, ConsoleColorStyles[keyof ConsoleColorStyles]][]) {
			// @ts-ignore
			this.colors[name] = {};
			// @ts-ignore
			for (const [type, format] of Object.entries(formats!)) this.colors[name][type] = new Colors(format);
		}

		/* eslint-enable @typescript-eslint/ban-ts-ignore */

		this.utc = options.utc!;
	}

	/**
	 * The timestamp to use
	 */
	private get timestamp(): string {
		return (this.utc ? this.template?.displayUTC() : this.template?.display()) ?? '';
	}

	/**
	 * Calls a log write with everything to the console/writable stream.
	 * @param data The data we want to print
	 */
	public log(...data: any[]): void {
		this.write(data, 'log');
	}

	/**
	 * Calls a warn write with everything to the console/writable stream.
	 * @param data The data we want to print
	 */
	public warn(...data: any[]): void {
		this.write(data, 'warn');
	}

	/**
	 * Calls an error write with everything to the console/writable stream.
	 * @param data The data we want to print
	 */
	public error(...data: any[]): void {
		this.write(data, 'error');
	}

	/**
	 * Calls a debug write with everything to the console/writable stream.
	 * @param data The data we want to print
	 */
	public debug(...data: any[]): void {
		this.write(data, 'debug');
	}

	/**
	 * Calls a verbose write with everything to the console/writable stream.
	 * @param data The data we want to print
	 */
	public verbose(...data: any[]): void {
		this.write(data, 'verbose');
	}

	/**
	 * Calls a wtf (what a terrible failure) write with everything to the console/writable stream.
	 * @param data The data we want to print
	 */
	public wtf(...data: any[]): void {
		this.write(data, 'wtf');
	}

	/**
	 * Logs everything to the console/writable stream.
	 * @param data The data we want to print
	 * @param type The type of log, particularly useful for coloring
	 */
	private write(data: any[], type: keyof ConsoleColorStyles = 'log'): void {
		const toWrite = data.map(ConstellationConsole._flatten).join('\n');
		const { time, message } = this.colors[type];
		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore
		const timestamp = this.template ? time.format(`[${this.timestamp}]`) : '';
		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore
		super[ConsoleUtils.types[type] || 'log'](toWrite.split('\n').map((str): string => `${timestamp} ${message.format(str)}`).join('\n'));
	}

	/**
	 * Flattens our data into a readable string.
	 * @param data Some data to flatten
	 */
	private static _flatten(data: any): string {
		switch (typeof data) {
			case 'object': {
				if (data === null) return String(data);
				if (Array.isArray(data) && data.every((datum: unknown): boolean => typeof datum === 'string')) return data.join('\n');
				return ((data as Error).stack ?? data.message) || inspect(data, { depth: Number(Array.isArray(data)), colors: Boolean(Colors.useColors) });
			}
			case 'string': return data;
			default: return String(data);
		}
	}

}
