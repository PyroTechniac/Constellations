import { ConstellationClient } from "../../Client";
import { Provider } from '../../structures/Provider';
import { Schema, SchemaJSON } from "../schema/Schema";

export class GatewayStorage {

	/**
	 * The client this gateway was created with
	 */
	public readonly client: ConstellationClient;

	/**
	 * The name of this gateway
	 */
	public readonly name: string;

	/**
	 * The schema for this gateway
	 */
	public readonly schema: Schema;

	/**
	 * Whether or not this gateway has been initialized
	 */
	public ready = false;

	/**
	 * The provider's name that manages this gateway
	 */
	private readonly _provider: string;

	public constructor(client: ConstellationClient, name: string, options: GatewayStorageOptions = {}) {
		this.client = client;
		this.name = name;
		this.schema = options.schema ?? new Schema();
		this._provider = options.provider || client.options.providers.default || '';
	}

	/**
	 * The provider that manages this gateway's persistent data
	 */
	public get provider(): Provider | null {
		return this.client.providers.get(this._provider) || null;
	}

	/**
	 * Initializes the gateway.
	 */
	public async init(): Promise<void> {
		if (this.ready) throw new Error(`The gateway "${this.name}" has already been initialized.`);

		const { provider } = this;
		if (provider === null) throw new Error(`The gateway "${this.name}" could not find the provider "${this._provider}".`);
		this.ready = true;

		const errors = [...this._checkSchemaFolder(this.schema)];
		if (errors.length) throw new Error(`[SCHEMA] There is an error with your schema.\n${errors.join('\n')}`);

		// eslint-disable-next-line dot-notation
		this.schema.defaults['_init'](this.schema.defaults, this.schema);

		const hasTable = await provider.hasTable(this.name);
		if (!hasTable) await provider.createTable(this.name);

		const columns = await provider.getColumns(this.name);
		if (columns.length) {
			const promises = [];
			for (const entry of this.schema.values(true)) {
				if (!columns.includes(entry.path)) promises.push(provider.addColumn(this.name ,entry));
			}
			await Promise.all(promises);
		}

		await this.sync();
	}

	/**
	 * Runs a synchronization task for the gateway.
	 */
	public async sync(): Promise<this> {
		return this;
	}

	/**
	 * Overrides `JSON.stringify` behavior for this instance.
	 */
	public toJSON(): GatewayStorageJSON {
		return {
			name: this.name,
			provider: this._provider,
			schema: this.schema.toJSON()
		}
	}

	private *_checkSchemaFolder(schema: Schema): IterableIterator<string> {
		for (const value of schema.values()) {
			if (value instanceof Schema) {
				yield* this._checkSchemaFolder(value);
			} else {
				value.client = this.client;
				try {
					value._check();
					Object.freeze(value);
				} catch (error) {
					value.parent.delete(value.key);
					yield error.message;
				}
			}
		}

		schema.ready = true;
	}
}

export interface GatewayStorageOptions {
	schema?: Schema;
	provider?: string;
}

export interface GatewayStorageJSON {
	name: string;
	provider: string;
	schema: SchemaJSON;
}