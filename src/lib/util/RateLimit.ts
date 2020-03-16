/**
 * RateLimit class for handling dripping of requests.
 */
export class RateLimit {

	/**
	 * The number of requests before this is limited
	 */
	public bucket: number;

	/**
	 * The amount of milliseconds for the ratelimit to expire
	 */
	public cooldown: number;

	/**
	 * The remaining times this RateLimit can be dripped before the RateLimit bucket is empty
	 */
	private remaining!: number;

	/**
	 * When this RateLimit is reset back to a full state
	 */
	private time!: number;

	/**
	 * @param bucket The number fo requests before this is limited
	 * @param cooldown The amount of milliseconds for this ratelimit to expire
	 */
	public constructor(bucket: number, cooldown: number) {
		this.bucket = bucket;
		this.cooldown = cooldown;

		this.reset();
	}

	/**
	 * Whether this RateLimit is expired or not, allowing the bucket to be reset
	 */
	public get expired(): boolean {
		return this.remainingTime === 0;
	}

	/**
	 * Whether this RateLimit is limited or not
	 */
	public get limited(): boolean {
		return !(this.remaining > 0 || this.expired);
	}

	/**
	 * The remaining time in milliseconds before this RateLimit instance is reset
	 */
	public get remainingTime(): number {
		return Math.max(this.time - Date.now(), 0);
	}

	/**
	 * Drips the RateLimit bucket.
	 * @chainable
	 */
	public drip(): this {
		if (this.limited) throw new Error('Ratelimited');
		if (this.expired) this.reset();

		this.remaining--;
		return this;
	}

	/**
	 * Resets the RateLimit back to it's full state.
	 * @chainable
	 */
	public reset(): this {
		return this.resetTime().resetRemaining();
	}

	/**
	 * Resets the RateLimit's reset time back to full state.
	 * @chainable
	 */
	public resetTime(): this {
		this.time = Date.now() + this.cooldown;

		return this;
	}

	/**
	 * Resets the RateLimit's remaining uses back to full state.
	 * @chainable
	 */
	public resetRemaining(): this {
		this.remaining = this.bucket;
		return this;
	}

}
