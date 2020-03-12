import { sleep } from '../../../dist';

export function allSettled<T>(promises: Promise<T>[]): Promise<(PromiseFulfilled<T> | PromiseRejected)[]> {
	return Promise.all(promises.map((promise): Promise<PromiseFulfilled<T> | PromiseRejected> => promise
		.then((value): PromiseFulfilled<T> => ({ status: 'fulfilled', value }) as const)
		.catch((error): PromiseRejected => ({ status: 'rejected', reason: error }) as const)));
}

export const data = new Map<string, DataStructure>([
	['Hello', { id: 'Hello', value: 0 }],
	['World', { id: 'World', value: 1 }],
	['Foo', { id: 'Foo', value: 2 }],
	['Bar', { id: 'Bar', value: 3 }],
	['Test1', { id: 'Test1', value: 4 }],
	['Test2', { id: 'Test2', value: 5 }]
]);

export async function get(key: string): Promise<DataStructure | null> {
	await sleep(1);
	const value = data.get(key) ?? null;
	return value;
}

export async function getThrows(key: string): Promise<DataStructure> {
	await sleep(1);
	const value = data.get(key);
	if (typeof value === 'undefined') throw new Error(`Key ${key} does not exist.`);
	return value;
}

export async function getAll(keys: readonly string[]): Promise<DataStructure[]> {
	await sleep(1);
	const values: DataStructure[] = [];
	for (const key of keys) {
		const value = data.get(key);
		if (typeof value !== 'undefined') values.push(value);
	}

	return values;
}

export async function getAllNulls(keys: readonly string[]): Promise<(DataStructure | null)[]> {
	await sleep(1);
	const values: DataStructure[] = [];
	for (const key of keys) {
		const value = data.get(key);
		values.push(typeof value === 'undefined' ? null : value);
	}
	return values;
}

export async function getAllThrows(keys: readonly string[]): Promise<DataStructure[]> {
	await sleep(1);
	const values: DataStructure[] = [];
	for (const key of keys) {
		const value = data.get(key);
		if (typeof value === 'undefined') throw new Error(`Key '${key}' does not exist.`);
		values.push(value);
	}
	return values;
}

export interface DataStructure {
	id: string;
	value: number;
}

interface PromiseFulfilled<T> {
	status: 'fulfilled';
	value: T;
}

interface PromiseRejected {
	status: 'rejected';
	reason: Error;
}