import {
	arrayStrictEquals,
	chunk,
	initClean,
	clean,
	codeBlock,
	deepClone,
	exec,
	isClass,
	isFunction,
	isNumber,
	isObject,
	isPrimitive,
	isThenable,
	makeObject,
	mergeDefault,
	mergeObjects,
	objectToTuples,
	regExpEsc,
	sleep,
	toTitleCase,
	tryParse
} from '../src';

import { lineEndings } from './lib/utils';

describe('arrayStrictEquals', (): void => {
	test('reference', (): void => {
		const array: undefined[] = [];

		expect(arrayStrictEquals(array, array)).toBe(true);
	});

	test('identical', (): void => {
		expect(arrayStrictEquals([], [])).toBe(true);

		expect(arrayStrictEquals([5, 2, 1], [5, 2, 1])).toBe(true);
	});

	test('different-order', (): void => {
		expect(arrayStrictEquals([0, 1, 2], [2, 1, 0])).toBe(false);
	});

	test('different-length', (): void => {
		expect(arrayStrictEquals([1], [])).toBe(false);
	});

	test('different-values', (): void => {
		expect(arrayStrictEquals([1, 2, 5], [1, 2, 4])).toBe(false);
	});
});

describe('chunk', (): void => {
	test('basic', (): void => {
		const entries = [0, 1, 2, 3, 4, 5];
		const chunkSize = 2;
		const expected = [[0, 1], [2, 3], [4, 5]];
		expect(chunk(entries, chunkSize)).toStrictEqual(expected);
	});

	test('too-short', (): void => {
		const entries = [0, 1, 2, 3, 4, 5];
		const chunkSize = 0;

		expect((): any => chunk(entries, chunkSize)).toThrow('chunkSize must be 1 or greater.');
		expect((): any => chunk(entries, chunkSize)).toThrow(RangeError);
	});

	test('non-integer', (): void => {
		const entries = [0, 1, 2, 3, 4, 5];
		const chunkSize = 1.5;

		expect((): any => chunk(entries, chunkSize)).toThrow('chunkSize must be an integer.');
		expect((): any => chunk(entries, chunkSize)).toThrow(TypeError);
	});

	test('non-array', (): void => {
		const entries = {} as unknown as unknown[];
		const chunkSize = 2;
		expect((): any => chunk(entries, chunkSize)).toThrow('entries must be an array.');
		expect((): any => chunk(entries, chunkSize)).toThrow(TypeError);
	});
});

// Jest makes it difficult to run tests in series, so all the tests are in one test block.
test('clean', (): void => {
	const token = 'MzM5OTQyNzM5Mjc1Njc3NzI3.4qyqwg.WjrWfDaMQdCP8xVn7P0va5gujmh';
	const zws = String.fromCharCode(8203);

	expect((): any => clean(token)).toThrow('initClean must be called before running this.');
	expect((): any => clean(token)).toThrow(Error);

	expect(initClean(token)).toBeUndefined();

	expect(clean(token)).toBe('「ｒｅｄａｃｔｅｄ」');

	expect(clean(`${token}${token}`)).toBe('「ｒｅｄａｃｔｅｄ」「ｒｅｄａｃｔｅｄ」');

	expect(clean(token.toLowerCase())).toBe('「ｒｅｄａｃｔｅｄ」');

	expect(clean('`Hello')).toBe(`\`${zws}Hello`);

	expect(clean('@Hello')).toBe(`@${zws}Hello`);
});

describe('codeBlock', (): void => {
	const zws = String.fromCharCode(8203);
	const language = 'js';

	test('basic', (): void => {
		const expression = 'Hello World';
		const expected = '```js\nHello World```';
		expect(codeBlock(language, expression)).toBe(expected);
	});

	test('empty', (): void => {
		const expression = '';
		const expected = `\`\`\`js\n${zws}\`\`\``;
		expect(codeBlock(language, expression)).toBe(expected);
	});
});

describe('deepClone', (): void => {
	test('null', (): void => {
		expect(deepClone(null)).toBeNull();
	});

	test('string', (): void => {
		expect(deepClone('Hello')).toBe('Hello');
	});

	test('number', (): void => {
		expect(deepClone(42069)).toBe(42069);
	});

	test('bigint', (): void => {
		// eslint-disable-next-line no-undef
		const source = BigInt(42069);
		expect(deepClone(source)).toBe(source);
	});

	test('boolean', (): void => {
		expect(deepClone(true)).toBe(true);
	});

	test('symbol', (): void => {
		const source = Symbol('Constellations');
		expect(deepClone(source)).toBe(source);
	});

	test('function', (): void => {
		const fn = (): void => { }; // eslint-disable-line @typescript-eslint/no-empty-function
		expect(deepClone(fn)).toBe(fn);
	});

	test('array', (): void => {
		const source = [1, 2, 3];
		const clone = deepClone(source);

		expect(source).not.toBe(clone);
		expect(source).toStrictEqual(clone);
	});

	test('array-nested', (): void => {
		const source: [number, number, number, (number | number[])[]] = [1, 2, 3, [4, 5, [6, 7, 8]]];
		const clone = deepClone(source);

		expect(source).not.toBe(clone);
		expect(source[3]).not.toBe(clone[3]);
		expect(source[3][2]).not.toBe(clone[3][2]);
		expect(source).toStrictEqual(clone);
	});

	test('object', (): void => {
		const source = { a: 1, b: 2 };
		const clone = deepClone(source);

		expect(source).not.toBe(clone);
		expect(source).toStrictEqual(clone);
	});

	test('object-nested', (): void => {
		const source = { ab: 1, cd: 2, ef: { gh: 3, ij: 4, kl: [1] } };
		const clone = deepClone(source);

		expect(source).not.toBe(clone);
		expect(source.ef).not.toBe(clone.ef);
		expect(source.ef.kl).not.toBe(clone.ef.kl);
		expect(source).toStrictEqual(clone);
	});

	test('map', (): void => {
		const source = new Map<string, string | number>([
			['Hello', 420],
			['World', 'Yay!']
		]);

		const clone = deepClone(source);

		expect(source).not.toBe(clone);
		expect(clone).toBeInstanceOf(Map);
		expect(clone.size).toBe(2);
		expect(clone.get('Hello')).toBe(420);
		expect(clone.get('World')).toBe('Yay!');
	});

	test('set', (): void => {
		const source = new Set([
			'Hello',
			'World'
		]);

		const clone = deepClone(source);
		expect(source).not.toBe(clone);
		expect(clone).toBeInstanceOf(Set);
		expect(clone.size).toBe(2);
		expect(clone.has('Hello')).toBe(true);
		expect(clone.has('World')).toBe(true);
	});
});

describe('exec', (): void => {
	test('basic', async (): Promise<void> => {
		const result = await exec('echo 1');
		expect(result.stdout).toBe(`1${lineEndings}`);
		expect(result.stderr).toBe('');
	});

	test('buffer', async (): Promise<void> => {
		const result = await exec('echo 1', { encoding: 'buffer' });
		expect(result.stdout).toStrictEqual(Buffer.from(`1${lineEndings}`));
		expect(result.stderr).toStrictEqual(Buffer.from(''));
	});
});

describe('isClass', (): void => {
	test('string', (): void => {
		expect(isClass('Hello World')).toBe(false);
	});

	test('number', (): void => {
		expect(isClass(42060)).toBe(false);
	});

	test('bigint', (): void => {
		// eslint-disable-next-line no-undef
		expect(isClass(BigInt(42069))).toBe(false);
	});

	test('boolean', (): void => {
		expect(isClass(false)).toBe(false);
		expect(isClass(true)).toBe(false);
	});

	test('undefined', (): void => {
		expect(isClass(undefined)).toBe(false);
	});

	test('object', (): void => {
		expect(isClass({ class: '' })).toBe(false);
	});

	test('object-null', (): void => {
		expect(isClass(null)).toBe(false);
	});

	test('function', (): void => {
		// eslint-disable-next-line func-style
		const value = function myClass(): void {
			/* noop */
		};
		expect(isClass(value)).toBe(false);
	});

	test('arrow', (): void => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		const value = (): void => { };
		expect(isClass(value)).toBe(false);
	});

	test('class', (): void => {
		/* eslint-disable id-length */
		class A { }
		expect(isClass(A)).toBe(true);
	});
});

describe('isFunction', (): void => {
	test('string', (): void => {
		expect(isFunction('Hello World')).toBe(false);
	});

	test('number', (): void => {
		expect(isFunction(42069)).toBe(false);
	});

	test('bigint', (): void => {
		// eslint-disable-next-line no-undef
		expect(isFunction(BigInt(42069))).toBe(false);
	});

	test('boolean', (): void => {
		expect(isFunction(true)).toBe(false);
		expect(isFunction(false)).toBe(false);
	});

	test('undefined', (): void => {
		expect(isFunction(undefined)).toBe(false);
	});

	test('object', (): void => {
		expect(isFunction({ class: '' })).toBe(false);
	});

	test('object-null', (): void => {
		expect(isFunction(null)).toBe(false);
	});

	test('function', (): void => {
		// eslint-disable-next-line func-style
		const value = function myClass(): void {
			/* noop */
		};

		expect(isFunction(value)).toBe(true);
	});

	test('arrow', (): void => {
		const value = (): void => { }; // eslint-disable-line @typescript-eslint/no-empty-function
		expect(isFunction(value)).toBe(true);
	});

	test('class', (): void => {
		class A { }
		expect(isFunction(A)).toBe(true);
	});
});

describe('isNumber', (): void => {
	test('string', (): void => {
		expect(isNumber('Hello World')).toBe(false);
	});

	test('number-integer', (): void => {
		expect(isNumber(42060)).toBe(true);
	});

	test('number-float', (): void => {
		expect(isNumber(-420.5)).toBe(true);
	});

	test('number-nan', (): void => {
		expect(isNumber(NaN)).toBe(false);
	});

	test('number-infinity', (): void => {
		expect(isNumber(Infinity)).toBe(false);
	});

	test('bigint', (): void => {
		// eslint-disable-next-line no-undef
		expect(isNumber(BigInt(42069))).toBe(false);
	});

	test('boolean', (): void => {
		expect(isNumber(false)).toBe(false);
		expect(isNumber(true)).toBe(false);
	});

	test('undefined', (): void => {
		expect(isNumber(undefined)).toBe(false);
	});

	test('object', (): void => {
		expect(isNumber({ class: '' })).toBe(false);
	});

	test('object-null', (): void => {
		expect(isNumber(null)).toBe(false);
	});

	test('function', (): void => {
		// eslint-disable-next-line func-style
		const value = function myClass(): void {
			/* noop */
		};
		expect(isNumber(value)).toBe(false);
	});

	test('arrow', (): void => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		const value = (): void => { };
		expect(isNumber(value)).toBe(false);
	});

	test('class', (): void => {
		class A { }
		expect(isNumber(A)).toBe(false);
	});
});

describe('isObject', (): void => {
	test('string', (): void => {
		expect(isObject('Hello World')).toBe(false);
	});

	test('number', (): void => {
		expect(isObject(42060)).toBe(false);
	});

	test('bigint', (): void => {
		// eslint-disable-next-line no-undef
		expect(isObject(BigInt(42069))).toBe(false);
	});

	test('boolean', (): void => {
		expect(isObject(false)).toBe(false);
		expect(isObject(true)).toBe(false);
	});

	test('undefined', (): void => {
		expect(isObject(undefined)).toBe(false);
	});

	test('object', (): void => {
		expect(isObject({ class: '' })).toBe(true);
	});

	test('object-null', (): void => {
		expect(isObject(null)).toBe(false);
	});

	test('object-array', (): void => {
		const value: undefined[] = [];
		expect(isObject(value)).toBe(false);
	});

	test('object-non-literal', (): void => {
		const value = new (class A { })();
		expect(isObject(value)).toBe(false);
	});

	test('function', (): void => {
		// eslint-disable-next-line func-style
		const value = function myClass(): void {
			/* noop */
		};
		expect(isObject(value)).toBe(false);
	});

	test('arrow', (): void => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		const value = (): void => { };
		expect(isObject(value)).toBe(false);
	});

	test('class', (): void => {
		class A { }
		expect(isObject(A)).toBe(false);
	});
});

describe('isPrimitive', (): void => {
	test('string', (): void => {
		expect(isPrimitive('Hello World')).toBe(true);
	});

	test('number', (): void => {
		expect(isPrimitive(42060)).toBe(true);
	});

	test('bigint', (): void => {
		// eslint-disable-next-line no-undef
		expect(isPrimitive(BigInt(42069))).toBe(true);
	});

	test('boolean', (): void => {
		expect(isPrimitive(false)).toBe(true);
		expect(isPrimitive(true)).toBe(true);
	});

	test('undefined', (): void => {
		expect(isPrimitive(undefined)).toBe(false);
	});

	test('object', (): void => {
		expect(isPrimitive({ class: '' })).toBe(false);
	});

	test('object-null', (): void => {
		expect(isPrimitive(null)).toBe(false);
	});

	test('function', (): void => {
		// eslint-disable-next-line func-style
		const value = function myClass(): void {
			/* noop */
		};
		expect(isPrimitive(value)).toBe(false);
	});

	test('arrow', (): void => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		const value = (): void => { };
		expect(isPrimitive(value)).toBe(false);
	});

	test('class', (): void => {
		class A { }
		expect(isPrimitive(A)).toBe(false);
	});
});

describe('isThenable', (): void => {
	test('string', (): void => {
		expect(isThenable('Hello World')).toBe(false);
	});

	test('number', (): void => {
		expect(isThenable(42060)).toBe(false);
	});

	test('bigint', (): void => {
		// eslint-disable-next-line no-undef
		expect(isThenable(BigInt(42069))).toBe(false);
	});

	test('boolean', (): void => {
		expect(isThenable(false)).toBe(false);
		expect(isThenable(true)).toBe(false);
	});

	test('undefined', (): void => {
		expect(isThenable(undefined)).toBe(false);
	});

	test('object', (): void => {
		expect(isThenable({ class: '' })).toBe(false);
	});

	test('object-null', (): void => {
		expect(isThenable(null)).toBe(false);
	});

	test('promise-constructor', (): void => {
		const value = new Promise<boolean>((resolve): void => resolve(true));
		expect(isThenable(value)).toBe(true);
	});

	test('promise-resolve', (): void => {
		expect(isThenable(Promise.resolve(true))).toBe(true);
	});

	test('promise-like', (): void => {
		const value = {
			then(): boolean {
				return true;
			},
			catch(): void {
				/* noop */
			}
		};

		expect(isThenable(value)).toBe(true);
	});

	test('function', (): void => {
		// eslint-disable-next-line func-style
		const value = function myClass(): void {
			/* noop */
		};
		expect(isThenable(value)).toBe(false);
	});

	test('arrow', (): void => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		const value = (): void => { };
		expect(isThenable(value)).toBe(false);
	});

	test('class', (): void => {
		class A { }
		/* eslint-enable id-length */
		expect(isThenable(A)).toBe(false);
	});
});

describe('makeObject', (): void => {
	test('basic', (): void => {
		expect(makeObject('hello', 'world')).toStrictEqual({ hello: 'world' });
	});

	test('nested', (): void => {
		expect(makeObject('he.llo', 'world')).toStrictEqual({ he: { llo: 'world' } });
	});

	test('existing', (): void => {
		expect(makeObject('hello', 'world', { he: { llo: 'world' } })).toStrictEqual({ he: { llo: 'world' }, hello: 'world' });
	});

	test('existing-nested', (): void => {
		expect(makeObject('he.wor', 'ld', { he: { llo: 'world' } })).toStrictEqual({ he: { llo: 'world', wor: 'ld' } });
	});
});

describe('mergeDefault', (): void => {
	test('basic', (): void => {
		const defaults = { a: 0, b: 1 };
		const given = {};
		expect(mergeDefault(defaults, given)).toStrictEqual({ a: 0, b: 1 });
	});

	test('mutation', (): void => {
		const defaults = { a: 0, b: 1 };
		const given = {};

		mergeDefault(defaults, given);

		expect(defaults).toStrictEqual({ a: 0, b: 1 });
		expect(given).toStrictEqual({ a: 0, b: 1 });
	});

	test('clone', (): void => {
		const defaults = { a: 0, b: 1 };
		expect(mergeDefault(defaults)).toStrictEqual({ a: 0, b: 1 });
	});

	test('partial', (): void => {
		const defaults = { a: 0, b: 1 };
		const given = { a: 2 };
		expect(mergeDefault(defaults, given)).toStrictEqual({ a: 2, b: 1 });
	});

	test('extended', (): void => {
		const defaults = { a: 0, b: 1 };
		const given = { a: 2, i: 3 };
		expect(mergeDefault(defaults, given)).toStrictEqual({ a: 2, i: 3, b: 1 });
	});

	test('partial-falsy-null', (): void => {
		const defaults: { a: null | number, b: number } = { a: 0, b: 1 };
		const given = { a: null };
		expect(mergeDefault(defaults, given)).toStrictEqual({ a: null, b: 1 });
	});

	test('partial-undefined', (): void => {
		const defaults = { a: 0, b: 1 };
		const given = { a: undefined };
		expect(mergeDefault(defaults, given)).toStrictEqual({ a: 0, b: 1 });
	});

	test('deep', (): void => {
		const defaults = { a: { b: 1 } };
		const given = { a: { b: 2 } };
		expect(mergeDefault(defaults, given)).toStrictEqual({ a: { b: 2 } });
	});

	test('interface', (): void => {
		interface Test {
			foo: string;
			bar: number;
			baz: boolean;
		}

		const defaults: Test = { foo: 'Hello, world!', bar: 42069, baz: true };
		const given: Partial<Test> = { foo: 'Goodbye, friends!', baz: false };

		expect(mergeDefault(defaults, given)).toStrictEqual({ foo: 'Goodbye, friends!', bar: 42069, baz: false });
	});
});

describe('mergeObjects', (): void => {
	test('basic', (): void => {
		const source = { a: 0, b: 1 };
		const target = {};

		expect(mergeObjects(target, source)).toStrictEqual({ a: 0, b: 1 });
	});

	test('mutation', (): void => {
		const source = { a: 0, b: 1 };
		const target = {};
		mergeObjects(target, source);

		expect(source).toStrictEqual({ a: 0, b: 1 });
		expect(target).toStrictEqual({ a: 0, b: 1 });
	});

	test('clone', (): void => {
		const source = { a: 0, b: 1 };
		const target = {};
		expect(mergeObjects(target, source)).toStrictEqual({ a: 0, b: 1 });
	});

	test('partial', (): void => {
		const source = { a: 0, b: 1 };
		const target = { a: 2 };
		expect(mergeObjects(target, source)).toStrictEqual({ a: 0, b: 1 });
	});

	test('extended', (): void => {
		const source = { a: 0, b: 1 };
		const target = { a: 2, i: 2 };
		expect(mergeObjects(target, source)).toStrictEqual({ a: 0, i: 2, b: 1 });
	});

	test('deep', (): void => {
		const source = { a: 0 };
		const target = { b: { i: 4 } };

		expect(mergeObjects(target, source)).toStrictEqual({ a: 0, b: { i: 4 } });
	});

	test('deep-replace', (): void => {
		const source = { a: { i: 4 } };
		const target = { a: 0 };

		expect(mergeObjects(target, source)).toStrictEqual({ a: { i: 4 } });
	});

	test('deep-merge', (): void => {
		const source = { a: { b: 1 } };
		const target = { a: { i: 1 } };
		expect(mergeObjects(target, source)).toStrictEqual({ a: { i: 1, b: 1 } });
	});

	test('deep-type-mismatch', (): void => {
		const source = { a: 0 };
		const target = { a: { b: 1 } };
		expect(mergeObjects(target, source)).toStrictEqual({ a: { b: 1 } });
	});
});

describe('objectToTuples', (): void => {
	test('basic', (): void => {
		const source = { a: 'Hello', b: 42069 };
		const expected = [['a', 'Hello'], ['b', 42069]] as [string, string | number][];
		expect(objectToTuples(source)).toStrictEqual(expected);
	});

	test('deep', (): void => {
		const source = { a: 'Hello', b: 42069, deep: { i: [] } };
		const expected = [['a', 'Hello'], ['b', 42069], ['deep.i', []]];
		expect(objectToTuples(source)).toStrictEqual(expected);
	});
});

describe('regExpEsc', (): void => {
	test('hyphen', (): void => {
		const source = String.raw`test-this`;
		const expected = String.raw`test\-this`;
		expect(regExpEsc(source)).toBe(expected);
	});

	test('slash', (): void => {
		const source = String.raw`test/this`;
		const expected = String.raw`test\/this`;
		expect(regExpEsc(source)).toBe(expected);
	});

	test('back-slash', (): void => {
		const source = String.raw`test\this`;
		const expected = String.raw`test\\this`;
		expect(regExpEsc(source)).toBe(expected);
	});

	test('caret', (): void => {
		const source = String.raw`^test`;
		const expected = String.raw`\^test`;
		expect(regExpEsc(source)).toBe(expected);
	});

	test('dollar', (): void => {
		const source = String.raw`test$`;
		const expected = String.raw`test\$`;
		expect(regExpEsc(source)).toBe(expected);
	});

	test('* quantifier', (): void => {
		const source = String.raw`test*this`;
		const expected = String.raw`test\*this`;
		expect(regExpEsc(source)).toBe(expected);
	});

	test('+ quantifier', (): void => {
		const source = String.raw`test+this`;
		const expected = String.raw`test\+this`;
		expect(regExpEsc(source)).toBe(expected);
	});

	test('? quantifier', (): void => {
		const source = String.raw`test?this`;
		const expected = String.raw`test\?this`;
		expect(regExpEsc(source)).toBe(expected);
	});

	test('. quantifier', (): void => {
		const source = String.raw`test.this`;
		const expected = String.raw`test\.this`;
		expect(regExpEsc(source)).toBe(expected);
	});

	test('parentheses', (): void => {
		const source = String.raw`(test)`;
		const expected = String.raw`\(test\)`;
		expect(regExpEsc(source)).toBe(expected);
	});

	test('vertical bar', (): void => {
		const source = String.raw`test|this`;
		const expected = String.raw`test\|this`;
		expect(regExpEsc(source)).toBe(expected);
	});

	test('brackets', (): void => {
		const source = String.raw`[test]`;
		const expected = String.raw`\[test\]`;
		expect(regExpEsc(source)).toBe(expected);
	});

	test('curly brackets', (): void => {
		const source = String.raw`{test}`;
		const expected = String.raw`\{test\}`;
		expect(regExpEsc(source)).toBe(expected);
	});

	test('combined', (): void => {
		const source = String.raw`^(he?l*l+.)|[wW]o{,2}rld$`;
		const expected = String.raw`\^\(he\?l\*l\+\.\)\|\[wW\]o\{,2\}rld\$`;
		expect(regExpEsc(source)).toBe(expected);
	});
});

describe('sleep', (): void => {
	test('cozy', (): Promise<void> => {
		const pending = sleep(1);

		return expect(pending).resolves.toBeUndefined();
	});
});

describe('toTitleCase', (): void => {
	test('basic', (): void => {
		expect(toTitleCase('something')).toBe('Something');
	});

	test('unicode', (): void => {
		expect(toTitleCase('🎈something')).toBe('🎈Something');
	});

	test('keyword', (): void => {
		expect(toTitleCase('textchannel')).toBe('TextChannel');
	});
});

describe('tryParse', (): void => {
	test('basic', (): void => {
		expect(tryParse('{"a":4,"b":6}')).toStrictEqual({ a: 4, b: 6 });
	});

	test('invalid', (): void => {
		expect(tryParse('{"a":4,"b:6}')).toBe('{"a":4,"b:6}');
	});
});
