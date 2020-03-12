/**
 * A class to handle multiple requests at once
 */
export class RequestHandler<K, V extends IdKeyed<K>> {
	/**
	 * The function used to get values
	 */
	public getFn: GetFn<K, V>;
	/**
	 * The function used to get all values
	 */
	public getAllFn: GetAllFn<K, V>;
	/**
	 * The queue of referred promises
	 */
	private queue = new Map<K, ReferredPromise<V | null>>();
	/**
	 * The promise used when synchronizing requests
	 */
	private synchronizing: Promise<void> | null = null;

	public constructor(getFn: GetFn<K, V>, getAllFn: GetAllFn<K, V>) {
		this.getFn = getFn;
		this.getAllFn = getAllFn;
	}

	/**
	 * Whether this handler has anything left in the queue
	 */
	public get available(): boolean {
		return this.synchronizing === null;
	}

	/**
	 * Pushes a request onto the queue.
	 * @param key The key of the requested value
	 */
	public push(key: K): Promise<V> {
		const previous = this.queue.get(key);
		if (typeof previous !== 'undefined') return previous.promise as Promise<V>;

		const referredPromise = this.createReferPromise();
		this.queue.set(key, referredPromise);

		if (this.available) this.synchronizing = this.run();
		return referredPromise.promise;
	}

	/**
	 * Wait for all queued requests to finish.
	 */
	public async wait(): Promise<void> {
		if (this.synchronizing === null) return;

		try {
			await this.synchronizing;
		} catch {
			// Do nothing
		}

		if (this.synchronizing !== null) {
			try {
				await this.synchronizing;
			} catch {
				// Do nothing
			}
		}
	}

	private async run(): Promise<void> {
		const { queue } = this;
		this.queue = new Map();

		const keys = [...queue.keys()];
		if (keys.length === 1) {
			const [key] = keys;
			try {
				const value = await this.getFn(key);
				queue.get(key)!.resolve(value);
			} catch (error) {
				queue.get(key)!.reject(error);
			}
		} else if (keys.length > 1) {
			try {
				const values = await this.getAllFn(keys);
				for (const value of values) {
					// Guard for getAll functions that return null
					if (value === null || typeof value !== 'object') continue;

					// Retrieve the entry by the value's id, then resolve and
					// delete it from the queue to prevent resolving twice.
					const entry = queue.get(value.id);
					if (typeof entry === 'undefined') continue;
					entry.resolve(value);
					queue.delete(value.id);
				}
				for (const entry of queue.values()) {
					entry.resolve(null);
				}
			} catch (error) {
				for (const entry of queue.values()) {
					entry.reject(error);
				}
			}
		}

		this.synchronizing = this.queue.size === 0 ? null : this.run()
	}

	/**
	 * Creates a referred promise to push onto the queue.
	 */
	private createReferPromise(): ReferredPromise<V> {
		let resolve: (value?: V) => void;
		let reject: (error?: Error) => void;
		const promise = new Promise<V>((res, rej): void => {
			resolve = res;
			reject = rej;
		});

		return { promise, resolve: resolve!, reject: reject! };
	}
}

export interface IdKeyed<K> {
	id: K
}

export interface GetFn<K, V> {
	(key: K): Promise<V>;
}

export interface GetAllFn<K, V> {
	(keys: K[]): Promise<V[]>;
}

export interface ReferredPromise<T> {
	promise: Promise<T>;
	resolve(value?: T): void;
	reject(error?: Error): void;
}