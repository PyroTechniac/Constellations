import { Duration } from '../src';

test('simple-duration', (): void => {
	const duration = new Duration('a second');
	expect(duration.offset).toBe(1000);
});

test('simple-not-duration', (): void => {
	const duration = new Duration('a horse');
	expect(duration.offset).toBe(0);
});

test('valueOf-is-offset', (): void => {
	const duration = new Duration('1h');

	expect(+duration).toBe(duration.offset);
});

test('simple-dateFrom-duration', (): void => {
	const duration = new Duration('a second');
	const date = new Date();

	expect(duration.dateFrom(date)).toStrictEqual(new Date(date.getTime() + 1000));
});

test('simple-date-fromNow-duration', (): void => {
	const duration = new Duration('a second');
	const offset = duration.fromNow.valueOf() - Date.now();
	expect(offset).toBe(1000);
});

test('toNow-simple-seconds', (): void => {
	const duration = new Duration('a second');

	expect(Duration.toNow(duration, true)).toBe('in seconds');
});

test('toNow-simple-minute', (): void => {
	const duration = new Duration('62s');

	expect(Duration.toNow(duration)).toBe('a minute');
});

test('toNow-simple-minutes', (): void => {
	const duration = new Duration('2mins');

	expect(Duration.toNow(duration)).toBe('2 minutes');
});

test('toNow-simple-hour', (): void => {
	const duration = new Duration('61m');

	expect(Duration.toNow(duration)).toBe('an hour');
});

test('toNow-simple-hours', (): void => {
	const duration = new Duration('2h');

	expect(Duration.toNow(duration)).toBe('2 hours');
});

test('toNow-simple-day', (): void => {
	const duration = new Duration('25h');

	expect(Duration.toNow(duration)).toBe('a day');
});

test('toNow-simple-days', (): void => {
	const duration = new Duration('2d');

	expect(Duration.toNow(duration)).toBe('2 days');
});

test('toNow-simple-month', (): void => {
	const duration = new Duration('30days');

	expect(Duration.toNow(duration)).toBe('a month');
});

test('toNow-simple-months', (): void => {
	const duration = new Duration('2 months');

	expect(Duration.toNow(duration)).toBe('2 months');
});

test('toNow-simple-year', (): void => {
	const duration = new Duration('13 months');

	expect(Duration.toNow(duration)).toBe('a year');
});

test('toNow-simple-years', (): void => {
	const duration = new Duration('3y');

	expect(Duration.toNow(duration)).toBe('3 years');
});

test('toNow-string', (): void => {
	const duration = new Duration('a second');

	expect(Duration.toNow(duration.fromNow.toISOString())).toBe('seconds');
});
