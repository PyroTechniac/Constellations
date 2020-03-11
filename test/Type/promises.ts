import ava from 'ava';
import { Type } from '../../dist';

ava('promise(resolves)', (test): void => {
	const resolves = (): Promise<null> => Promise.resolve(null);

	test.is(new Type(resolves()).toString(), 'Promise<null>');
});
