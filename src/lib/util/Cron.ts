import { TimestampUtils, CronUtils } from './Constants';

/** @internal */
const DAY = TimestampUtils.Time.Day;

/**
 * Handles Cron strings and generates dates based on the cron string provided.
 * @see https://en.wikipedia.org/wiki/cron
 */
export class Cron {
	/**
	 * The cron pattern
	 */
	public cron: string;

	/**
	 * The normalized cron string
	 */
	public normalized: string;

	/**
	 * The minutes that this cron pattern includes
	 */
	public minutes: number[];

	/**
	 * The hours that this cron pattern includes
	 */
	public hours: number[];

	/**
	 * The days that this cron pattern includes
	 */
	public days: number[];
	
	/**
	 * The months that this cron pattern includes
	 */
	public months: number[];

	/**
	 * The days of the week that this cron pattern includes
	 */
	public dows: number[];

	/**
	 * @param cron The cron pattern to use
	 */
	public constructor(cron: string) {
		this.cron = cron.toLowerCase();
		this.normalized = Cron._normalize(this.cron);
		[this.minutes, this.hours, this.days, this.months, this.dows] = Cron._parseString(this.normalized);
	}

	/* istanbul ignore next */
	/**
	 * Get the next date that matches with the current pattern.
	 * @param outset The Date instance to compare with
	 * @param origin Whether this next call is origin
	 */
	public next(outset: Date = new Date(), origin = true): Date {
		if (!this.days.includes(outset.getUTCDate()) || !this.months.includes(outset.getUTCMonth() + 1) || !this.dows.includes(outset.getUTCDay())) {
			return this.next(new Date(outset.getTime() + DAY), false);
		}

		if (!origin) return new Date(Date.UTC(outset.getUTCFullYear(), outset.getUTCMonth(), outset.getUTCDate(), this.hours[0], this.minutes[0]));

		const now = new Date(outset.getTime() + 60000);

		for (const hour of this.hours) {
			if (hour < now.getUTCHours()) continue;
			for (const minute of this.minutes) {
				if (hour === now.getUTCHours() && minute < now.getUTCMinutes()) continue;
				return new Date(Date.UTC(outset.getUTCFullYear(), outset.getUTCMonth(), outset.getUTCDate(), hour, minute));
			}
		}

		return this.next(new Date(outset.getTime() + DAY), false)
	}

	/**
	 * Defines toString behavior of the Cron instance.
	 */
	public toString(): string {
		return this.cron;
	}

	/**
	 * Defines valueOf behavior of the Cron instance.
	 */
	public valueOf(): string {
		return this.normalized;
	}

	/**
	 * Normalize the pattern.
	 * @param cron The pattern to normalize
	 */
	private static _normalize(cron: string): string {
		if (cron in CronUtils.predefined) return CronUtils.predefined[cron];
		const now = new Date();
		cron = cron.split(' ').map((val, i): string => val.replace(CronUtils.wildcardRegex, (match) => {
			/* istanbul ignore if uses Math.random() */
			if (match === 'h') return Math.floor(Math.random() * (CronUtils.allowedNum[i][1] + 1)).toString();
			/* istanbul ignore else */
			if (match === '?') {
				switch (i) {
					case 0: return now.getUTCMinutes().toString();
					case 1: return now.getUTCHours().toString();
					case 2: return now.getUTCDate().toString();
					case 3: return now.getUTCMonth().toString();
					case 4: return now.getUTCDay().toString();
				}
			}
			/* istanbul ignore next */
			return match;
		})).join(' ');

		return cron.replace(CronUtils.tokensRegex, (match): string => String(CronUtils.tokens[match]));
	}

	/**
	 * Parses the pattern.
	 * @param cron The pattern to parse
	 */
	private static _parseString(cron: string): number[][] {
		const parts = cron.split(' ');
		if (parts.length !== 5) throw new Error('Invalid Cron Provided');
		return parts.map(Cron._parsePart);
	}

	/**
	 * Parses the current part.
	 * @param cronPart The part of the pattern to parse
	 * @param id The id that identifies the current part
	 */
	private static _parsePart(cronPart: string, id: number): number[] {
		if (cronPart.includes(',')) {
			const res = [];
			for (const part of cronPart.split(',')) res.push(...Cron._parsePart(part, id));
			return [...new Set(res)].sort((a, b): number => a - b);
		}

		// eslint-disable-next-line prefer-const
		const [, wild, minStr, maxStr, step] = CronUtils.partRegex.exec(cronPart)!;
		let [min, max] = [Number.parseInt(minStr), Number.parseInt(maxStr)];

		if (wild) [min, max] = CronUtils.allowedNum[id]!;
		else if (!max && !step) return [min];
		/* istanbul ignore next */
		[min, max] = [min, max || CronUtils.allowedNum[id]![1]].sort((a, b): number => a - b);
		return Cron._range(min, max, Number.parseInt(step) || 1);
	}

	/**
	 * Gets an array of numbers with the selected range.
	 * @param min The minimum value
	 * @param max The maximum value
	 * @param step The step value
	 */
	private static _range(min: number, max: number, step: number): number[] {
		return new Array(Math.floor((max - min) / step) + 1).fill(0).map((_val, i): number => min + (i * step));
	}
}