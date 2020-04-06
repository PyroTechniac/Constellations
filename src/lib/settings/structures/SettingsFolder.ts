import { GuildResolvable } from 'discord.js';
import { SerializerUpdateContext } from '../../structures/Serializer';
import { SchemaEntry } from '../schema/SchemaEntry';
import type { ReadonlyKeyedObject, KeyedObject } from '../../util/SharedTypes';
import { SchemaFolder } from '../schema/SchemaFolder';
import type { Settings } from './Settings';
import { Schema } from '../schema/Schema';
import type { ConstellationClient } from '../../Client';
import type { Language } from '../../structures/Language';
import { isThenable, makeObject, mergeObjects, arraysStrictEquals, isObject, objectToTuples, isFunction } from '../../util/Utils';

export class SettingsFolder extends Map<string, unknown> {

	/**
	 * The reference to the base Settings instance
	 */
	public base: Settings | null = null;

	/**
	 * The schema that manages this folder's structure
	 */
	public readonly schema: Schema;

	public constructor(schema: Schema) {
		super();
		this.schema = schema;
	}

	/**
	 * The client that manages this instance
	 */
	public get client(): ConstellationClient {
		if (this.base === null) throw new Error('Cannot retrieve gateway from a non-ready settings instance.');
		return this.base.gateway.client;
	}

	/**
	 * Get a value from the configuration. Accepts nested objects separating by dot.
	 * 
	 * ```typescript
	 * // Simple get
	 * const prefix = message.guild.settings.get('prefix');
	 * 
	 * // Nested entry
	 * const channel = message.guild.settings.get('channels.moderation-logs');
	 * ```
	 * @param path The path of the key's value to get from this instance
	 */
	public get(path: string): unknown {
		try {
			return path.split('.').reduce((folder, key): any => Map.prototype.get.call(folder, key), this);
		} catch {
			return undefined;
		}
	}

	/**
	 * Plucks out one or more attributes from either an object or a sequence of objects.
	 * 
	 * ```typescript
	 * const [x, y] = message.guild.settings.pluck('x', 'y');
	 * console.log(x, y);
	 * ```
	 * @param paths The paths to take
	 */
	public pluck(...paths: readonly string[]): unknown[] {
		return paths.map((path): unknown => {
			const value = this.get(path);
			return value instanceof SettingsFolder ? value.toJSON() : value;
		});
	}

	/**
	 * Resolves paths into their full objects or values depending on the current set value.
	 * @param paths The paths to resolve
	 */
	public resolve(...paths: readonly string[]): Promise<unknown[]> {
		if (this.base === null) return Promise.reject(new Error('Cannot retrieve guild from a non-ready settings instance.'));

		const guild = this.client.guilds.resolve(this.base.target as GuildResolvable);
		const language = guild?.language ?? this.client.languages.default!;
		return Promise.all(paths.map((path): unknown => {
			const entry = this.schema.get(path);
			if (typeof entry === 'undefined') return undefined;
			return entry.isSchemaFolder() ?
				this._resolveFolder({
					folder: entry,
					language,
					guild,
					extraContext: null
				}) :
				this._resolveEntry({
					entry,
					language,
					guild,
					extraContext: null
				});
		}));
	}

	/**
	 * Resets all keys from the settings folder.
	 * ```typescript
	 * // Resets all entries:
	 * await message.guild.settings.reset();
	 * ```
	 * 
	 * ```typescript
	 * // Resets all entries from a folder:
	 * await message.guild.settings.get('roles').reset();
	 * ```
	 */
	public async reset(): Promise<SettingsUpdateResults>;
	/**
	 * Resets a key from this settings folder.
	 * 
	 * ```typescript
	 * // Resets an entry:
	 * await message.guild.settings.reset('prefix');
	 * ```
	 * 
	 * ```typescript
	 * // Resets an entry contained by a folder:
	 * await message.guild.settings.reset('roles.administrator');
	 * ```
	 * 
	 * ```typescript
	 * // Resets an entry from a folder:
	 * await message.guild.settings.get('roles').reset('administrator');
	 * ```
	 * @param path The path of the key to reset from this settings folder
	 * @param options The options for this action
	 */
	public async reset(path: string, options?: Readonly<SettingsFolderResetOptions>): Promise<SettingsUpdateResults>;
	/**
	 * Resets multiple keys from this settings folder.
	 * 
	 * ```typescript
	 * // Resets an entry:
	 * await message.guild.settings.reset(['prefix']);
	 * ```
	 * 
	 * ```typescript
	 * // Resets multiple entries:
	 * await message.guild.settings.reset(['prefix', 'roles.administrator']);
	 * ```
	 * 
	 * ```typescript
	 * // Reset a key and an entire folder:
	 * await message.guild.settings.reset(['prefix', 'roles']);
	 * ```
	 * @param paths The paths of the keys to reset from this settings folder
	 * @param options The options for this action
	 */
	public async reset(paths: readonly string[], options?: Readonly<SettingsFolderResetOptions>): Promise<SettingsUpdateResults>;
	/**
	 * Resets multiple keys from this settings instance.
	 * 
	 * ```typescript
	 * // Resets an entry:
	 * await message.guild.settings.reset({ prefix: null });
	 * ```
	 * 
	 * ```typescript
	 * // Resets multiple entries with a regular object
	 * await message.guild.settings.reset({ prefix: null, roles: { administrator: null } });
	 * ```
	 * 
	 * ```typescript
	 * // Resets multiple entries with a dotted object:
	 * await message.guild.settings.reset({ prefix: null, 'roles.administrator': null });
	 * ```
	 * 
	 * ```typescript
	 * // Resets a key and an entire folder:
	 * await message.guild.settings.reset({ prefix: null, roles: null });
	 * ```
	 * @param object The object to retrieve the paths of the keys to reset from this settings folder
	 * @param options The options for this action
	 */
	public async reset(object: ReadonlyKeyedObject, options?: Readonly<SettingsFolderResetOptions>): Promise<SettingsUpdateResults>;
	public async reset(paths: string | ReadonlyKeyedObject | readonly string[] = [...this.keys()], options: Readonly<SettingsFolderResetOptions> = {}): Promise<SettingsUpdateResults> {
		if (this.base === null) {
			throw new Error('Cannot reset keys from a non-ready settings instance.');
		}

		if (this.base.existenceStatus === SettingsExistenceStatus.Unsynchronized) {
			throw new Error('Cannot reset keys from a pending to synchronize settings instance. Perhaps you want to call `sync()` first.');
		}

		if (this.base.existenceStatus === SettingsExistenceStatus.NotExists) {
			return [];
		}

		if (typeof paths === 'string') paths = [paths];
		else if (isObject(paths)) paths = objectToTuples(paths as Record<string, unknown>).map((entries): string => entries[0]);

		const { client, schema } = this;
		const onlyConfigurable = options.onlyConfigurable ?? false;
		const guild = client.guilds.resolve(options.guild ?? this.base.target as GuildResolvable);
		const language = guild?.language ?? client.languages.default!;
		const extra = options.extraContext;

		const changes: SettingsUpdateResult[] = [];
		for (const path of paths as readonly string[]) {
			const entry = schema.get(path);

			if (typeof entry === 'undefined') throw language.get('SETTING_GATEWAY_KEY_NOEXT', path);
			if (entry.isSchemaFolder()) this._resetSettingsFolder(changes, entry, language, onlyConfigurable);
			else this._resetSettingsEntry(changes, entry, language, onlyConfigurable);
		}

		if (changes.length !== 0) await this._save({ changes, guild, language, extraContext: extra });
		return changes;
	}

	/**
	 * Update a key from this settings folder.
	 * 
	 * ```typescript
	 * // Change the prefix to '$':
	 * await message.guild.settings.update('prefix', '$');
	 * ```
	 * 
	 * ```typescript
	 * // Add a new value to an array:
	 * await message.guild.settings.update('disabledCommands', 'ping', { arrayAction: 'add' });
	 * ```
	 * 
	 * ```typescript
	 * // Remove a value from an array of tuples ([[k1, v1], [k2, v2], ...])
	 * const tags: [string, string][] = message.guild.settings.get('tags');
	 * const index = tags.findIndex(([tag]): boolean => tag === 'foo');
	 * await message.guild.settings.update('tags', null, { arrayIndex: index });
	 * ```
	 * @param path The path of the key to update
	 * @param value The new value to validate and set
	 * @param options The options for this update
	 */
	public update(path: string, value: unknown, options?: SettingsFolderUpdateOptions): Promise<SettingsUpdateResults>;
	/**
	 * Update one or more keys from this settings folder.
	 * 
	 * ```typescript
	 * // Change the prefix to '$' and update disabledCommands adding/removing 'ping':
	 * await message.guild.settings.update([['prefix', '$'], ['disabledCommands', 'ping']]);
	 * ```
	 * 
	 * ```typescript
	 * // Add a new value to an array
	 * await message.guild.settings.update([['disabledCommands', 'ping']], { arrayAction: 'add' });
	 * ```
	 * 
	 * ```typescript
	 * // Remove a value from an array
	 * await message.guild.settings.update([['disabledCommands', 'ping']], { arrayAction: 'remove' });
	 * ```
	 * 
	 * ```typescript
	 * // Remove a value from an array of tuples ([[k1, v1], [k2, v2], ...])
	 * const tags: [string, string][] = message.guild.settings.get('tags');
	 * const index = tags.findIndex(([tag]): boolean => tag === 'foo');
	 * await message.guild.settings.update([['tags', null]], { arrayIndex: index });
	 * ```
	 * @param entries The key and value pairs to update
	 * @param options The options for this update
	 */
	public update(entries: [string, unknown][], options?: SettingsFolderUpdateOptions): Promise<SettingsUpdateResults>;
	/**
	 * Update one or more keys using an object approach.
	 * 
	 * ```typescript
	 * // Change the prefix to '$' and update disabledCommands adding/removing 'ping':
	 * await message.guild.settings.update({ disabledCommands: ['ping'], prefix: '$' });
	 * ```
	 * 
	 * ```typescript
	 * // Add a new value to an array
	 * await message.guild.settings.update({ disabledCommands: ['ping'] }, { arrayAction: 'add' });
	 * ```
	 * 
	 * ```typescript
	 * // Remove a value from an array
	 * await message.guild.settings.update({ disabledCommands: ['ping'] }, { arrayAction: 'remove' });
	 * ```
	 * 
	 * ```typescript
	 * // Remove a value from an array of tuples ([[k1, v1], [k2, v2], ...])
	 * const tags: [string, string][] = message.guild.settings.get('tags');
	 * const index = tags.findIndex(([tag]): boolean => tag === 'foo');
	 * await message.guild.settings.update({ tags: null }, { arrayIndex: index });
	 * ```
	 * @param entries An object to flatten and update
	 * @param options The options for this update
	 */
	public update(entries: ReadonlyKeyedObject, options?: SettingsFolderUpdateOptions): Promise<SettingsUpdateResults>;
	/**
	 * Update one key using a callback approach, if the returned value is a promise, it will be unwrapped before updating.
	 * 
	 * ```typescript
	 * await message.guild.settings.update<number>('commandUses', (value: number): number => value++);
	 * ```
	 * @param key The path of the key to update
	 * @param updateFn The function used to update the value
	 * @param options The options for this update
	 * @typeparam V The type of the value that should be updated
	 */
	public update<V>(key: string, updateFn: UpdateFn<V>, options?: SettingsFolderUpdateOptions): Promise<SettingsUpdateResults>;
	public async update<V>(pathOrEntries: PathOrEntries, valueOrOptions?: ValueOrOptionsOrCallback<V>, options?: SettingsFolderUpdateOptions): Promise<SettingsUpdateResults> {
		if (this.base === null) {
			throw new Error('Cannot update keys from a non-ready settings instance.');
		}

		if (this.base.existenceStatus === SettingsExistenceStatus.Unsynchronized) {
			throw new Error('Cannot update keys from a pending to synchronize settings instance. Perhaps you want to call `sync()` first.');
		}

		let entries: [string, unknown][];
		if (typeof pathOrEntries === 'string') {
			entries = [[pathOrEntries, valueOrOptions as unknown]];
			options = options ?? {};
		} else if (isObject(pathOrEntries)) {
			entries = objectToTuples(pathOrEntries as ReadonlyKeyedObject) as [string, unknown][];
			options = valueOrOptions as SettingsFolderUpdateOptions | undefined ?? {};

		} else if (isFunction(valueOrOptions)) {
			let value = valueOrOptions(this.get(pathOrEntries as string), pathOrEntries, this);
			if (isThenable(value)) value = (await value as Promise<V>);
			entries = [[pathOrEntries, value]];
			options = options ?? {};
		} else {
			entries = pathOrEntries as [string, unknown][];
			options = valueOrOptions as SettingsFolderUpdateOptions | undefined ?? {};
		}

		return this._processUpdate(entries, options as InternalRawFolderUpdateOptions);
	}

	/**
	 * Overrides `JSON.stringify` behavior for SettingsFolder.
	 */
	public toJSON(): SettingsFolderJSON {
		return Object.fromEntries([...super.entries()].map(([key, value]): [string, unknown] => [key, value instanceof SettingsFolder ? value.toJSON() : value]));
	}

	/**
	 * Patch an object against this instance.
	 * @param data The data to apply to this instance
	 */
	protected _patch(data: object): void {
		for (const [key, value] of Object.entries(data)) {
			const childValue = super.get(key);
			if (typeof childValue === 'undefined') continue;

			if (childValue instanceof SettingsFolder) childValue._patch(value);
			else super.set(key, value);
		}
	}

	/**
	 * Initializes a SettingsFolder, preparing it for later usage.
	 * @param folder The children folder of this instance
	 * @param schema The schema that manages this folder
	 */
	protected _init(folder: SettingsFolder, schema: Schema | SchemaFolder): void {
		folder.base = this.base;

		for (const [key, value] of schema.entries()) {
			if (value.isSchemaFolder()) {
				const settings = new SettingsFolder(value);
				folder.set(key, settings);
				this._init(settings, value);
			} else {
				folder.set(key, value.default);
			}
		}
	}

	/** @internal */
	protected async _save(context: SettingsUpdateContext): Promise<void> {
		const updateObject: KeyedObject = {};
		for (const change of context.changes) {
			mergeObjects(updateObject, makeObject(change.entry.path, change.next));
		}

		const base = this.base!;
		const { gateway, id } = base;

		if (gateway.provider === null) throw new Error('Cannot update due to the gateway missing a reference to the provider.');
		if (base.existenceStatus === SettingsExistenceStatus.Exists) {
			await gateway.provider.update(gateway.name, id, context.changes);
			this._patch(updateObject);
			gateway.client.emit('settingsUpdate', base, updateObject, context);
		} else {
			await gateway.provider.create(gateway.name, id, context.changes);
			base.existenceStatus = SettingsExistenceStatus.Exists;
			this._patch(updateObject);
			gateway.client.emit('settingsCreate', base, updateObject, context);
		}
	}

	/** @internal */
	private async _resolveFolder(context: InternalFolderUpdateContext): Promise<object> {
		const promises: Promise<[string, unknown]>[] = [];
		for (const entry of context.folder.values()) {
			if (entry.isSchemaFolder()) {
				promises.push(this._resolveFolder({
					folder: entry,
					language: context.language,
					guild: context.guild,
					extraContext: context.extraContext
				}).then((value): [string, object] => [entry.key, value]))
			} else {
				promises.push(this._resolveEntry({
					entry,
					language: context.language,
					guild: context.guild,
					extraContext: context.extraContext
				}).then((value): [string, unknown] => [entry.key, value]));
			}
		}

		return Object.fromEntries(await Promise.all(promises));
	}

	/** @internal */
	private async _resolveEntry(context: SerializerUpdateContext): Promise<unknown> {
		const values = this.get(context.entry.path);
		if (typeof values === 'undefined') return undefined;

		if (!context.entry.shouldResolve) return values;

		const { serializer } = context.entry;
		if (serializer === null) throw new Error('The serializer was not available during the resolve.');
		if (context.entry.array) {
			return (await Promise.all((values as readonly unknown[])
				.map((value): unknown => serializer.resolve(value, context))))
				.filter((value): boolean => value !== null);
		}

		return serializer.resolve(values, context);
	}

	/** @internal */
	private _resetSettingsFolder(changes: SettingsUpdateResult[], schemaFolder: SchemaFolder, language: Language, onlyConfigurable: boolean): void {
		let nonConfigurable = 0;
		let skipped = 0;
		let processed = 0;

		for (const entry of schemaFolder.values(true)) {
			if (onlyConfigurable && !entry.configurable) {
				++nonConfigurable;
				continue;
			}

			const previous = this.base!.get(entry.path);
			const next = entry.default;
			const equals = entry.array ?
				arraysStrictEquals(previous as unknown as readonly unknown[], next as readonly unknown[]) :
				previous === entry.default;

			if (equals) {
				++skipped;
			} else {
				++processed;
				changes.push({
					previous,
					next,
					entry
				});
			}
		}

		if (processed === 0 && skipped === 0 && nonConfigurable === 0) throw language.get('SETTING_GATEWAY_UNCONFIGURABLE_FOLDER')
	}

	/** @internal */
	private _resetSettingsEntry(changes: SettingsUpdateResult[], schemaEntry: SchemaEntry, language: Language, onlyConfigurable: boolean): void {
		if (onlyConfigurable && !schemaEntry.configurable) {
			throw language.get('SETTING_GATEWAY_UNCONFIGURABLE_KEY', schemaEntry.key);
		}

		const previous = this.base!.get(schemaEntry.path);
		const next = schemaEntry.default;

		const equals = schemaEntry.array ?
			arraysStrictEquals(previous as unknown as readonly unknown[], next as unknown as readonly unknown[]) :
			previous === next;

		if (!equals) {
			changes.push({
				previous,
				next,
				entry: schemaEntry
			});
		}
	}

	/** @internal */
	private async _processUpdate(entries: [string, unknown][], options: InternalRawFolderUpdateOptions): Promise<SettingsUpdateResults> {
		const { client, schema } = this;
		const onlyConfigurable = options.onlyConfigurable ?? false;
		const arrayAction = options.arrayAction as ArrayActions ?? ArrayActions.Auto;
		const arrayIndex = options.arrayIndex ?? null;
		const guild = client.guilds.resolve(options.guild ?? this.base!.target as GuildResolvable);
		const language = guild?.language ?? client.languages.default!;
		const extra = options.extraContext;
		const internalOptions: InternalSettingsFolderUpdateOptions = { arrayAction, arrayIndex, onlyConfigurable };

		const promises: Promise<SettingsUpdateResult>[] = [];
		for (const [path, value] of entries) {
			const entry = schema.get(path);

			if (typeof entry === 'undefined') throw language.get('SETTING_GATEWAY_KEY_NOEXIST', path);
			if (entry.isSchemaFolder()) {
				const keys = onlyConfigurable ?
					[...entry.values()].filter((val): boolean => val.isSchemaEntry() && val.configurable).map((val): string => val.key) :
					[...entry.keys()];
				throw keys.length > 0 ?
					language.get('SETTING_GATEWAY_CHOOSE_KEY', keys) :
					language.get('SETTING_GATEWAY_UNCONFIGURABLE_FOLDER');
			} else if (!entry.configurable && onlyConfigurable) {
				throw language.get('SETTING_GATEWAY_UNCONFIGURABLE_KEY', path);
			}

			promises.push(this._updateSettingsEntry(path, value, { entry, language, guild, extraContext: extra }, internalOptions));
		}

		const changes = await Promise.all(promises);
		if (changes.length !== 0) await this._save({ changes, guild, language, extraContext: extra });
		return changes;
	}

	/** @internal */
	private async _updateSettingsEntry(key: string, rawValue: unknown, context: SerializerUpdateContext, options: InternalSettingsFolderUpdateOptions): Promise<SettingsUpdateResult> {
		const previous = this.get(key);

		if (rawValue === null || typeof rawValue === 'undefined') {
			return { previous, next: context.entry.default, entry: context.entry };
		}

		if (!context.entry.array) {
			const values = await this._updateSchemaEntryValue(rawValue, context, true);
			return { previous, next: this._resolveNextValue(values, context), entry: context.entry };
		}

		if (options.arrayAction === ArrayActions.Overwrite) {
			return { previous, next: this._resolveNextValue(await this._resolveValues(rawValue, context, true), context), entry: context.entry }
		}

		const next = options.arrayIndex === null ?
			this._updateSettingsEntryNotIndexed(previous as unknown[], await this._resolveValues(rawValue, context, false), context, options) :
			this._updateSettingsEntryAtIndex(previous as unknown[], await this._resolveValues(rawValue, context, options.arrayAction === ArrayActions.Remove), options.arrayIndex, options.arrayAction);

		return {
			previous,
			next,
			entry: context.entry
		};
	}

	/** @internal */
	private _updateSettingsEntryNotIndexed(previous: readonly unknown[], values: readonly unknown[], context: SerializerUpdateContext, options: InternalSettingsFolderUpdateOptions): unknown[] {
		const clone = previous.slice(0);
		const { serializer } = context.entry;
		if (options.arrayAction === ArrayActions.Auto) {
			for (const value of values) {
				const index = clone.indexOf(value);
				if (index === -1) clone.push(value);
				else clone.splice(index, 1);
			}
		} else if (options.arrayAction === ArrayActions.Add) {
			for (const value of values) {
				if (clone.includes(value)) throw new Error(context.language.get('SETTING_GATEWAY_DUPLICATE_VALUE', context.entry, serializer!.stringify(value, context.guild)));
				clone.push(value);
			}
		} else if (options.arrayAction === ArrayActions.Remove) {
			for (const value of values) {
				const index = clone.indexOf(value);
				if (index === -1) throw new Error(context.language.get('SETTING_GATEWAY_MISSING_VALUE', context.entry, serializer!.stringify(value, context.guild)));
				clone.splice(index, 1);
			}
		} else {
			throw new TypeError(`The ${options.arrayAction} array action is not a valid array action.`);
		}

		return clone;
	}

	/** @internal */
	private _updateSettingsEntryAtIndex(previous: readonly unknown[], values: readonly unknown[], arrayIndex: number, arrayAction: ArrayActions | null): unknown[] {
		if (arrayIndex < 0 || arrayIndex > previous.length) {
			throw new RangeError(`The index ${arrayIndex} is bigger than the current array. It must be a value in the range of 0..${previous.length}.`);
		}

		let clone = previous.slice();
		if (arrayAction === ArrayActions.Add) {
			clone.splice(arrayIndex, 0, ...values);
		} else if (arrayAction === ArrayActions.Remove || values.every((nv): boolean => nv === null)) {
			clone.splice(arrayIndex, values.length);
		} else {
			clone.splice(arrayIndex, values.length, ...values);
			clone = clone.filter((nv): boolean => nv !== null);
		}

		return clone;
	}

	/** @internal */
	private async _resolveValues(value: unknown, context: SerializerUpdateContext, acceptNull: boolean): Promise<unknown[]> {
		return Array.isArray(value) ?
			await Promise.all(value.map((val): Promise<unknown> => this._updateSchemaEntryValue(val, context, acceptNull))) :
			[await this._updateSchemaEntryValue(value, context, acceptNull)];
	}

	/** @internal */
	private _resolveNextValue(value: unknown, context: SerializerUpdateContext): unknown {
		if (Array.isArray(value)) {
			const filtered = value.filter((nv): boolean => nv !== null);
			return filtered.length === 0 ? context.entry.default : filtered;
		}

		return value === null ? context.entry.default : value;
	}

	/** @internal */
	private async _updateSchemaEntryValue(value: unknown, context: SerializerUpdateContext, acceptNull: boolean): Promise<unknown> {
		if (acceptNull && value === null) return null;

		const { serializer } = context.entry;

		if (serializer === null) throw new TypeError('The serializer was not available during the update.');
		const parsed = await serializer.validate(value, context);

		if (context.entry.filter !== null && context.entry.filter(this.client, parsed, context)) throw context.language.get('SETTING_GATEWAY_INVALID_FILTERED_VALUE', context.entry, value);
		return serializer.serialize(parsed);
	}
}

/**
 * The existence status of this settings entry. They're the possible values for {@link Settings.existenceStatus Settings#existenceStatus} and
 * represents its status in disk.
 */
export enum SettingsExistenceStatus {
	/**
	 * The settings have not been synchronized, in this status, any update operations will error. To prevent this, call
	 * {@linkcode Settings.sync settings.sync()} first.
	 */
	Unsynchronized,
	/**
	 * The settings entry exists in disk, any disk operation will be done through an update.
	 */
	Exists,
	/**
	 * The settings entry does not exist in disk, the first disk operation will be done through a create. Afterwards it
	 * sets itself to {@link SettingsExistenceStatus.Exists}
	 */
	NotExists
}

export interface SettingsFolderResetOptions {
	onlyConfigurable?: boolean;
	guild?: GuildResolvable;
	extraContext?: unknown;
}

export interface SettingsFolderUpdateOptionsOverwrite extends SettingsFolderResetOptions {
	arrayAction: ArrayActions.Overwrite | 'overwrite';
}

export interface SettingsFolderUpdateOptionsNonOverwrite extends SettingsFolderResetOptions {
	arrayAction?: Exclude<ArrayActions, ArrayActions.Overwrite> | Exclude<ArrayActionsString, 'overwrite'>;
	arrayIndex?: number | null;
}

export type SettingsFolderUpdateOptions = SettingsFolderUpdateOptionsOverwrite | SettingsFolderUpdateOptionsNonOverwrite;

export interface SettingsUpdateContext extends Omit<SerializerUpdateContext, 'entry'> {
	readonly changes: SettingsUpdateResults;
}

export interface SettingsUpdateResult {
	readonly previous: unknown;
	readonly next: unknown;
	readonly entry: SchemaEntry;
}

export type SettingsUpdateResults = readonly SettingsUpdateResult[];

export type SettingsFolderJSON = Record<string, unknown>;

export enum ArrayActions {
	Add = 'add',
	Remove = 'remove',
	Auto = 'auto',
	Overwrite = 'overwrite'
}

export type ArrayActionsString = 'add' | 'remove' | 'auto' | 'overwrite';

interface InternalFolderUpdateContext extends Omit<SerializerUpdateContext, 'entry'> {
	readonly folder: SchemaFolder;
}

interface InternalSettingsFolderUpdateOptions {
	readonly onlyConfigurable: boolean;
	readonly arrayAction: ArrayActions;
	readonly arrayIndex: number | null;
}

/**
 * The values {@link SettingsFolder#reset} and {@link SettingsFolder#update} accept.
 */
type PathOrEntries = string | [string, unknown][] | ReadonlyKeyedObject;

/**
 * The possible values or the options passed.
 */
type ValueOrOptionsOrCallback<V> = unknown | SettingsFolderUpdateOptions | UpdateFn<V>;

/**
 * A function used to update a value.
 */
type UpdateFn<V> = (value: V, key: string, settingsFolder: SettingsFolder) => V | Promise<V>;

/** @internal */
type InternalRawFolderUpdateOptions = SettingsFolderUpdateOptions & SettingsFolderUpdateOptionsNonOverwrite;
