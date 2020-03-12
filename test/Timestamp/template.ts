import ava from 'ava';
import { Timestamp } from '../../dist';

/* eslint-disable dot-notation */

ava('template(empty)', (test): void => {
	const timestamp = new Timestamp('');
	test.deepEqual(timestamp['_template'], []);
});

ava('template(hh:mm:ss)', (test): void => {
	const timestamp = new Timestamp('hh:mm:ss');
	const parsedTemplate = timestamp['_template'];
	test.deepEqual(parsedTemplate, [{
		content: null,
		type: 'hh'
	}, {
		content: ':',
		type: 'literal'
	}, {
		content: null,
		type: 'mm'
	}, {
		content: ':',
		type: 'literal'
	}, {
		content: null,
		type: 'ss'
	}]);
});

ava('template(hh[ hours, ]mm[ minutes])', (test): void => {
	const timestamp = new Timestamp('hh[ hours, ]mm[ minutes]');
	const parsedTemplate = timestamp['_template'];
	test.deepEqual(parsedTemplate, [{
		content: null,
		type: 'hh'
	}, {
		content: ' hours, ',
		type: 'literal'
	}, {
		content: null,
		type: 'mm'
	}, {
		content: ' minutes',
		type: 'literal'
	}]);
});

ava('template(llllll)', (test): void => {
	const timestamp = new Timestamp('llllll');
	const parsedTemplate = timestamp['_template'];
	test.deepEqual(parsedTemplate, [{
		content: null,
		type: 'llll'
	}, {
		content: null,
		type: 'll'
	}]);
});
