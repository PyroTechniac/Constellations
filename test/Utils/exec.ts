import ava from 'ava';
import { exec } from '../../dist';
import { lineEndings } from './lib/common';

ava('exec(basic)', async (test): Promise<void> => {
	test.plan(3);
	const pending = exec('echo 1');
	test.true(pending instanceof Promise);

	const result = await pending;
	test.is(result.stdout, `1${lineEndings}`);
	test.is(result.stderr, '');
});

ava('exec(buffer)', async (test): Promise<void> => {
	test.plan(3);
	const pending = exec('echo 1', { encoding: 'buffer' });
	test.true(pending instanceof Promise);

	const result = await pending;
	test.deepEqual(result.stdout, Buffer.from(`1${lineEndings}`));
	test.deepEqual(result.stderr, Buffer.from(''));
});
