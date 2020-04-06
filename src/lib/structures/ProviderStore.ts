import { Store } from "./base/Store";
import { Provider } from "./Provider";
import { ConstellationClient } from "../Client";
import { Constructor } from "../util/SharedTypes";

export class ProviderStore extends Store<Provider> {
	
	/**
	 * Constructs our ProviderStore for use in Constellations
	 * @param client The client that instantiated the store
	 */
	public constructor(client: ConstellationClient) {
		super(client, 'providers', Provider as unknown as Constructor<Provider>);
	}

	/**
	 * The default provider set in {@link ConstellationClientOptions.providers ClientOptions#providers}
	 */
	public get default(): Provider | null {
		return this.get(this.client.options.providers.default as string) || null;
	}

	/**
	 * Clears the providers from the store and waits for them to shutdown.
	 */
	public clear(): void {
		for (const provider of this.values()) this.delete(provider);
	}

	/**
	 * Deletes a provider from the store.
	 * @param name The Provider instance or it's name
	 */
	public delete(name: string | Provider): boolean {
		const provider = this.resolve(name);
		if (!provider) return false;

		Promise.resolve(provider.shutdown()).catch((error): boolean => this.client.emit('wtf', error));
		return super.delete(provider);
	}
}

export interface ProvidersOptions extends Record<string, any> {
	default?: string;
}