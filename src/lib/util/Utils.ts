import { promisify } from 'util';
import { exec as childProcessExec, ExecOptions, PromiseWithChild } from 'child_process';
/** @internal */
const REGEXPESC = /[-/\\^$*+?.()|[\]{}]/g;
/** @internal */
const PRIMITIVE_TYPES: string[] = ['string', 'boolean', 'bigint', 'number'];
/** @internal */
let sensitivePattern: RegExp | undefined;
/** @internal */
const zws = String.fromCharCode(8203);
/** @internal */
const TOTITLECASE = /[A-Za-zÀ-ÖØ-öø-ÿ]\S*/g;
/** @internal */
const titleCaseVariants: Record<string, string> = {
	textchannel: 'TextChannel',
	voicechannel: 'VoiceChannel',
	categorychannel: 'CategoryChannel',
	guildmember: 'GuildMember'
};

/** @internal */
type KeyedObject = Record<PropertyKey, unknown>;

/** @internal */
interface Thenable {
	then: Function;
	catch: Function;
}

/** @internal */
interface Stringifiable {
	toString(): string;
}

interface PromisifiedTimeout {
	(ms: number): Promise<void>;
	<T>(ms: number, value: T): Promise<T>;
}

interface PromisifiedExec {
	(command: string): PromiseWithChild<{ stdout: string, stderr: string }>;
	(command: string, options: { encoding: 'buffer' | null } & ExecOptions): PromiseWithChild<{ stdout: Buffer, stderr: Buffer }>;
	(command: string, options: { encoding: BufferEncoding } & ExecOptions): PromiseWithChild<{ stdout: string, stderr: string }>;
	(command: string, options: ExecOptions): PromiseWithChild<{ stdout: string, stderr: string }>;
	(command: string, options?: ({ encoding?: string | null } & ExecOptions) | null): PromiseWithChild<{ stdout: string | Buffer, stderr: string | Buffer }>;
}

/**
 * Compare if both arrays are strictly equal.
 * @param arr1 The first array to compare
 * @param arr2 The second array to compare
 */
export function arraysStrictEquals<T extends readonly unknown[]>(arr1: T, arr2: T): boolean {
	if (arr1 === arr2) return true;
	if (arr1.length !== arr2.length) return false;

	for (let i = 0; i < arr1.length; i++) {
		if (arr1[i] !== arr2[i]) return false;
	}

	return true;
}

/**
 * Splits up an array into chunks.
 * @param entries The array to split
 * @param chunkSize How many entries should be in each array
 */
export function chunk<T>(entries: readonly T[], chunkSize: number): T[][] {
	if (!Array.isArray(entries)) throw new TypeError('entries must be an array.');
	if (!Number.isInteger(chunkSize)) throw new TypeError('chunkSize must be an integer.');
	if (chunkSize < 1) throw new RangeError('chunkSize must be 1 or greater.');
	const clone: T[] = entries.slice();
	const chunks: T[][] = [];
	while (clone.length) chunks.push(clone.splice(0, chunkSize));
	return chunks;
}

/**
 * Cleans sensitive info from strings.
 * @param text The text to clean
 */
export function clean(text: string): string {
	if (typeof sensitivePattern === 'undefined') throw new Error('initClean must be called before running this.');
	return text.replace(sensitivePattern, '「ｒｅｄａｃｔｅｄ」').replace(/`/g, `\`${zws}`).replace(/@/g, `@${zws}`);
}

/**
 * Initializes the sensitive pattern for clean().
 * @param token The token to clean
 */
export function initClean(token: string): void {
	sensitivePattern = new RegExp(regExpEsc(token), 'gi');
}

/**
 * Makes a codeblock markup string.
 * @param lang The codeblock language
 * @param expression The expression to be wrapped in the codeblock
 */
export function codeBlock(lang: string, expression: Stringifiable): string {
	return `\`\`\`${lang}\n${expression || zws}\`\`\``;
}

/**
 * Deep clone a value.
 * @param source The object to clone
 */
export function deepClone<T>(source: T): T {
	if (source === null || isPrimitive(source)) return source;
	if (Array.isArray(source)) {
		const output = [] as unknown as T & T extends (infer S)[] ? S[] : never;
		for (const value of source) output.push(deepClone(value));
		return output as unknown as T;
	}
	if (isObject(source)) {
		const output = {} as KeyedObject;
		for (const [key, value] of Object.entries(source)) output[key] = deepClone(value);
		return output as unknown as T;
	}
	if (source instanceof Map) {
		const output = new (source.constructor as MapConstructor)() as unknown as T & T extends Map<infer K, infer V> ? Map<K, V> : never;
		for (const [key, value] of source.entries()) output.set(key, deepClone(value));
		return output as unknown as T;
	}
	if (source instanceof Set) {
		const output = new (source.constructor as SetConstructor)() as unknown as T & T extends Set<infer K> ? Set<K> : never;
		for (const value of source.values()) output.add(deepClone(value));
		return output as unknown as T;
	}
	return source;
}

/**
 * Promisified version of child_process.exec for use with await.
 * @param command The command to run
 * @param options The options to pass to exec
 */
export const exec: PromisifiedExec = promisify(childProcessExec);

/**
 * Verify if the input is a class constructor.
 * @param input The function to verify
 */
export function isClass(input: unknown): boolean {
	return typeof input === 'function' &&
		typeof input.prototype === 'object' &&
		input.toString().substring(0, 5) === 'class';
}

/**
 * Verify if the input is a function.
 * @param input The function to verify
 */
export function isFunction(input: unknown): input is Function {
	return typeof input === 'function';
}

/**
 * Verify if a number is a finite number.
 * @param input The number to verify
 */
export function isNumber(input: unknown): input is number {
	return typeof input === 'number' && !isNaN(input) && Number.isFinite(input);
}

/**
 * Verify if the input is an object literal (or class).
 * @param input The object to verify
 */
export function isObject(input: unknown): input is (KeyedObject | object) {
	return typeof input === 'object' && input?.constructor === Object;
}

/**
 * Check whether a value is a primitive.
 * @param input The input to check
 */
export function isPrimitive(input: unknown): input is (string | bigint | number | boolean) {
	return PRIMITIVE_TYPES.includes(typeof input);
}

/** @internal */
function hasThen(input: { then?: Function }): boolean {
	return Reflect.has(input, 'then') && isFunction(input.then);
}

/** @internal */
function hasCatch(input: { catch?: Function }): boolean {
	return Reflect.has(input, 'catch') && isFunction(input.catch);
}

/**
 * Verify if an input object is a promise.
 * @param input The promise to verify
 */
export function isThenable(input: unknown): input is Thenable {
	if (typeof input !== 'object' || input === null) return false;
	return (input instanceof Promise) ||
		(input !== Promise.prototype && hasThen(input) && hasCatch(input));
}

/**
 * Turn a dotted path into a json object
 * @param path The dotted path
 * @param value The value
 * @param obj The object to edit
 */
export function makeObject(path: string, value: unknown, obj: Record<string, unknown> = {}): Record<string, unknown> {
	if (path.indexOf('.') === -1) {
		obj[path] = value;
	} else {
		const route = path.split('.');
		const lastKey = route.pop()!;
		let reference = obj;
		for (const key of route) {
			if (!reference[key]) reference[key] = {};
			reference = reference[key] as Record<string, unknown>;
		}
		reference[lastKey] = value;
	}
	return obj;
}

/**
 * Sets default properties on an object that aren't already specified.
 * @param defaults Default properties
 * @param given Object to assign defaults to
 */
export function mergeDefault<A extends KeyedObject | object, B extends Partial<A>>(defaults: A, given?: B): A & B {
	if (!given) return deepClone(defaults) as A & B;
	for (const key in defaults) {
		if (typeof given[key] === 'undefined') {
			given[key] = deepClone(defaults[key]) as unknown as B[Extract<keyof A, string>];
		} else if (isObject(given[key])) {
			given[key] = mergeDefault(defaults[key] as unknown as KeyedObject, given[key] as unknown as KeyedObject) as unknown as B[Extract<keyof A, string>];
		}
	}

	return given as A & B;
}

/**
 * Merges two objects.
 * @param objTarget The object to be merged
 * @param objSource The object to merge
 */
export function mergeObjects<A extends KeyedObject | object, B extends KeyedObject>(objTarget: A, objSource: B): A & B {
	for (const [key, value] of Object.entries(objSource) as [keyof B, unknown][]) {
		const targetValue = (objTarget as KeyedObject)[key];
		if (isObject(value)) {
			Reflect.set(objTarget, key, isObject(targetValue) ? mergeObjects(targetValue as KeyedObject, value as KeyedObject) : value);
		} else if (!isObject(targetValue)) {
			Reflect.set(objTarget, key, value);
		}
	}

	return objTarget as A & B;
}

/**
 * Convert an object to a tuple.
 * @param original The object to convert
 * @param prefix The prefix for the key
 */
export function objectToTuples(original: Record<string, unknown>, prefix = ''): [string, unknown][] {
	const entries: [string, unknown][] = [];
	for (const [key, value] of Object.entries(original)) {
		if (isObject(value)) {
			entries.push(...objectToTuples(value as Record<string, unknown>, `${prefix}${key}.`));
		} else {
			entries.push([`${prefix}${key}`, value]);
		}
	}

	return entries;
}

/**
 * Cleans a string from regex injection.
 * @param str The string to clean
 */
export function regExpEsc(str: string): string {
	return str.replace(REGEXPESC, '\\$&');
}

/**
 * Promisified version of setTimeout for use with await.
 * @param delay The amount of time in ms to delay
 * @param args Any args to pass to the .then (mostly pointless in this form)
 */
export const sleep: PromisifiedTimeout = promisify(setTimeout);

/**
 * Converts a string to Title Case.
 * @param str The string to title case
 */
export function toTitleCase(str: string): string {
	return str.replace(TOTITLECASE, (txt): string => titleCaseVariants[txt] || txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

/**
 * Try parse a stringified JSON string.
 * @param value The value to parse
 */
export function tryParse(value: string): object | string {
	try {
		return JSON.parse(value);
	} catch {
		return value;
	}
}
