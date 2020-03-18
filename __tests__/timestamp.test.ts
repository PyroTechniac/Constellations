import { Timestamp, TimestampTemplateEntry } from '../src';


describe('template', (): void => {
	function extractTemplate(timestamp: Timestamp): TimestampTemplateEntry[] {
		// eslint-disable-next-line dot-notation
		return timestamp['_template'];
	}

	test('empty', (): void => {
		expect(extractTemplate(new Timestamp(''))).toStrictEqual([]);
	});

	test('hh:mm:ss', (): void => {
		const timestamp = new Timestamp('hh:mm:ss');
		expect(extractTemplate(timestamp)).toStrictEqual([
			{
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
			}
		]);
	});

	test('hh[ hours, ]mm[ minutes]', (): void => {
		const timestamp = new Timestamp('hh[ hours, ]mm[ minutes]');
		expect(extractTemplate(timestamp)).toStrictEqual<TimestampTemplateEntry[]>([
			{
				content: null,
				type: 'hh'
			},
			{
				content: ' hours, ',
				type: 'literal'
			},
			{
				content: null,
				type: 'mm'
			},
			{
				content: ' minutes',
				type: 'literal'
			}
		]);
	});

	test('llllll', (): void => {
		const timestamp = new Timestamp('llllll');
		expect(extractTemplate(timestamp)).toStrictEqual([
			{
				content: null,
				type: 'llll'
			},
			{
				content: null,
				type: 'll'
			}
		]);
	});

	test('edit', (): void => {
		const timestamp = new Timestamp('hh:mm:ss');
		const originalExtracted = extractTemplate(timestamp);
		const modifiedExtracted = extractTemplate(timestamp.edit('HH:MM:SS'));

		expect(originalExtracted).toStrictEqual([
			{
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
			}
		]);

		expect(modifiedExtracted).toStrictEqual([
			{
				content: null,
				type: 'HH'
			},
			{
				content: ':',
				type: 'literal'
			}, {
				content: null,
				type: 'MM'
			}, {
				content: ':',
				type: 'literal'
			}, {
				content: null,
				type: 'SS'
			}
		]);
	});
});

describe('display', (): void => {
	// Saturday 9th March 2019, at 16:20:35:500
	const date = new Date(2019, 2, 9, 16, 20, 35, 1);

	const amDate = new Date(2019, 2, 9, 5, 20, 35, 1);

	const noonDate = new Date(2019, 2, 9, 12, 20, 35, 1);

	test('empty', (): void => {
		const formatted = new Timestamp('').display(date);
		expect(formatted).toBe('');
	});

	test('Y', (): void => {
		const formatted = new Timestamp('Y').display(date);
		expect(formatted).toBe('19');
	});

	test('YY', (): void => {
		const formatted = new Timestamp('YY').display(date);
		expect(formatted).toBe('19');
	});

	test('YYY', (): void => {
		const formatted = new Timestamp('YYY').display(date);
		expect(formatted).toBe('2019');
	});

	test('YYYY', (): void => {
		const formatted = new Timestamp('YYYY').display(date);
		expect(formatted).toBe('2019');
	});

	test('Q', (): void => {
		const formatted = new Timestamp('Q').display(date);
		expect(formatted).toBe('1');
	});

	test('M', (): void => {
		const formatted = new Timestamp('M').display(date);
		expect(formatted).toBe('3');
	});

	test('MM', (): void => {
		const formatted = new Timestamp('MM').display(date);
		expect(formatted).toBe('03');
	});

	test('MMM', (): void => {
		const formatted = new Timestamp('MMM').display(date);
		expect(formatted).toBe('March');
	});

	test('MMMM', (): void => {
		const formatted = new Timestamp('MMMM').display(date);
		expect(formatted).toBe('March');
	});

	test('D', (): void => {
		const formatted = new Timestamp('D').display(date);
		expect(formatted).toBe('9');
	});

	test('DD', (): void => {
		const formatted = new Timestamp('DD').display(date);
		expect(formatted).toBe('09');
	});

	test('DDD', (): void => {
		const formatted = new Timestamp('DDD').display(date);
		expect(formatted).toBe('68');
	});

	test('DDDD', (): void => {
		const formatted = new Timestamp('DDDD').display(date);
		expect(formatted).toBe('68');
	});

	test('d', (): void => {
		const formatted = new Timestamp('d').display(date);
		expect(formatted).toBe('9th');
	});

	test('d-st', (): void => {
		const dateSt = new Date(2019, 2, 1);
		const formatted = new Timestamp('d').display(dateSt);
		expect(formatted).toBe('1st');
	});

	test('d-nd', (): void => {
		const dateNd = new Date(2019, 2, 2);
		const formatted = new Timestamp('d').display(dateNd);
		expect(formatted).toBe('2nd');
	});

	test('d-rd', (): void => {
		const dateRd = new Date(2019, 2, 3);
		const formatted = new Timestamp('d').display(dateRd);
		expect(formatted).toBe('3rd');
	});

	test('dd', (): void => {
		const formatted = new Timestamp('dd').display(date);
		expect(formatted).toBe('Sa');
	});

	test('ddd', (): void => {
		const formatted = new Timestamp('ddd').display(date);
		expect(formatted).toBe('Sat');
	});

	test('dddd', (): void => {
		const formatted = new Timestamp('dddd').display(date);
		expect(formatted).toBe('Saturday');
	});

	test('H', (): void => {
		const formatted = new Timestamp('H').display(date);
		expect(formatted).toBe('16');
	});

	test('HH', (): void => {
		const formatted = new Timestamp('HH').display(date);
		expect(formatted).toBe('16');
	});

	test('h', (): void => {
		const formatted = new Timestamp('h').display(date);
		expect(formatted).toBe('4');
	});

	test('h-noon', (): void => {
		const formatted = new Timestamp('h').display(noonDate);
		expect(formatted).toBe('12');
	});

	test('hh', (): void => {
		const formatted = new Timestamp('hh').display(date);
		expect(formatted).toBe('04');
	});

	test('hh-noon', (): void => {
		const formatted = new Timestamp('hh').display(noonDate);
		expect(formatted).toBe('12');
	});

	test('a', (): void => {
		const formatted = new Timestamp('a').display(date);
		expect(formatted).toBe('pm');
	});

	test('A', (): void => {
		const formatted = new Timestamp('A').display(date);
		expect(formatted).toBe('PM');
	});

	test('a-am', (): void => {
		const formatted = new Timestamp('a').display(amDate);
		expect(formatted).toBe('am');
	});

	test('A-am', (): void => {
		const formatted = new Timestamp('A').display(amDate);
		expect(formatted).toBe('AM');
	});

	test('m', (): void => {
		const formatted = new Timestamp('m').display(date);
		expect(formatted).toBe('20');
	});

	test('mm', (): void => {
		const formatted = new Timestamp('mm').display(date);
		expect(formatted).toBe('20');
	});

	test('s', (): void => {
		const formatted = new Timestamp('s').display(date);
		expect(formatted).toBe('35');
	});

	test('ss', (): void => {
		const formatted = new Timestamp('ss').display(date);
		expect(formatted).toBe('35');
	});

	test('S', (): void => {
		const formatted = new Timestamp('S').display(date);
		expect(formatted).toBe('1');
	});

	test('SS', (): void => {
		const formatted = new Timestamp('SS').display(date);
		expect(formatted).toBe('01');
	});

	test('SSS', (): void => {
		const formatted = new Timestamp('SSS').display(date);
		expect(formatted).toBe('001');
	});

	test('T', (): void => {
		const formatted = new Timestamp('T').display(date);
		expect(formatted).toBe('4:20 PM');
	});

	test('T-noon', (): void => {
		const formatted = new Timestamp('T').display(noonDate);
		expect(formatted).toBe('12:20 PM');
	});

	test('T-am', (): void => {
		const formatted = new Timestamp('T').display(amDate);
		expect(formatted).toBe('5:20 AM');
	});

	test('t', (): void => {
		const formatted = new Timestamp('t').display(date);
		expect(formatted).toBe('4:20:35 pm');
	});

	test('t-noon', (): void => {
		const formatted = new Timestamp('t').display(noonDate);
		expect(formatted).toBe('12:20:35 pm');
	});

	test('t-am', (): void => {
		const formatted = new Timestamp('t').display(amDate);
		expect(formatted).toBe('5:20:35 am');
	});

	test('L', (): void => {
		const formatted = new Timestamp('L').display(date);
		expect(formatted).toBe('03/09/2019');
	});

	test('l', (): void => {
		const formatted = new Timestamp('l').display(date);
		expect(formatted).toBe('3/09/2019');
	});

	test('LL', (): void => {
		const formatted = new Timestamp('LL').display(date);
		expect(formatted).toBe('March 09, 2019');
	});

	test('ll', (): void => {
		const formatted = new Timestamp('ll').display(date);
		expect(formatted).toBe('Mar 09, 2019');
	});

	test('LLL', (): void => {
		const formatted = new Timestamp('LLL').display(date);
		expect(formatted).toBe('March 09, 2019 4:20 PM');
	});

	test('LLL-noon', (): void => {
		const formatted = new Timestamp('LLL').display(noonDate);
		expect(formatted).toBe('March 09, 2019 12:20 PM');
	});

	test('LLL-am', (): void => {
		const formatted = new Timestamp('LLL').display(amDate);
		expect(formatted).toBe('March 09, 2019 5:20 AM');
	});

	test('lll', (): void => {
		const formatted = new Timestamp('lll').display(date);
		expect(formatted).toBe('Mar 09, 2019 4:20 PM');
	});

	test('lll-noon', (): void => {
		const formatted = new Timestamp('lll').display(noonDate);
		expect(formatted).toBe('Mar 09, 2019 12:20 PM');
	});

	test('lll-am', (): void => {
		const formatted = new Timestamp('lll').display(amDate);
		expect(formatted).toBe('Mar 09, 2019 5:20 AM');
	});

	test('LLLL', (): void => {
		const formatted = new Timestamp('LLLL').display(date);
		expect(formatted).toBe('Saturday, March 09, 2019 4:20 PM');
	});

	test('LLLL-noon', (): void => {
		const formatted = new Timestamp('LLLL').display(noonDate);
		expect(formatted).toBe('Saturday, March 09, 2019 12:20 PM');
	});

	test('LLLL-am', (): void => {
		const formatted = new Timestamp('LLLL').display(amDate);
		expect(formatted).toBe('Saturday, March 09, 2019 5:20 AM');
	});

	test('llll', (): void => {
		const formatted = new Timestamp('llll').display(date);
		expect(formatted).toBe('Sat Mar 09, 2019 4:20 PM');
	});

	test('llll-noon', (): void => {
		const formatted = new Timestamp('llll').display(noonDate);
		expect(formatted).toBe('Sat Mar 09, 2019 12:20 PM');
	});

	test('llll-am', (): void => {
		const formatted = new Timestamp('llll').display(amDate);
		expect(formatted).toBe('Sat Mar 09, 2019 5:20 AM');
	});

	// Timezone sensitive
	test.skip('Z', (): void => {
		const formatted = new Timestamp('Z').display(date);
		expect(formatted).toBe('-01:00');
	});

	// Timezone sensitive
	test.skip('ZZ', (): void => {
		const formatted = new Timestamp('ZZ').display(date);
		expect(formatted).toBe('-01:00');
	});

	test('display-number-overload-LLLL', (): void => {
		const formatted = new Timestamp('LLLL').display(date.valueOf());
		expect(formatted).toBe('Saturday, March 09, 2019 4:20 PM');
	});

	test('display-string-overload-LLLL', (): void => {
		const formatted = new Timestamp('LLLL').display(date.toUTCString());
		expect(formatted).toBe('Saturday, March 09, 2019 4:20 PM');
	});

	test('hh:mm:ss', (): void => {
		const formatted = new Timestamp('hh:mm:ss').display(date);
		expect(formatted).toBe('04:20:35');
	});

	test('hh[ hours, ]mm[ minutes]', (): void => {
		const formatted = new Timestamp('hh[ hours, ]mm[ minutes]').display(date);
		expect(formatted).toBe('04 hours, 20 minutes');
	});

	test('display-arbitrary-date-overload-LLLL', (): void => {
		const formatted = Timestamp.displayArbitrary('LLLL', date);
		expect(formatted).toBe('Saturday, March 09, 2019 4:20 PM');
	});

	test('display-arbitrary-number-overload-LLLL', (): void => {
		const formatted = Timestamp.displayArbitrary('LLLL', date.valueOf());
		expect(formatted).toBe('Saturday, March 09, 2019 4:20 PM');
	});

	test('display-arbitrary-string-overload-LLLL', (): void => {
		const formatted = Timestamp.displayArbitrary('LLLL', date.toUTCString());
		expect(formatted).toBe('Saturday, March 09, 2019 4:20 PM');
	});

	test('toString', (): void => {
		const timestamp = new Timestamp('hh:mm:ss');
		expect(timestamp.toString()).toBe(timestamp.display());
	});

	test('static-utc', (): void => {
		const utcFormatted = Timestamp.utc();
		expect(utcFormatted.getDate()).toBe(new Date().getUTCDate());
	});

	test('arbitrary-now', (): void => {
		const timestamp = new Timestamp('hh:mm:ss');
		expect(Timestamp.displayArbitrary('hh:mm:ss')).toBe(timestamp.display());
	});

	test.skip('display-utc', (): void => {
		const formatted = new Timestamp('LLLL').displayUTC(date);
		expect(formatted).toBe('Saturday, March 09, 2019 9:20 PM');
	});
});
