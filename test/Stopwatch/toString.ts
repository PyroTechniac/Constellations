import ava from 'ava';
import { Stopwatch, sleep } from '../../dist';

ava('stopwatch(toString(1 second))', async (test): Promise<void> => {
	const stopwatch = new Stopwatch();

	await sleep(1010);
	const str = stopwatch.stop().toString();
	test.true(str.startsWith('1') && str.endsWith('s'), `Expected string to start with '1' and end with 's', got: ${str}`);
})

ava('stopwatch(toString(instant))', (test): void => {
	const stopwatch = new Stopwatch();

	const str = stopwatch.stop().toString();
	test.true(str.endsWith('μs'));
});

ava('stopwatch(toString(less than a second))', async (test): Promise<void> => {
	const stopwatch = new Stopwatch();

	await sleep(100);
	const str = stopwatch.stop().toString();
	test.true(str.endsWith('ms'), `Expected string to end with 'ms', got: ${str}`);
})