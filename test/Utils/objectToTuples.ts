import ava from 'ava';
import { objectToTuples } from '../../dist';

ava('objectToTuples(basic)', (test): void => {
	const source = { a: 'Hello', b: 42069 };
	const expected = [['a', 'Hello'], ['b', 42069]] as [string, unknown][];
	test.deepEqual(objectToTuples(source), expected);
});

ava('objectToTuples(deep)', (test): void => {
	const source = { a: 'Hello', b: 42069, deep: { i: [] } };
	const expected = [['a', 'Hello'], ['b', 42069], ['deep.i', []]] as [string, unknown][];
	test.deepEqual(objectToTuples(source), expected);
});
