import ava, { ExecutionContext } from 'ava';
import { RequestHandler } from '../../dist';
import { get, getAll, getThrows, getAllThrows, allSettled, getAllNulls, DataStructure } from './lib/mock';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = (): void => { };

ava('request-handler(fields)', (test): void => {
	test.plan(2);

	const rh = new RequestHandler(get, getAll);
	test.is(rh.getFn, get);
	test.is(rh.getAllFn, getAll);
});

ava('request-handler(get)', async (test): Promise<void> => {
	const rh = new RequestHandler(get, getAll);
	const value = await rh.push('Hello');
	test.deepEqual(value, { id: 'Hello', value: 0 });
});

ava('request-handler(get(Duplicated))', async (test): Promise<void> => {
	test.plan(2);

	const rh = new RequestHandler(get, getAll);
	const values = await Promise.all(['Hello', 'Hello', 'Hello'].map((key): Promise<DataStructure> => rh.push(key)));
	test.deepEqual(values[0], { id: 'Hello', value: 0 });
	test.deepEqual(values[1], { id: 'Hello', value: 0 });
	test.deepEqual(values[2], { id: 'Hello', value: 0 });
});

ava('request-handler(getMultiple(Sequential))', async (test): Promise<void> => {
	test.plan(2);

	const rh = new RequestHandler(get, getAll);

	test.deepEqual(await rh.push('Hello'), { id: 'Hello', value: 0 });
	test.deepEqual(await rh.push('World'), { id: 'World', value: 1 });
});

ava('request-handler(getMultiple(Parallel))', async (test): Promise<void> => {
	test.plan(3);

	const rh = new RequestHandler(get, getAll);
	const values = await Promise.all(['Hello', 'World', 'Foo'].map((key): Promise<DataStructure> => rh.push(key)));

	test.deepEqual(values[0], { id: 'Hello', value: 0 });
	test.deepEqual(values[1], { id: 'World', value: 1 });
	test.deepEqual(values[2], { id: 'Foo', value: 2 });
});

ava('request-handler(getMultiple(Parallel | Partial))', async (test): Promise<void> => {
	test.plan(3);

	const rh = new RequestHandler(get, getAll);
	const values = await Promise.all(['Hello', 'World', 'Test3'].map((key): Promise<DataStructure> => rh.push(key)));
	test.deepEqual(values[0], { id: 'Hello', value: 0 });
	test.deepEqual(values[1], { id: 'World', value: 1 });
	test.deepEqual(values[2], null);
});

ava('request-handler(getMultiple(Parallel | Nulls))', async (test): Promise<void> => {
	test.plan(3);

	const rh = new RequestHandler(get, getAllNulls);
	const values = await Promise.all(['Hello', 'World', 'Test3'].map((key): Promise<DataStructure | null> => rh.push(key)));

	test.deepEqual(values[0], { id: 'Hello', value: 0 });
	test.deepEqual(values[1], { id: 'World', value: 1 });
	test.deepEqual(values[2], null);
});

ava('request-handler(get(Throws))', async (test): Promise<void> => {
	const rhThrows = new RequestHandler(getThrows, getAllThrows);
	await test.throwsAsync((): Promise<any> => rhThrows.push('Test3'), { message: "Key 'Test3' does not exist." });
});

ava('request-handler(getMultiple(Throws | Sequential))', async (test): Promise<void> => {
	
})