import { Type } from '../src';

const noop = (): void => { }; // eslint-disable-line @typescript-eslint/no-empty-function

describe('array', (): void => {
	test('empty', (): void => {
		const type = new Type([]);
		expect(type.toString()).toBe('Array');
		expect(type).toMatchSnapshot();
	});

	test('same-type', (): void => {
		const type = new Type([1, 2, 3]);
		expect(type.toString()).toBe('Array<number>');
		expect(type).toMatchSnapshot();
	});

	test('different-type', (): void => {
		const type = new Type([true, 'Test', 7])
		expect(type.toString()).toBe('Array<boolean | number | string>');
		expect(type).toMatchSnapshot();
	});

	test('circular', (): void => {
		const a = [[]];
		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore
		a[0].push(a);
		const type = new Type(a);
		expect(type.toString()).toBe('Array<Array<[Circular:Array]>>');
		expect(type).toMatchSnapshot();
	});
});

describe('function', (): void => {
	test('empty', (): void => {
		const type = new Type(noop)
		expect(type.toString()).toBe('Function(0-arity)');
		expect(type).toMatchSnapshot();
	});

	test('two-args', (): void => {
		// expect(new Type((a: number, b: number): number => a + b).toString()).toBe('Function(2-arity)');
		const type = new Type((a: number, b: number): number => a + b);
		expect(type.toString()).toBe('Function(2-arity)');
		expect(type).toMatchSnapshot();
	});
});

describe('map', (): void => {
	test('empty', (): void => {
		const type = new Type(new Map());
		expect(type.toString()).toBe('Map');
		expect(type).toMatchSnapshot();
	});

	test('same-type', (): void => {
		const type = new Type(new Map([
			['one', 1],
			['two', 2],
			['three', 3]
		]));
		expect(type.toString()).toBe('Map<string, number>');
		expect(type).toMatchSnapshot()
	});

	test('different-type', (): void => {
		const type = new Type(new Map<string, string | number>([
			['text', 'abc'],
			['digit', 123]
		]));
		expect(type.toString()).toBe('Map<string, number | string>');
		expect(type).toMatchSnapshot();
	});

	test('mixed-with-object', (): void => {
		const type = new Type(new Map<string, any>([
			['text', 'abc'],
			['digit', 1],
			['object', {}]
		]));
		expect(type.toString()).toBe('Map<string, Record | number | string>');
		expect(type).toMatchSnapshot();
	});
});

describe('object', (): void => {
	test('generic', (): void => {
		const type = new Type({});
		expect(type.toString()).toBe('Record');
		expect(type).toMatchSnapshot();
	});

	test('null', (): void => {
		const type = new Type(null);
		expect(type.toString()).toBe('null');
		expect(type).toMatchSnapshot();
	});

	test('custom', (): void => {
		class Foo { }
		const type = new Type(new Foo());
		expect(type.toString()).toBe('Foo');
		expect(type).toMatchSnapshot();
	});

	test('types', (): void => {
		const type = new Type({
			foo: 'bar',
			baz: 2,
			hello: true
		});
		expect(type.toString()).toBe('Record<string, boolean | number | string>');
		expect(type).toMatchSnapshot()
	});

	test('recursive', (): void => {
		const type = new Type({
			foo: 'bar',
			hello: {
				baz: 'world'
			}
		});
		expect(type.toString()).toBe('Record<string, Record<string, string> | string>');
		expect(type).toMatchSnapshot();
	});
});

describe('promise', (): void => {
	test('resolves', (): void => {
		const type = new Type(Promise.resolve());

		expect(type.toString()).toBe('Promise<void>');
		expect(type).toMatchSnapshot();
	});
});

describe('set', (): void => {
	test('empty', (): void => {
		const type = new Type(new Set());
		expect(type.toString()).toBe('Set');
		expect(type).toMatchSnapshot();
	});

	test('same-type', (): void => {
		const type = new Type(new Set([1, 2, 3]));
		expect(type.toString()).toBe('Set<number>');
		expect(type).toMatchSnapshot();
	});

	test('different-types', (): void => {
		const type = new Type(new Set(['abc', 123]));
		expect(type.toString()).toBe('Set<number | string>');
		expect(type).toMatchSnapshot();
	});
});
