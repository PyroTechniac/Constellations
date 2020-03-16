import { RequestHandler, GetFn, GetAllFn } from '../src';
import { get, getAll, getThrows, getAllThrows, allSettled, getAllNulls, DataStructure } from './lib/request-handler';

const castedGet = get as GetFn<string, DataStructure>;

const castedGetAll = getAll as GetAllFn<string, DataStructure>;

test('fields', (): void => {
	const rh = new RequestHandler(castedGet, castedGetAll);
	expect(rh.getFn).toBe(castedGet);
	expect(rh.getAllFn).toBe(castedGetAll);
});

test('get', (): Promise<void> => {
	const rh = new RequestHandler(castedGet, castedGetAll);
	return expect(rh.push('Hello')).resolves.toStrictEqual({ id: 'Hello', value: 0 });
});

test('get-duplicated', (): Promise<void> => {
	const rh = new RequestHandler(castedGet, castedGetAll);

	const values = Promise.all(['Hello', 'Hello', 'Hello'].map((value): Promise<DataStructure> => rh.push(value)));

	return expect(values).resolves.toStrictEqual([
		{ id: 'Hello', value: 0 },
		{ id: 'Hello', value: 0 },
		{ id: 'Hello', value: 0 }
	]);
});

test('get-multiple-sequential', async (): Promise<void> => {
	expect.assertions(2);

	const rh = new RequestHandler(castedGet, castedGetAll);

	expect(await rh.push('Hello')).toStrictEqual({ id: 'Hello', value: 0 });
	expect(await rh.push('World')).toStrictEqual({ id: 'World', value: 1 });
});

test('get-multiple-parallel', (): Promise<void> => {
	const rh = new RequestHandler(castedGet, castedGetAll);

	const values = Promise.all(['Hello', 'World', 'Foo'].map((value): Promise<DataStructure> => rh.push(value)));

	return expect(values).resolves.toStrictEqual([
		{ id: 'Hello', value: 0 },
		{ id: 'World', value: 1 },
		{ id: 'Foo', value: 2 }
	]);
});

test('get-multiple-parallel-partial', (): Promise<void> => {
	const rh = new RequestHandler(castedGet, castedGetAll);

	const values = Promise.all(['Hello', 'World', 'Test3'].map((value): Promise<DataStructure> => rh.push(value)));

	return expect(values).resolves.toStrictEqual([
		{ id: 'Hello', value: 0 },
		{ id: 'World', value: 1 },
		null
	]);
});

test('get-multiple-parallel-partial', (): Promise<void> => {
	const rh = new RequestHandler(castedGet, getAllNulls as GetAllFn<string, DataStructure>);
	const values = Promise.all(['Hello', 'World', 'Test3'].map((value): Promise<DataStructure> => rh.push(value)));

	return expect(values).resolves.toStrictEqual([
		{ id: 'Hello', value: 0 },
		{ id: 'World', value: 1 },
		null
	]);
});

test('get-throws', (): Promise<void> => {
	const rh = new RequestHandler(getThrows, getAllThrows);
	return expect(rh.push('Test3')).rejects.toThrow("Key 'Test3' does not exist.");
});

test('get-multiple-throws-sequential', async (): Promise<void> => {
	const rhThrows = new RequestHandler(getThrows, getAllThrows);
	await expect(rhThrows.push('Hello')).resolves.toStrictEqual({ id: 'Hello', value: 0 });

	return expect(rhThrows.push('Test3')).rejects.toThrow("Key 'Test3' does not exist.");
});

test('get-multiple-throws-parallel', (): Promise<void> => {
	const rh = new RequestHandler(getThrows, getAllThrows);
	const values = allSettled(['Hello', 'World', 'Test3'].map((value): Promise<DataStructure> => rh.push(value)));
	return expect(values).resolves.toStrictEqual([
		{ status: 'fulfilled', value: { id: 'Hello', value: 0 } },
		{ status: 'rejected', reason: new Error("Key 'Test3' does not exist.") },
		{ status: 'rejected', reason: new Error("Key 'Test3' does not exist.") }
	]);
});

test('wait', async (): Promise<void> => {
	const rh = new RequestHandler(castedGet, castedGetAll);

	let counter = 1;
	rh.push('Hello').finally((): number => --counter);
	await rh.wait();
	expect(counter).toBe(0);
});

test('wait-empty', (): Promise<void> => {
	const rh = new RequestHandler(castedGet, castedGetAll);

	return expect(rh.wait()).resolves.toBeUndefined();
});

test('wait-multiple', async (): Promise<void> => {
	const rh = new RequestHandler(castedGet, castedGetAll);

	let counter = 2;
	rh.push('Hello').finally((): number => --counter);
	rh.push('World').finally((): number => --counter);

	await rh.wait();
	expect(counter).toBe(0);
});

test('wait-multiple-duplicated', async (): Promise<void> => {
	const rh = new RequestHandler(castedGet, castedGetAll);

	let counter = 3;
	rh.push('Hello').finally((): number => --counter);
	rh.push('Hello').finally((): number => --counter);
	rh.push('World').finally((): number => --counter);
	await rh.wait();
	expect(counter).toBe(0);
});
