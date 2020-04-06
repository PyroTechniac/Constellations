import { isFunction } from '../../util/Utils';
import { SettingsFolder } from '../structures/SettingsFolder';

export class Schema extends Map<string, SchemaFolder | SchemaEntry> {

	/**
	 * The base path for this schema
	 */
	public readonly path: string;

	/**
	 * The type of this schema
	 */
	public readonly type: 'Folder' = 'Folder';

	/**
	 * The defaults for this schema
	 */
	public readonly defaults: SettingsFolder = new SettingsFolder(this);

	/**
	 * Whether or not this instance is ready
	 */
	public ready = false;

	/**
	 * Constructs our schema
	 */
	public constructor(basePath = '') {
		super();

		this.path = basePath;
	}

	/**
	 * Adds or replaces an entry to this instance.
	 * @param key The key of the entry to add
	 * @param value The entry to add
	 */
	public set(key: string, value: SchemaFolder | SchemaEntry): this {
		if (this.ready) throw new Error('Cannot modify the schema after being initialized.');
		this.defaults.set(key, value instanceof Schema ? value.defaults : value.default);
		return super.set(key, value);
	}

	/**
	 * Removes an entry from this instance.
	 * @param key The key of the element to remove
	 */
	public delete(key: string): boolean {
		if (this.ready) throw new Error('Cannot modify the schema after being initialized.');
		this.defaults.delete(key);
		return super.delete(key);
	}

	/**
	 * Add a new entry to this folder.
	 *
	 * ```typescript
	 * new Schema()
	 * 		.add('experience', 'integer', { minimum: 0 });
	 * ```
	 *
	 * ```typescript
	 * KlasaClient.defaultUserSchema
	 * 		.add('experience', 'integer', { minimum: 0 })
	 * 		.add('level', 'integer', { minimum: 0 });
	 * ```
	 * @param key The name for the key to add
	 * @param type The datatype, will be lowercased in the instance
	 * @param options The options for the entry
	 */
	public add(key: string, type: string, options?: SchemaEntryOptions): this;
	/**
	 * Add a nested folder to this one.
	 *
	 * ```typescript
	 * new Schema()
	 * 		.add('social', social => social
	 * 			.add('experience', 'integer', { minimum: 0 }));
	 * ```
	 * @param key The name for the folder to add
	 * @param callback The callback receiving a SchemaFolder instance as a parameter
	 */
	public add(key: string, callback: SchemaAddCallback): this;
	public add(key: string, typeOrCallback: string | SchemaAddCallback, options?: SchemaEntryOptions): this {
		let SchemaCtor: typeof SchemaEntry | typeof SchemaFolder;
		let type: string;
		let callback: SchemaAddCallback | null = null;
		if (isFunction(typeOrCallback)) {
			type = 'Folder';
			SchemaCtor = SchemaFolder;
			callback = typeOrCallback;
		} else {
			type = typeOrCallback;
			SchemaCtor = SchemaEntry;
			callback = null;
		}

		const previous = super.get(key);
		if (typeof previous !== 'undefined') {
			if (type === 'Folder') {
				if (previous.type === 'Folder') {
					callback!(previous as SchemaFolder);
					return this;
				}
				throw new TypeError(`The type for "${key}" conflicts with the previous value, expected type "Folder", got "${previous.type}".`);
			}

			if (previous.type === 'Folder') {
				throw new Error(`The type for "${key}" conflicts with the previous value, expected a non-Folder, got "${previous.type}".`);
			}

			const schemaEntry = previous as SchemaEntry;
			schemaEntry.edit({ type, ...options });
			this.defaults.set(key, schemaEntry.default);
			return this;
		}

		const entry = new SchemaCtor(this, key, type, options);

		// eslint-disable-next-line callback-return
		if (callback !== null) callback(entry as SchemaFolder);
		this.set(key, entry);
		return this;
	}

	/**
	 * Get a child entry from this schema.
	 *
	 * ```typescript
	 * // Retrieve a key named experience that exists in this folder
	 * schema.get('experience');
	 * ```
	 *
	 * ```typescript
	 * // Retrieve a key named experience contained in a folder named social
	 * schema.get('social.experience');
	 * ```
	 * @param path The key or path to get from this schema
	 */
	public get(path: string): SchemaFolder | SchemaEntry | undefined {
		const index = path.indexOf('.');
		if (index === -1) return super.get(path);

		const key = path.substring(0, index);
		const value = super.get(key);

		if (typeof value === 'undefined') return undefined;

		if (value.isSchemaFolder()) return value.get(path.substring(index + 1));

		return undefined;
	}

	/**
	 * Checks if this instance is a SchemaFolder, used for type safety.
	 */
	public isSchemaFolder(): this is SchemaFolder {
		return this.type === 'Folder';
	}

	/**
	 * Checks if this instance is a SchemaEntry, used for type safety.
	 */
	public isSchemaEntry(): this is SchemaEntry {
		return this.type !== 'Folder';
	}

	/**
	 * Returns a new Iterator object that contains keys for each element contained in this folder.
	 * Identical to [Map.keys()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/keys).
	 * @param recursive Whether the iteration should be recursive
	 */
	public *keys(recursive = false): IterableIterator<string> {
		if (recursive) {
			for (const [key, value] of super.entries()) {
				if (value.isSchemaFolder()) yield* value.keys(true);
				else yield key;
			}
		} else {
			yield* super.keys();
		}
	}

	/**
 	* Returns a new Iterator object that contains the values for each element contained in this folder and children folders.
 	* Identical to [Map.values()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/values).
 	* @param recursive Whether the iteration should be recursive
 	*/
	public values(recursive: true): IterableIterator<SchemaEntry>;
	/**
	 * Returns a new Iterator object that contains the values for each element contained in this folder.
	 * Identical to [Map.values()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/values).
	 * @param recursive Whether the iteration should be recursive
	 */
	public values(recursive?: false): IterableIterator<SchemaEntry | SchemaFolder>;
	public *values(recursive = false): IterableIterator<SchemaEntry | SchemaFolder> {
		if (recursive) {
			for (const value of super.values()) {
				if (value.isSchemaFolder()) yield* value.values(true);
				else yield value;
			}
		} else {
			yield* super.values();
		}
	}

	/**
	 * Returns a new Iterator object that contains the `[key, value]` pairs for each element contained in this folder and children folders.
	 * Identical to [Map.entries()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/entries).
	 * @param recursive Whether the iteration should be recursive
	 */
	public entries(recursive: true): IterableIterator<[string, SchemaEntry]>;
	/**
	 * Returns a new Iterator object that contains the `[key, value]` pairs for each element contained in this folder.
	 * Identical to [Map.entries()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/entries).
	 * @param recursive Whether the iteration should be recursive
	 */
	public entries(recursive?: false): IterableIterator<[string, SchemaEntry | SchemaFolder]>;
	public *entries(recursive = false): IterableIterator<[string, SchemaEntry | SchemaFolder]> {
		if (recursive) {
			for (const [key, value] of super.entries()) {
				if (value.isSchemaFolder()) yield* value.entries(true);
				else yield [key, value];
			}
		} else {
			yield* super.entries();
		}
	}

	/**
	 * The `JSON.stringify` behavior for this Schema.
	 */
	public toJSON(): SchemaJSON {
		return Object.fromEntries([...this.entries()].map(([key, value]): [string, SchemaFolderJSON | SchemaEntryJSON] => [key, value.toJSON()]));
	}

}

export interface SchemaAddCallback {
	(folder: SchemaFolder): unknown;
}
/* eslint-disable @typescript-eslint/no-empty-interface */
export interface SchemaFolderJSON extends Record<string, SchemaFolderJSON | SchemaEntryJSON> { }
export interface SchemaJSON extends Record<string, SchemaFolderJSON | SchemaEntryJSON> { }
/* eslint-enable @typescript-eslint/no-empty-interface */

import { SchemaFolder } from './SchemaFolder';
import { SchemaEntry, SchemaEntryOptions, SchemaEntryJSON } from './SchemaEntry';
