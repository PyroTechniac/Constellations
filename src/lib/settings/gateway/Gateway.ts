import { GatewayStorage } from './GatewayStorage';
import { Settings } from '../structures/Settings';
import { ConstellationClient } from '../../Client';
import Collection from '@discordjs/collection';
import { IdKeyed, RequestHandler } from '../../util/RequestHandler';

export class Gateway extends GatewayStorage {

	/* eslint-disable @typescript-eslint/ban-ts-ignore */
	/**
	 * The cached entries for this Gateway or the external datastore to get the settings from
	 */
	// @ts-ignore
	public cache: ProxyMap = (this.name in this.client) && (this.client[this.name as keyof ConstellationClient]?.cache instanceof Map) ?
		// @ts-ignore
		this.client[this.name as keyof ConstellationClient].cache as ProxyMap :
		new Collection<string, ProxyMapEntry>();
	/* eslint-enable @typescript-eslint/ban-ts-ignore */

	/**
	 * The request handler that manages the syncronization queue
	 */
	public requestHandler = new RequestHandler(
		(id: string): Promise<IdKeyed<string>> => {
			const { provider } = this;
			return provider === null ?
				Promise.reject(new Error('Cannot run requests without a provider available.')) :
				provider.get(this.name, id) as Promise<IdKeyed<string>>;
		}, (ids: string[]): Promise<IdKeyed<string>[]> => {
			const { provider } = this;
			return provider === null ?
				Promise.reject(new Error('Cannot run requests without a provider available.')) :
				provider.getAll(this.name, ids) as Promise<IdKeyed<string>[]>;
		}
	);

	/**
	 * Gets an entry from the cache or creates one if it does not exist.
	 * 
	 * ```typescript
	 * // Retrieve a members gateway
	 * const gateway = this.client.gateways.get('members');
	 * 
	 * // Acquire a settings instance belonging to a member
	 * gateway.acquire(message.member);
	 * ```
	 * @param target The target that holds a Settings instance of the holder for the new one
	 * @param id The settings' identificator
	 */
	public acquire(target: IdKeyed<string>, id = target.id): Settings {
		return this.get(id) ?? this.create(target, id);
	}

	/**
	 * Get an entry from the cache.
	 * 
	 * ```typescript
	 * // Retrieve a members gateway
	 * const gateway = this.client.gateways.get('members');
	 * 
	 * // Retrieve a settings instance belonging to a member's id
	 * const settings = gateway.get(someMemberId);
	 * 
	 * // Do something with it, be careful as it can return null
	 * if (settings === null) {
	 * 		// settings is null
	 * } else {
	 * 		// console.log(settings);
	 * }
	 * ```
	 * @param id The key to get from the cache
	 */
	public get(id: string): Settings | null {
		const entry = this.cache.get(id);
		return entry?.settings ?? null;
	}

	/**
	 * Creates a new {@link Settings} instance for this gateway.
	 * @param target The target that will hold this instance alive
	 * @param id The settings' identificator
	 */
	public create(target: IdKeyed<string>, id = target.id): Settings {
		const settings = new Settings(this, target, id);
		if (this.schema.size !== 0) {
			/* istanbul ignore next: Hard to coverage test the catch */
			settings.sync(true).catch((error): boolean => this.client.emit('wtf', error));
		}
		return settings;
	}

	/**
	 * Runs a synchronization task for the gateway.
	 */
	public async sync(): Promise<this> {
		await this.requestHandler.wait();
		return this;
	}
}

export interface ProxyMapEntry {
	settings: Settings;
}

export type ProxyMap = Map<string, ProxyMapEntry>;