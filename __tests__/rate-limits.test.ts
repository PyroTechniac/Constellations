import { RateLimitManager, RateLimit, sleep } from '../src';
import Collection from '@discordjs/collection';

jest.useFakeTimers();

test('acquiring', (): void => {
	const manager = new RateLimitManager(1, 1);

	const rate1 = manager.acquire('one');
	const rate2 = manager.acquire('two');
	expect(rate1).toBe(manager.get('one'));
	expect(rate2).toBe(manager.get('two'));
});

test('set-guard', (): void => {
	const manager = new RateLimitManager(2, 30000);

	const throwFn = (): void => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore
		manager.set('foo', 'bar');
	};

	expect(throwFn).toThrow('Invalid RateLimit');
	expect(throwFn).toThrow(Error);
});

test('clears-timeout', (): void => {
	const manager = new RateLimitManager(2, 30000);

	manager.acquire('one');
	expect(manager.size).toBe(1);

	manager.clear();
	expect(manager.size).toBe(0);
	// eslint-disable-next-line dot-notation
	expect(manager['sweepInterval']).toBeNull();

	manager.clear();
	expect(manager.size).toBe(0);
});

test('change-bucket', (): void => {
	const manager = new RateLimitManager(2, 30000);
	const ratelimit = manager.acquire('one');

	expect(manager.bucket).toBe(2);
	expect(ratelimit.bucket).toBe(2);

	manager.bucket = 3;
	expect(manager.bucket).toBe(3);
	expect(ratelimit.bucket).toBe(3);
});

test('change-cooldown', (): void => {
	const manager = new RateLimitManager(2, 30000);
	const ratelimit = manager.acquire('one');

	expect(manager.cooldown).toBe(30000);
	expect(ratelimit.cooldown).toBe(30000);
	manager.cooldown = 33000;
	expect(manager.cooldown).toBe(33000);
	expect(ratelimit.cooldown).toBe(33000);
});

test('basic-drip', (): void => {
	const manager = new RateLimitManager(2, 30000);
	const ratelimit = manager.acquire('one');

	ratelimit.drip()
		.drip();

	const throwsFn = (): RateLimit => ratelimit.drip();

	expect(throwsFn).toThrow(Error);
	expect(throwsFn).toThrow('Ratelimited');
});

test('proper-resetting', async (): Promise<void> => {
	expect.assertions(3);
	const manager = new RateLimitManager(2, 1000);
	const ratelimit = manager.acquire('one');

	ratelimit.drip()
		.drip();

	expect(ratelimit.limited).toBe(true);

	await sleep(1200);
	expect(ratelimit.limited).toBe(false);
	expect((): RateLimit => ratelimit.drip()).not.toThrow();
});

test('proper-sweeping-everything', async (): Promise<void> => {
	expect.assertions(2);
	const manager = new RateLimitManager(2, 1000);

	manager.acquire('one').drip();

	await sleep(1200);
	manager.sweep();

	expect(manager.has('one')).toBe(false);
	expect(manager.size).toBe(0);
});

test('proper-sweeping-not-everything', async (): Promise<void> => {
	expect.assertions(3);
	const manager = new RateLimitManager(2, 1000);

	manager.acquire('one').drip();

	await sleep(1200);
	manager.acquire('two').drip();
	manager.sweep();

	expect(manager.has('one')).toBe(false);
	expect(manager.has('two')).toBe(true);

	expect(manager.size).toBe(1);
});

test('clones-are-collections', (): void => {
	const manager = new RateLimitManager(2, 1000);
	const clone = manager.clone();

	expect(clone).not.toBeInstanceOf(RateLimitManager);
	expect(clone).toBeInstanceOf(Collection);
});
