import ava from 'ava';
import { RateLimitManager, sleep } from '../../dist';
import Collection from '@discordjs/collection';

ava('ratelimits(acquiring)', (test): void => {
	test.plan(2);

	const manager = new RateLimitManager(1, 1);

	const rate1 = manager.acquire('one');
	const rate2 = manager.acquire('two');
	test.is(rate1, manager.get('one'));
	test.is(rate2, manager.get('two'));
});

ava('ratelimits(set guard)', (test): void => {
	const manager = new RateLimitManager(2, 30000);

	test.throws((): void => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore
		manager.set('foo', 'bar');
	}, {
		instanceOf: Error,
		message: 'Invalid RateLimit'
	})
});

ava('ratelimits(change bucket)', (test): void => {
	test.plan(4);

	const manager = new RateLimitManager(2, 30000);
	const ratelimit = manager.acquire('one');

	test.is(manager.bucket, 2);
	test.is(ratelimit.bucket, 2);
	manager.bucket = 3;
	test.is(manager.bucket, 3);
	test.is(ratelimit.bucket, 3);
});

ava('ratelimits(change cooldown)', (test): void => {
	test.plan(4);

	const manager = new RateLimitManager(2, 30000);
	const ratelimit = manager.acquire('one');

	test.is(manager.cooldown, 30000);
	test.is(ratelimit.cooldown, 30000);
	manager.cooldown = 330000;
	test.is(manager.cooldown, 330000);
	test.is(ratelimit.cooldown, 330000);
});

ava('ratelimits(basic drip)', (test): void => {
	const manager = new RateLimitManager(2, 30000);

	const ratelimit = manager.acquire('one');
	ratelimit.drip()
		.drip();
	test.throws(ratelimit.drip.bind(ratelimit), {
		instanceOf: Error,
		message: 'Ratelimited'
	});
});

ava('ratelimits(proper resetting)', async (test): Promise<void> => {
	test.plan(3);
	const manager = new RateLimitManager(2, 1000);
	const ratelimit = manager.acquire('one');
	ratelimit.drip()
		.drip();

	test.true(ratelimit.limited);

	await sleep(1200);

	test.false(ratelimit.limited);
	test.notThrows(ratelimit.drip.bind(ratelimit));
});

ava('ratelimits(proper sweeping (everything))', async (test): Promise<void> => {
	const manager=  new RateLimitManager(2, 1000);

	manager.acquire('one').drip();

	await sleep(1200);
	manager.sweep();

	test.false(manager.has('one'));
});

ava('ratelimits(proper sweeping (not everything))', async (test): Promise<void> => {
	test.plan(2);

	const manager = new RateLimitManager(2, 1000);

	manager.acquire('one').drip();

	await sleep(1200);
	manager.acquire('two').drip();
	manager.sweep();

	test.false(manager.has('one'));
	test.true(manager.has('two'));
})

ava('ratelimits(clones are just Collections)', async (test): Promise<void> => {
	test.plan(2);

	const manager = new RateLimitManager(2, 1000);

	const clone = manager.clone();

	test.false(clone instanceof RateLimitManager);
	test.true(clone instanceof Collection);
})