import ava from 'ava';
import { Stopwatch } from '../../dist';

ava('stopwatch(stopped)', (test): void => {
	const stopwatch = new Stopwatch().stop();

	test.false(stopwatch.running);
});

ava('stopwatch(running(constructor))', (test): void => {
	const stopwatch = new Stopwatch();

	test.true(stopwatch.running);
});

ava('stopwatch(running(method))', (test): void => {
	const stopwatch = new Stopwatch().start();

	test.true(stopwatch.running);
});
