import { performance } from 'perf_hooks';

/**
 * The stopwatch class, uses native node to get the most accurate timer.
 */
export class Stopwatch {

	/**
	 * The number of digits to appear after the decimal point when returning the friendly duration
	 */
	public digits: number;

	/**
	 * The start time of this stopwatch
	 */
	private _start: number = performance.now();

	/**
	 * The end time of this stopwatch
	 */
	private _end: number | null = null;

	/**
	 * Starts a new stopwatch
	 * @param digits The amount of digits after the decimal point
	 */
	public constructor(digits = 2) {
		this.digits = digits;
	}

	/**
	 * The duration of this stopwatch since start or start to end if the stopwatch has stopped
	 */
	public get duration(): number {
		return (this._end ?? performance.now()) - this._start;
	}

	/**
	 * If the stopwatch is running or not
	 */
	public get running(): boolean {
		return Boolean(!this._end);
	}

	/**
	 * Restarts the stopwatch (Returns a running state).
	 * @chainable
	 */
	public restart(): this {
		this._start = performance.now();
		this._end = null;
		return this;
	}

	/**
	 * Resets the stopwatch (Returns a running state).
	 * @chainable
	 */
	public reset(): this {
		this._start = performance.now();
		this._end = this._start;
		return this;
	}

	/**
	 * Starts the Stopwatch.
	 * @chainable
	 */
	public start(): this {
		if (!this.running) {
			this._start = performance.now() - this.duration;
			this._end = null;
		}

		return this;
	}

	/**
	 * Stops the stopwatch, freezing the duration.
	 * @chainable
	 */
	public stop(): this {
		if (this.running) this._end = performance.now();
		return this;
	}

	/**
	 * Defines toString behavior
	 */
	public toString(): string {
		const time = this.duration;
		if (time >= 1000) return `${(time / 1000).toFixed(this.digits)}s`;
		/* istanbul ignore next */
		if (time >= 1) return `${time.toFixed(this.digits)}ms`;
		return `${(time * 1000).toFixed(this.digits)}μs`;
	}

}
