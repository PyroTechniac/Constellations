import { Cron } from '../src';

const minutes = new Array(60).fill(0).map((_, i): number => i);
const hours = new Array(24).fill(0).map((_, i): number => i);
const days = new Array(31).fill(0).map((_, i): number => i + 1);
const months = new Array(12).fill(0).map((_, i): number => i + 1);
const dows = new Array(7).fill(0).map((_, i): number => i);

function odds(numbers: number[]): number[] {
	return numbers.filter((num): boolean => Boolean(num % 2));
}

function evens(numbers: number[]): number[] {
	return numbers.filter((num): boolean => !(num % 2));
}

test('pre-defined-@hourly', (): void => {
	const specimine = new Cron('@hourly');

	expect(specimine.normalized).toBe('0 * * * *');
	expect(specimine.minutes).toStrictEqual([0]);
	expect(specimine.hours).toStrictEqual(hours);
	expect(specimine.days).toStrictEqual(days);
	expect(specimine.months).toStrictEqual(months);
	expect(specimine.dows).toStrictEqual(dows);
});

test('pre-defined-@daily', (): void => {
	const specimine = new Cron('@daily');

	expect(specimine.normalized).toBe('0 0 * * *');
	expect(specimine.minutes).toStrictEqual([0]);
	expect(specimine.hours).toStrictEqual([0]);
	expect(specimine.days).toStrictEqual(days);
	expect(specimine.months).toStrictEqual(months);
	expect(specimine.dows).toStrictEqual(dows);
});

test('pre-defined-@weekly', (): void => {
	const specimine = new Cron('@weekly');

	expect(specimine.normalized).toBe('0 0 * * 0');
	expect(specimine.minutes).toStrictEqual([0]);
	expect(specimine.hours).toStrictEqual([0]);
	expect(specimine.days).toStrictEqual(days);
	expect(specimine.months).toStrictEqual(months);
	expect(specimine.dows).toStrictEqual([0]);
});

test('pre-defined-@monthly', (): void => {
	const specimine = new Cron('@monthly');

	expect(specimine.normalized).toBe('0 0 1 * *');
	expect(specimine.minutes).toStrictEqual([0]);
	expect(specimine.hours).toStrictEqual([0]);
	expect(specimine.days).toStrictEqual([1]);
	expect(specimine.months).toStrictEqual(months);
	expect(specimine.dows).toStrictEqual(dows);
});

test('pre-defined-@yearly', (): void => {
	const specimine = new Cron('@yearly');

	expect(specimine.normalized).toBe('0 0 1 1 *');
	expect(specimine.minutes).toStrictEqual([0]);
	expect(specimine.hours).toStrictEqual([0]);
	expect(specimine.days).toStrictEqual([1]);
	expect(specimine.months).toStrictEqual([1]);
	expect(specimine.dows).toStrictEqual(dows);
});

test('pre-defined-@annually', (): void => {
	const specimine = new Cron('@annually');

	expect(specimine.normalized).toBe('0 0 1 1 *');
	expect(specimine.minutes).toStrictEqual([0]);
	expect(specimine.hours).toStrictEqual([0]);
	expect(specimine.days).toStrictEqual([1]);
	expect(specimine.months).toStrictEqual([1]);
	expect(specimine.dows).toStrictEqual(dows);
});

test('every-minute', (): void => {
	const specimine = new Cron('* * * * *');

	expect(specimine.normalized).toBe('* * * * *');
	expect(specimine.minutes).toStrictEqual(minutes);
	expect(specimine.hours).toStrictEqual(hours);
	expect(specimine.days).toStrictEqual(days);
	expect(specimine.months).toStrictEqual(months);
	expect(specimine.dows).toStrictEqual(dows);
});

test('every-other-minute', (): void => {
	const specimine = new Cron('*/2 * * * *');

	expect(specimine.normalized).toBe('*/2 * * * *');
	expect(specimine.minutes).toStrictEqual(evens(minutes));
	expect(specimine.hours).toStrictEqual(hours);
	expect(specimine.days).toStrictEqual(days);
	expect(specimine.months).toStrictEqual(months);
	expect(specimine.dows).toStrictEqual(dows);
});

test('every-other-hour', (): void => {
	const specimine = new Cron('* */2 * * *');

	expect(specimine.normalized).toBe('* */2 * * *');
	expect(specimine.minutes).toStrictEqual(minutes);
	expect(specimine.hours).toStrictEqual(evens(hours));
	expect(specimine.days).toStrictEqual(days);
	expect(specimine.months).toStrictEqual(months);
	expect(specimine.dows).toStrictEqual(dows);
});

test('every-other-day', (): void => {
	const specimine = new Cron('* * */2 * *');

	expect(specimine.normalized).toBe('* * */2 * *');
	expect(specimine.minutes).toStrictEqual(minutes);
	expect(specimine.hours).toStrictEqual(hours);
	expect(specimine.days).toStrictEqual(odds(days));
	expect(specimine.months).toStrictEqual(months);
	expect(specimine.dows).toStrictEqual(dows);
});

test('every-other-month', (): void => {
	const specimine = new Cron('* * * */2 *');

	expect(specimine.normalized).toBe('* * * */2 *');
	expect(specimine.minutes).toStrictEqual(minutes);
	expect(specimine.hours).toStrictEqual(hours);
	expect(specimine.days).toStrictEqual(days);
	expect(specimine.months).toStrictEqual(odds(months));
	expect(specimine.dows).toStrictEqual(dows);
});

test('every-other-day-of-week', (): void => {
	const specimine = new Cron('* * * * */2');

	expect(specimine.normalized).toBe('* * * * */2');
	expect(specimine.minutes).toStrictEqual(minutes);
	expect(specimine.hours).toStrictEqual(hours);
	expect(specimine.days).toStrictEqual(days);
	expect(specimine.months).toStrictEqual(months);
	expect(specimine.dows).toStrictEqual(evens(dows));
});

test('every-monday-through-friday-at-midnight', (): void => {
	const specimine = new Cron('0 0 * * mon-fri');

	expect(specimine.normalized).toBe('0 0 * * 1-5');
	expect(specimine.minutes).toStrictEqual([0]);
	expect(specimine.hours).toStrictEqual([0]);
	expect(specimine.days).toStrictEqual(days);
	expect(specimine.months).toStrictEqual(months);
	expect(specimine.dows).toStrictEqual([1, 2, 3, 4, 5]);
});

test('every-friday-in-july-at-midnight', (): void => {
	const specimine = new Cron('0 0 * jul fri');

	expect(specimine.normalized).toBe('0 0 * 7 5');
	expect(specimine.minutes).toStrictEqual([0]);
	expect(specimine.hours).toStrictEqual([0]);
	expect(specimine.days).toStrictEqual(days);
	expect(specimine.months).toStrictEqual([7]);
	expect(specimine.dows).toStrictEqual([5]);
});

test('every-friday-in-july-and-august-at-midnight', (): void => {
	const specimine = new Cron('0 0 * jul,aug fri');

	expect(specimine.normalized).toBe('0 0 * 7,8 5');
	expect(specimine.minutes).toStrictEqual([0]);
	expect(specimine.hours).toStrictEqual([0]);
	expect(specimine.days).toStrictEqual(days);
	expect(specimine.months).toStrictEqual([7, 8]);
	expect(specimine.dows).toStrictEqual([5]);
});

test('this-instant', (): void => {
	const now = new Date();
	const [min, hour, day, month, dow] = [now.getUTCMinutes(), now.getUTCHours(), now.getUTCDate(), now.getUTCMonth(), now.getUTCDay()];
	const specimine = new Cron('? ? ? ? ?');

	expect(specimine.normalized).toBe(`${min} ${hour} ${day} ${month} ${dow}`);
	expect(specimine.minutes).toStrictEqual([min]);
	expect(specimine.hours).toStrictEqual([hour]);
	expect(specimine.days).toStrictEqual([day]);
	expect(specimine.months).toStrictEqual([month]);
	expect(specimine.dows).toStrictEqual([dow]);
});

test('bad-cron', (): void => {
	expect((): Cron => new Cron('? ?')).toThrow('Invalid Cron Provided');
});

test('valueOf-is-normalized', (): void => {
	const specimine = new Cron('* * * * mon-fri');

	expect(specimine.valueOf()).toBe('* * * * 1-5');
});

test('toString-is-cron', (): void => {
	const specimine = new Cron('* * * * mon-fri');

	expect(specimine.toString()).toBe('* * * * mon-fri');
});