import Collection, { CollectionConstructor } from '@discordjs/collection';
import { RateLimit } from './RateLimit';

/**
 * Manages {@link RateLimit}s.
 * @typeParam K The key for the RateLimits
 */
export class RateLimitManager<K = string> extends Collection<K, RateLimit> {

	/**
	 * The bucket of how many times each RateLimit can drip
	 */
	private _bucket!: number;

	/**
	 * The cooldown before each RateLimit can be reset
	 */
	private _cooldown!: number;

	/**
	 * The timer for sweeping old RateLimits
	 */
	private sweepInterval!: NodeJS.Timer | null;

	/**
	 * @param bucket The amount of times a RateLimit can drip before it's limited
	 * @param cooldown The amount of milliseconds for the ratelimits from this manager to expire
	 */
	public constructor(bucket: number, cooldown: number) {
		super();

		Object.defineProperty(this, 'sweepInterval', { value: null, writable: true });
		Object.defineProperty(this, '_bucket', { value: bucket, writable: true });
		Object.defineProperty(this, '_cooldown', { value: cooldown, writable: true });
	}

	/**
	 * The amount of times a RateLimit from this manager can drip before it expires
	 */
	public get bucket(): number {
		return this._bucket;
	}

	public set bucket(value: number) {
		for (const ratelimit of this.values()) ratelimit.bucket = value;
		this._bucket = value;
	}

	/**
	 * The amount of milliseconds for the ratelimits from this manager to expire
	 */
	public get cooldown(): number {
		return this._cooldown;
	}

	public set cooldown(value: number) {
		for (const ratelimit of this.values()) ratelimit.cooldown = value;
		this._cooldown = value;
	}

	/**
	 * Gets a RateLimit from this manager or creates it if it does not exist.
	 * @param id The id for the RateLimit
	 */
	public acquire(id: K): RateLimit {
		return this.get(id) || this.create(id);
	}

	/**
	 * Creates a RateLimit for this manager.
	 * @param id The id for the RateLimit
	 */
	public create(id: K): RateLimit {
		const ratelimit = new RateLimit(this._bucket, this._cooldown);
		this.set(id, ratelimit);
		return ratelimit;
	}

	/**
	 * Wraps Collection's set method to set interval to sweep inactive RateLimits.
	 * @param id The id the RateLimit belongs to
	 * @param ratelimit The RateLimit to set
	 */
	public set(id: K, ratelimit: RateLimit): this {
		if (!(ratelimit instanceof RateLimit)) throw new Error('Invalid RateLimit');
		if (!this.sweepInterval) this.sweepInterval = setInterval(this.sweep.bind(this), 30000);
		return super.set(id, ratelimit);
	}

	/**
	 * Wraps Collection's sweep method to clear the interval when this manager is empty.
	 * @param fn The filter function
	 * @param thisArg The this for the sweep
	 */
	public sweep(fn: (value: RateLimit, key: K, collection: this) => boolean = (rl): boolean => rl.expired, thisArg?: any): number {
		const amount = super.sweep(fn, thisArg);

		if (this.size === 0) {
			clearInterval(this.sweepInterval!);
			this.sweepInterval = null;
		}

		return amount;
	}

	/**
	 * Clears the RateLimitManager, and clears the interval if one was set.
	 */
	public clear(): void {
		if (this.sweepInterval) {
			clearInterval(this.sweepInterval);
			this.sweepInterval = null;
		}

		return super.clear();
	}

	public static get [Symbol.species](): CollectionConstructor {
		return Collection as unknown as CollectionConstructor;
	}

}
