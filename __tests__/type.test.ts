import { Type } from '../src';

const noop = (): void => { }; // eslint-disable-line @typescript-eslint/no-empty-function

describe('array', (): void => {
	test('empty', (): void => {
		expect(new Type([]).toString()).toBe('Array');
	});

	test('same-type', (): void => {
		expect(new Type([1, 2, 3]).toString()).toBe('Array<number>');
	});

	test('different-type', (): void => {
		expect(new Type([true, 'Test', 7]).toString()).toBe('Array<boolean | number | string>');
	});

	test('circular', (): void => {
		const a = [[]];
		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore
		a[0].push(a);
		expect(new Type(a).toString()).toBe('Array<Array<[Circular:Array]>>');
	});
});

describe('function', (): void => {
	test('empty', (): void => {
		expect(new Type(noop).toString()).toBe('Function(0-arity)');
	});

	test('two-args', (): void => {
		expect(new Type((a: number, b: number): number => a + b).toString()).toBe('Function(2-arity)');
	});
});

describe('map', (): void => {
	test('empty', (): void => {
		expect(new Type(new Map()).toString()).toBe('Map');
	});

	test('same-type', (): void => {
		expect(new Type(new Map([
			['one', 1],
			['two', 2],
			['three', 3]
		])).toString()).toBe('Map<string, number>');
	});

	test('different-type', (): void => {
		expect(new Type(new Map<string, string | number>([
			['text', 'abc'],
			['digit', 123]
		])).toString()).toBe('Map<string, number | string>');
	});

	test('mixed-with-object', (): void => {
		expect(new Type(new Map<string, any>([
			['text', 'abc'],
			['digit', 1],
			['object', {}]
		])).toString()).toBe('Map<string, Record | number | string>');
	});
});

describe('object', (): void => {
	test('generic', (): void => {
		expect(new Type({}).toString()).toBe('Record');
	});

	test('null', (): void => {
		expect(new Type(null).toString()).toBe('null');
	});

	test('custom', (): void => {
		class Foo { }
		expect(new Type(new Foo()).toString()).toBe('Foo');
	});

	test('types', (): void => {
		expect(new Type({
			foo: 'bar',
			baz: 2,
			hello: true
		}).toString()).toBe('Record<string, boolean | number | string>');
	});

	test('recursive', (): void => {
		expect(new Type({
			foo: 'bar',
			hello: {
				baz: 'world'
			}
		}));
	});
});

describe('promise', (): void => {
	test('resolves', (): void => {
		const resolves = (): Promise<void> => Promise.resolve();

		expect(new Type(resolves()).toString()).toBe('Promise<void>');
	});
});

describe('set', (): void => {
	test('empty', (): void => {
		expect(new Type(new Set()).toString()).toBe('Set');
	});

	test('same-type', (): void => {
		expect(new Type(new Set([1, 2, 3])).toString()).toBe('Set<number>');
	});

	test('different-types', (): void => {
		expect(new Type(new Set(['abc', 123])).toString()).toBe('Set<number | string>');
	});
});
