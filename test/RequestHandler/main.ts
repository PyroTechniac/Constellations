import ava from 'ava';
import { RequestHandler, GetFn, GetAllFn } from '../../dist';
import { get, getAll, getThrows, getAllThrows, allSettled, getAllNulls, DataStructure } from './lib/mock';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = (): void => { };

const castedGet = get as GetFn<string, DataStructure>;

const castedGetAll = getAll as GetAllFn<string, DataStructure>;

ava('request-handler(fields)', (test): void => {
	test.plan(2);

	const rh = new RequestHandler(castedGet, castedGetAll);
	test.is(rh.getFn, get);
	test.is(rh.getAllFn, getAll);
});

ava('request-handler(get)', async (test): Promise<void> => {
	const rh = new RequestHandler(castedGet, castedGetAll);
	const value = await rh.push('Hello');
	test.deepEqual(value, { id: 'Hello', value: 0 });
});

ava('request-handler(get(Duplicated))', async (test): Promise<void> => {
	test.plan(3);

	const rh = new RequestHandler(castedGet, castedGetAll);
	const values = await Promise.all(['Hello', 'Hello', 'Hello'].map((key): Promise<DataStructure> => rh.push(key)));
	test.deepEqual(values[0], { id: 'Hello', value: 0 });
	test.deepEqual(values[1], { id: 'Hello', value: 0 });
	test.deepEqual(values[2], { id: 'Hello', value: 0 });
});

ava('request-handler(getMultiple(Sequential))', async (test): Promise<void> => {
	test.plan(2);

	const rh = new RequestHandler(castedGet, castedGetAll);

	test.deepEqual(await rh.push('Hello'), { id: 'Hello', value: 0 });
	test.deepEqual(await rh.push('World'), { id: 'World', value: 1 });
});

ava('request-handler(getMultiple(Parallel))', async (test): Promise<void> => {
	test.plan(3);

	const rh = new RequestHandler(castedGet, castedGetAll);
	const values = await Promise.all(['Hello', 'World', 'Foo'].map((key): Promise<DataStructure> => rh.push(key)));

	test.deepEqual(values[0], { id: 'Hello', value: 0 });
	test.deepEqual(values[1], { id: 'World', value: 1 });
	test.deepEqual(values[2], { id: 'Foo', value: 2 });
});

ava('request-handler(getMultiple(Parallel | Partial))', async (test): Promise<void> => {
	test.plan(3);

	const rh = new RequestHandler(castedGet, castedGetAll);
	const values = await Promise.all(['Hello', 'World', 'Test3'].map((key): Promise<DataStructure> => rh.push(key)));
	test.deepEqual(values[0], { id: 'Hello', value: 0 });
	test.deepEqual(values[1], { id: 'World', value: 1 });
	test.deepEqual(values[2], null);
});

ava('request-handler(getMultiple(Parallel | Nulls))', async (test): Promise<void> => {
	test.plan(3);

	const rh = new RequestHandler(castedGet, getAllNulls as GetAllFn<string, DataStructure>);
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
	test.plan(2);

	const rhThrows = new RequestHandler(getThrows, getAllThrows);
	test.deepEqual(await rhThrows.push('Hello'), { id: 'Hello', value: 0 });
	await test.throwsAsync((): Promise<any> => rhThrows.push('Test3'), { message: "Key 'Test3' does not exist." });
});

ava('request-handler(getMultiple(Throws | Parallel))', async (test): Promise<void> => {
	test.plan(3);

	const rhThrows = new RequestHandler(getThrows, getAllThrows);
	const keys = ['Hello', 'World', 'Test3'];
	const values = await allSettled(keys.map((key): Promise<DataStructure> => rhThrows.push(key)));
	test.deepEqual(values[0], { status: 'fulfilled', value: { id: 'Hello', value: 0 } });
	test.deepEqual(values[1], { status: 'rejected', reason: new Error("Key 'Test3' does not exist.") });
	test.deepEqual(values[2], { status: 'rejected', reason: new Error("Key 'Test3' does not exist.") });
});

ava('request-handler(wait)', async (test): Promise<void> => {
	const rh = new RequestHandler(castedGet, castedGetAll);

	let counter = 1;
	rh.push('Hello').finally((): number => --counter);
	await rh.wait();
	test.deepEqual(counter, 0);
})

ava('request-handler(wait(Empty))', async (test): Promise<void> => {
	const rh = new RequestHandler(castedGet, castedGetAll);
	await test.notThrowsAsync((): Promise<void> => rh.wait());
})

ava('request-handler(wait(Throws))', async (test): Promise<void> => {
	const rh = new RequestHandler(getThrows, getAllThrows);

	let counter = 1;
	rh.push('Test3').catch(noop).finally((): number => --counter);
	await rh.wait();
	test.deepEqual(counter, 0);
})

ava('request-handler(wait(Multiple))', async (test): Promise<void> => {
	const rh = new RequestHandler(castedGet, castedGetAll);

	let counter = 2;
	rh.push('Hello').finally((): number => --counter);
	rh.push('World').finally((): number => --counter);
	await rh.wait();
	test.deepEqual(counter, 0);
})

ava('request-handler(wait(Multiple | Duplicated))', async (test): Promise<void> => {
	const rh = new RequestHandler(castedGet, castedGetAll);

	let counter = 3;
	rh.push('Hello').finally((): number => --counter);
	rh.push('Hello').finally((): number => --counter);
	rh.push('World').finally((): number => --counter);
	await rh.wait();
	test.deepEqual(counter, 0);
});

ava('request-handler(wait(Multiple | Throws))', async (test): Promise<void> => {
	const rh = new RequestHandler(getThrows, getAllThrows);

	let counter = 3;
	rh.push('Test3').catch(noop).finally((): number => --counter);
	rh.push('Hello').finally((): number => --counter);
	rh.push('World').finally((): number => --counter);
	await rh.wait();
	test.deepEqual(counter, 0);
})