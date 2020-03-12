import ava from 'ava';
import { Stopwatch, sleep } from '../../dist';

ava('stopwatch(restart)', async (test): Promise<void> => {
	test.plan(2);
	const stopwatch = new Stopwatch();

	await sleep(5001);
	stopwatch.stop();
	test.true(stopwatch.duration >= 4990 && stopwatch.duration <= 5200, `Expected a time between 5000 and 5200, got ${stopwatch.duration}`);

	stopwatch.restart();

	await sleep(1000);
	stopwatch.stop();
	test.true(stopwatch.duration >= 990 && stopwatch.duration <= 1200, `Expected a time between 1000 and 1200, got ${stopwatch.duration}`);
});

ava('stopwatch(reset)', async (test): Promise<void> => {
	test.plan(2);
	const stopwatch = new Stopwatch();

	await sleep(1000);
	stopwatch.stop();
	test.true(stopwatch.duration >= 990 && stopwatch.duration <= 1200, `Expected a time between 1000 and 1200, got ${stopwatch.duration}`);

	stopwatch.reset();

	test.true(stopwatch.duration === 0, `Expected stopwatch duration to be 0, got ${stopwatch.duration}`);
});

ava('stopwatch(start(stopped stopwatch))', async (test): Promise<void> => {
	test.plan(2);

	const stopwatch = new Stopwatch();

	await sleep(1000);
	stopwatch.stop();

	test.true(stopwatch.duration >= 990 && stopwatch.duration <= 1200, `Expected a time between 1000 and 1200, got ${stopwatch.duration}`);

	stopwatch.start();

	await sleep(1000);
	stopwatch.stop();
	test.true(stopwatch.duration >= 1990 && stopwatch.duration <= 2200, `Expected a time between 2000 and 2200, got ${stopwatch.duration}`);
});

ava('stopwatch(stopping(twice))', async (test): Promise<void> => {
	const stopwatch = new Stopwatch();

	await sleep(1000);
	stopwatch.stop();
	const first = stopwatch.duration;

	await sleep(1000);
	// Redundant, but needed for code coverage.
	stopwatch.stop();
	const second = stopwatch.duration;
	test.is(first, second);
});