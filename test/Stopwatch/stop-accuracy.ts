import ava from 'ava';
import { Stopwatch, sleep } from '../../dist';

ava('stopwatch(stop-accuracy(1 second))', async (test): Promise<void> => {
	const stopwatch = new Stopwatch();

	await sleep(1000);
	stopwatch.stop();
	test.true(stopwatch.duration >= 990 && stopwatch.duration <= 1200, `Expected a time between 1000 and 1200, got ${stopwatch.duration}`);
});

ava('stopwatch(stop-accuracy(5 seconds))', async (test): Promise<void> => {
	const stopwatch = new Stopwatch();

	await sleep(5000);
	stopwatch.stop();
	test.true(stopwatch.duration >= 4990 && stopwatch.duration <= 5200, `Expected a time between 5000 and 5200, got ${stopwatch.duration}`);
});
