import Collection, { CollectionConstructor } from "@discordjs/collection";
import type { GatewayStorage, GatewayStorageJSON } from "./GatewayStorage";
import type { ConstellationClient } from "../../Client";

export class GatewayDriver extends Collection<string, GatewayStorage> {

	/**
	 * The client this GatewayDriver was created with
	 */
	public readonly client: ConstellationClient;

	/**
	 * Constructs a new instance of GatewayDriver
	 * @param client The client that manages this instance
	 */
	public constructor(client: ConstellationClient) {
		super();
		this.client = client;
	}

	/**
	 * Registers a new gateway.
	 * 
	 * ```typescript
	 * const { Client, Gateway } = require('@starlight-ts/constellations');
	 * 
	 * const client = new Client();
	 * client.register(new Gateway(client, 'channels'));
	 * ```
	 * 
	 * ```typescript
	 * const { Client, Gateway, GatewayStorage } = require('@starlight-ts/constellations');
	 * const client = new Client();
	 * 
	 * client.gateways
	 * 		.register(new Gateway(client, 'channels'))
	 * 		.register(new GatewayStorage(client, 'moderations', { provider: 'postgres' }));
	 * ```
	 * @param gateway The gateway to register
	 */
	public register(gateway: GatewayStorage): this {
		this.set(gateway.name, gateway);
		return this;
	}

	/**
	 * Initializes all gateways.
	 */
	public async init(): Promise<void> {
		await Promise.all(this.map((gateway): Promise<void> => gateway.init()));
	}

	/**
	 * Overrides `JSON.stringify` behavior for GatewayDriver.
	 */
	public toJSON(): GatewayDriverJSON {
		return Object.fromEntries([...this.entries()].map(([key, value]): [string, GatewayStorageJSON] => [key, value.toJSON()]));
	}

	/** @internal */
	public static get [Symbol.species](): CollectionConstructor {
		return Collection as unknown as CollectionConstructor;
	}
}

export type GatewayDriverJSON = Record<string, GatewayStorageJSON>;