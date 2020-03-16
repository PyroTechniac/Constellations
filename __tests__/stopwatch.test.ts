import { Stopwatch, sleep } from '../src';

describe('chainables', (): void => {
	test('restart', async (): Promise<void> => {
		expect.assertions(4);
		const stopwatch = new Stopwatch();

		await sleep(5001).then((): Stopwatch => stopwatch.stop());
		expect(stopwatch.duration).toBeGreaterThanOrEqual(4990);
		expect(stopwatch.duration).toBeLessThanOrEqual(5200);

		stopwatch.restart();

		await sleep(1000).then((): Stopwatch => stopwatch.stop());
		expect(stopwatch.duration).toBeGreaterThanOrEqual(990);
		expect(stopwatch.duration).toBeLessThanOrEqual(1200);
	}, 10000);

	test('reset', async (): Promise<void> => {
		expect.assertions(3);
		const stopwatch = new Stopwatch();

		await sleep(1000).then((): Stopwatch => stopwatch.stop());
		expect(stopwatch.duration).toBeGreaterThanOrEqual(990);
		expect(stopwatch.duration).toBeLessThanOrEqual(1200);

		stopwatch.reset();

		expect(stopwatch.duration).toBe(0);
	});

	test('start-stopped-stopwatch', async (): Promise<void> => {
		expect.assertions(4);

		const stopwatch = new Stopwatch();

		await sleep(1000).then((): Stopwatch => stopwatch.stop());

		expect(stopwatch.duration).toBeGreaterThanOrEqual(990);
		expect(stopwatch.duration).toBeLessThanOrEqual(1200);

		stopwatch.start();

		await sleep(1000).then((): Stopwatch => stopwatch.stop());
		expect(stopwatch.duration).toBeGreaterThanOrEqual(1990);
		expect(stopwatch.duration).toBeLessThanOrEqual(2200);
	});

	test('stopping-twice', async (): Promise<void> => {
		const stopwatch = new Stopwatch();

		await sleep(1000).then((): Stopwatch => stopwatch.stop());
		const first = stopwatch.duration;

		await sleep(1000).then((): Stopwatch => stopwatch.stop());
		const second = stopwatch.duration;
		expect(first).toBe(second);
	});
});

test('duration', async (): Promise<void> => {
	const stopwatch = new Stopwatch();

	const first = stopwatch.duration;

	await sleep(1000).then((): Stopwatch => stopwatch.stop());
	expect(first).toBeLessThan(stopwatch.duration);
});

describe('running', (): void => {
	test('stopped', (): void => {
		const stopwatch = new Stopwatch().stop();

		expect(stopwatch.running).toBe(false);
	});

	test('running-constructor', (): void => {
		const stopwatch = new Stopwatch();

		expect(stopwatch.running).toBe(true);
	});

	test('running-method', (): void => {
		const stopwatch = new Stopwatch().start();

		expect(stopwatch.running).toBe(true);
	});
});

describe('stop-accuracy', (): void => {
	test('1-second', async (): Promise<void> => {
		expect.assertions(2);
		const stopwatch = new Stopwatch();

		await sleep(1000).then((): Stopwatch => stopwatch.stop());
		expect(stopwatch.duration).toBeGreaterThanOrEqual(990);
		expect(stopwatch.duration).toBeLessThanOrEqual(1200);
	});

	test('5-seconds', async (): Promise<void> => {
		expect.assertions(2);
		const stopwatch = new Stopwatch();

		await sleep(5000).then((): Stopwatch => stopwatch.stop());
		expect(stopwatch.duration).toBeGreaterThanOrEqual(4990);
		expect(stopwatch.duration).toBeLessThanOrEqual(5200);
	});
});

describe('toString', (): void => {
	test('1-second', async (): Promise<void> => {
		expect.assertions(2);
		const stopwatch = new Stopwatch();

		const str = await sleep(1000).then((): string => stopwatch.stop().toString());
		expect(str.startsWith('1')).toBe(true);
		expect(str.endsWith('s')).toBe(true);
	});

	test('instant', (): void => {
		const str = new Stopwatch().stop().toString();

		expect(str.endsWith('μs')).toBe(true);
	});
});
