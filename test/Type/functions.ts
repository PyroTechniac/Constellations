import ava from 'ava';
import { Type } from '../../dist';

ava('function(empty)', (test): void => {
	test.is(new Type((): void => { }).toString(), 'Function(0-arity)'); // eslint-disable-line @typescript-eslint/no-empty-function
});

ava('function(two args)', (test): void => {
	test.is(new Type((a: number, b: number): number => a + b).toString(), 'Function(2-arity)');
});
