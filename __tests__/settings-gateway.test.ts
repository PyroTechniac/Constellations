import Collection from '@discordjs/collection';
import { Gateway, GatewayDriver, GatewayStorage, Provider, ProviderStore, RequestHandler, Schema, SchemaEntry, SchemaFolder, Settings, SettingsExistenceStatus, SettingsFolder, Serializer } from '../src';
import { client } from '../__mocks__/MockClient';
import { once } from 'events';

beforeEach((): void => {
	client.reset();
})

afterAll((): void => {
	client
		.removeAllListeners()
		.destroy();
});

describe('gateway', (): void => {
	test('properties', (): void => {
		const gateway = new Gateway(client, 'test', { provider: 'Mock' });

		expect(gateway).toBeInstanceOf(GatewayStorage);
		expect(gateway.cache).toBeInstanceOf(Collection);
		expect(gateway.cache.size).toBe(0);

		expect(gateway.requestHandler).toBeInstanceOf(RequestHandler);
		expect(gateway.requestHandler.available).toBe(true);
	});

	test('reverse-proxy-sync', (): void => {
		const gateway = new Gateway(client, 'users', { provider: 'Mock' });

		expect(gateway.cache).toBeInstanceOf(Collection);
		expect(gateway.cache.size).toBe(0);
	});

	test('get', (): void => {
		const gateway = new Gateway(client, 'test', { provider: 'Mock' });
		expect(gateway.get('id')).toBeNull();
	});

	test('create', (): void => {
		const gateway = new Gateway(client, 'test', { provider: 'Mock' });

		const created = gateway.create({ id: 'id' });
		expect(created).toBeInstanceOf(Settings);
		expect(created.id).toBe('id');
	});

	test('acquire', (): void => {
		const gateway = new Gateway(client, 'test', { provider: 'Mock' });

		const acquired = gateway.acquire({ id: 'id' });
		expect(acquired).toBeInstanceOf(Settings);
		expect(acquired.id).toBe('id');
	});

	test('init-table-existence', async (): Promise<void> => {
		expect.assertions(2);
		const gateway = new Gateway(client, 'test', { provider: 'Mock' });
		const provider = gateway.provider!;

		await expect(provider.hasTable(gateway.name)).resolves.toBe(false);

		await gateway.init();
		return expect(provider.hasTable(gateway.name)).resolves.toBe(true);
	});

	test('direct-sync-no-provider', (): Promise<void> => {
		client.providers.clear();

		const gateway = client.gateways.get('users') as Gateway;
		expect(gateway.provider).toBeNull();

		const settings = new Settings(gateway, { id: 'Mock' }, 'Mock');
		return expect(settings.sync()).rejects.toThrow('Cannot run requests without a provider available.');
	});

	test('multiple-direct-sync-no-provider', (): Promise<void> => {
		client.providers.clear();

		const gateway = client.gateways.get('users') as Gateway;
		expect(gateway.provider).toBeNull();

		const settings = [
			new Settings(gateway, { id: 'Mock1' }, 'Mock1'),
			new Settings(gateway, { id: 'Mock2' }, 'Mock2'),
			new Settings(gateway, { id: 'Mock3' }, 'Mock3')
		];

		return expect(Promise.all(settings.map((setting): Promise<Settings> => setting.sync())))
			.rejects
			.toThrow('Cannot run requests without a provider available.');
	});

	test('reverse-proxy-sync-with-data', (): void => {
		const gateway = client.gateways.get('users') as Gateway;

		client.users.add({
			id: '339942739275677727',
			username: 'Dirigeants',
			avatar: null,
			discriminator: '0000'
		}, true);

		const retrieved = gateway.get('339942739275677727')!;
		expect(retrieved).toBeInstanceOf(Settings);
		expect(retrieved.id).toBe('339942739275677727');
	});

	test('multiple-reverse-proxy-sync-with-data', async (): Promise<void> => {
		expect.assertions(6);
		const gateway = client.gateways.get('users') as Gateway;
		const provider = gateway.provider!;
		gateway.schema.add('value', 'String');

		await provider.createTable('users');
		await Promise.all([
			provider.create('users', 'foo', { value: 'bar' }),
			provider.create('users', 'hello', { value: 'world' })
		]);

		const user1 = client.users.add({ id: 'foo', username: 'Dirigeants', avatar: null, discriminator: '0000' }, true);
		const user2 = client.users.add({ id: 'hello', username: 'Dirigeants', avatar: null, discriminator: '0001' }, true);
		const user3 = client.users.add({ id: 'bar', username: 'Dirigeants', avatar: null, discriminator: '0002' }, true);

		const settings1 = user1.settings;
		const settings2 = user2.settings;
		const settings3 = user3.settings;

		expect(settings1.existenceStatus).toBe(SettingsExistenceStatus.Unsynchronized);
		expect(settings2.existenceStatus).toBe(SettingsExistenceStatus.Unsynchronized);
		expect(settings3.existenceStatus).toBe(SettingsExistenceStatus.Unsynchronized);

		await gateway.sync();

		expect(settings1.existenceStatus).toBe(SettingsExistenceStatus.Exists);
		expect(settings2.existenceStatus).toBe(SettingsExistenceStatus.Exists);
		expect(settings3.existenceStatus).toBe(SettingsExistenceStatus.NotExists);
	});
});

describe('gateway-driver', (): void => {
	test('properties', (): void => {
		const gatewayDriver = new GatewayDriver(client);
		expect(gatewayDriver).toBeInstanceOf(Collection);
		expect(gatewayDriver.client).toBe(client);

		expect(gatewayDriver.size).toBe(0);
	});

	test('properties-from-client', (): void => {
		expect(client.gateways).toBeInstanceOf(Collection);
		expect(client.gateways.client).toBe(client);

		expect(client.gateways.size).toBe(3);
		expect(client.gateways.get('clientStorage')).toBeInstanceOf(Gateway);
		expect(client.gateways.get('users')).toBeInstanceOf(Gateway);
		expect(client.gateways.get('guilds')).toBeInstanceOf(Gateway);
	});

	test('register', (): void => {
		const gateway = new Gateway(client, 'someCustomGateway');
		expect(client.gateways.register(gateway)).toBe(client.gateways);
		expect(client.gateways.get('someCustomGateway')).toBe(gateway);
	});

	test('init', async (): Promise<void> => {
		expect.assertions(7);

		expect(client.gateways.get('guilds')!.ready).toBe(false);
		expect(client.gateways.get('users')!.ready).toBe(false);
		expect(client.gateways.get('clientStorage')!.ready).toBe(false);

		await expect(client.gateways.init()).resolves.toBeUndefined();

		expect(client.gateways.get('guilds')!.ready).toBe(true);
		expect(client.gateways.get('users')!.ready).toBe(true);
		expect(client.gateways.get('clientStorage')!.ready).toBe(true);
	});

	test('toJSON', (): void => {
		expect(client.gateways.toJSON()).toStrictEqual({
			guilds: {
				name: 'guilds',
				provider: 'Mock',
				schema: {}
			},
			users: {
				name: 'users',
				provider: 'Mock',
				schema: {}
			},
			clientStorage: {
				name: 'clientStorage',
				provider: 'Mock',
				schema: {}
			}
		})
	});
});

describe('gateway-storage', (): void => {
	let schema: Schema;
	beforeEach((): void => {
		schema = new Schema();
	});

	test('properties', (): void => {
		const gateway = new GatewayStorage(client, 'MockGateway', { provider: 'Mock' });
		expect(gateway.client).toBe(client);
		expect(gateway.name).toBe('MockGateway');
		expect(gateway.provider).toBe(client.providers.get('Mock')!);
		expect(gateway.ready).toBe(false);

		expect(gateway.schema).toBeInstanceOf(Schema);
		expect(gateway.schema.size).toBe(0);
		expect(gateway.schema.path).toBe('');
		expect(gateway.schema.type).toBe('Folder');
		expect(gateway.toJSON()).toStrictEqual({
			name: 'MockGateway',
			provider: 'Mock',
			schema: {}
		});
	});

	test('schema', (): void => {
		const gateway = new GatewayStorage(client, 'MockGateway', { schema });

		expect(gateway.schema).toBe(schema);
	});

	test('init', async (): Promise<void> => {
		expect.assertions(7);

		const gateway = new GatewayStorage(client, 'MockGateway', { schema, provider: 'Mock' });
		const provider = gateway.provider!;

		expect(gateway.ready).toBe(false);
		expect(gateway.schema.ready).toBe(false);
		await expect(provider.hasTable(gateway.name)).resolves.toBe(false);

		await expect(gateway.init()).resolves.toBeUndefined();

		expect(gateway.ready).toBe(true);
		expect(gateway.schema.ready).toBe(true);
		return expect(provider.hasTable(gateway.name)).resolves.toBe(true);
	});

	test('init-no-provider', (): Promise<void> => {
		expect.assertions(2);

		const gateway = new GatewayStorage(client, 'MockGateway', { schema, provider: 'Mock' });
		client.providers.clear();

		expect(gateway.provider).toBeNull();

		return expect(gateway.init()).rejects.toThrow('The gateway "MockGateway" could not find the provider "Mock".');
	});

	test('init-ready', async (): Promise<void> => {
		const gateway = new GatewayStorage(client, 'MockGateway', { schema, provider: 'Mock' });
		await gateway.init();
		return expect(gateway.init()).rejects.toThrow('The gateway "MockGateway" has already been initialized.');
	});

	test('init-broken-schema', (): Promise<void> => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore
		schema.add('key', 'String', { array: null });

		const gateway = new GatewayStorage(client, 'MockGateway', { schema, provider: 'Mock' });

		return expect(gateway.init()).rejects.toThrow([
			'[SCHEMA] There is an error with your schema.',
			"[KEY] key - Parameter 'array' must be a boolean."
		].join('\n'));
	});

	test('sync', (): Promise<void> => {
		const gateway = new GatewayStorage(client, 'MockGateway', { schema, provider: 'Mock' });
		return expect(gateway.sync()).resolves.toBe(gateway);
	});
});

describe('provider-store', (): void => {
	test('properties', (): void => {
		const { providers } = client;

		expect(providers).toBeInstanceOf(ProviderStore);
		expect(providers.client).toBe(client);
		expect(providers.holds).toBe(Provider);
		expect(providers.name).toBe('providers');

		expect(providers.size).toBe(1);
		expect(providers.has('Mock')).toBe(true);
	});

	test('default', (): void => {
		const { providers } = client;

		client.options.providers.default = 'Mock';
		expect(providers.default).toBe(providers.get('Mock'));
		providers.clear();
		expect(providers.default).toBeNull();
	});

	test('clear', (): void => {
		const { providers } = client;

		expect(providers.size).toBe(1);
		providers.clear();
		expect(providers.size).toBe(0);
	});

	test('delete-from-name', (): void => {
		const { providers } = client;

		expect(providers.delete('Mock')).toBe(true);
		expect(providers.size).toBe(0);
	});

	test('delete-from-instance', (): void => {
		const { providers } = client;

		expect(providers.delete(providers.get('Mock')!)).toBe(true);
		expect(providers.size).toBe(0);
	});

	test('delete-invalid', (): void => {
		const { providers } = client;

		expect(providers.delete('DoesNotExist')).toBe(false);
		expect(providers.size).toBe(1);
	});
});

describe('schema', (): void => {
	test('properties', (): void => {
		const schema = new Schema();

		expect(schema.path).toBe('');
		expect(schema.type).toBe('Folder');
		expect(schema.isSchemaFolder()).toBe(true);

		expect(schema).toBeInstanceOf(Map);
		expect(schema.size).toBe(0);

		expect(schema.defaults).toBeInstanceOf(SettingsFolder);
		expect(schema.defaults.size).toBe(0);

		expect(schema.toJSON()).toStrictEqual({});

		expect([...schema.keys()]).toStrictEqual([]);
		expect([...schema.keys(true)]).toStrictEqual([]);
		expect([...schema.values()]).toStrictEqual([]);
		expect([...schema.values(true)]).toStrictEqual([]);
		expect([...schema.entries()]).toStrictEqual([]);
		expect([...schema.entries(true)]).toStrictEqual([]);
		expect(schema).toMatchSnapshot();
	});

	test('add', (): void => {
		const schema = new Schema();
		expect(schema.add('test', 'String')).toBe(schema);

		expect(schema).toBeInstanceOf(Schema);
		expect(schema.path).toBe('');
		expect(schema.type).toBe('Folder');
		expect(schema.isSchemaFolder()).toBe(true);

		expect(schema.defaults.size).toBe(1);
		const settingEntry = schema.defaults.get('test');
		expect(settingEntry).toBeNull();

		expect(schema.size).toBe(1);
		const schemaEntry = schema.get('test') as SchemaEntry;
		expect(schemaEntry).toBeInstanceOf(SchemaEntry);

		expect(schemaEntry.key).toBe('test');
		expect(schemaEntry.parent).toBe(schema);
		expect(schemaEntry.path).toBe('test');
		expect(schemaEntry.type).toBe('string');
		expect(schemaEntry.toJSON()).toStrictEqual({
			array: false,
			configurable: true,
			default: null,
			inclusive: false,
			maximum: null,
			minimum: null,
			resolve: true,
			type: 'string'
		});

		expect(schema.toJSON()).toStrictEqual({
			test: {
				array: false,
				configurable: true,
				default: null,
				inclusive: false,
				maximum: null,
				minimum: null,
				resolve: true,
				type: 'string'
			}
		});

		expect([...schema.keys()]).toStrictEqual(['test']);
		expect([...schema.keys(true)]).toStrictEqual(['test']);
		expect([...schema.values()]).toStrictEqual([schemaEntry]);
		expect([...schema.values(true)]).toStrictEqual([schemaEntry]);
		expect([...schema.entries()]).toStrictEqual([['test', schemaEntry]]);
		expect([...schema.entries(true)]).toStrictEqual([['test', schemaEntry]]);

		expect(schema).toMatchSnapshot();
	});

	test('add-edit-entry-to-entry', (): void => {
		const schema = new Schema().add('subkey', 'String');
		expect(schema.defaults.get('subkey')).toBeNull();
		expect((schema.get('subkey') as SchemaEntry).default).toBeNull();

		expect(schema.add('subkey', 'String', { default: 'Hello' })).toBe(schema);
		expect(schema.defaults.get('subkey')).toBe('Hello');
		expect((schema.get('subkey') as SchemaEntry).default).toBe('Hello');
		expect(schema).toMatchSnapshot();
	});

	test('add-edit-entry-to-folder', (): void => {
		const schema = new Schema().add('subkey', 'String');
		expect((): Schema => schema.add('subkey', (folder): SchemaFolder => folder)).toThrow('The type for "subkey" conflicts with the previous value, expected type "Folder", got "string".');
	});

	test('add-edit-folder-to-folder', (): void => {
		const schema = new Schema().add('subkey', (folder): SchemaFolder => folder.add('nested', 'String'));

		expect(schema.add('subkey', (folder): SchemaFolder => folder.add('another', 'Number'))).toBe(schema);
		expect(schema.size).toBe(1);

		const inner = schema.get('subkey') as SchemaFolder;
		expect(inner.size).toBe(2);
		expect(inner.get('nested')).toBeTruthy();
		expect(inner.get('another')).toBeTruthy();
		expect(schema).toMatchSnapshot();
	});

	test('add-ready', (): void => {
		const schema = new Schema();
		schema.ready = true;

		expect((): Schema => schema.add('subkey', 'String')).toThrow('Cannot modify the schema after being initialized.');
	});

	test('get-entry', (): void => {
		const schema = new Schema().add('subkey', 'String');
		expect(schema.get('subkey')).toBeInstanceOf(SchemaEntry);
	});

	test('get-folder', (): void => {
		const schema = new Schema().add('subkey', (folder): SchemaFolder => folder.add('nested', 'String'));
		expect(schema.get('subkey')).toBeInstanceOf(SchemaFolder);
	});

	test('get-folder-nested', (): void => {
		const schema = new Schema().add('subkey', (folder): SchemaFolder => folder.add('nested', 'String'));
		expect(schema.get('subkey.nested')).toBeInstanceOf(SchemaEntry);
	});

	test('get-folder-double-nested', (): void => {
		const schema = new Schema().add('subkey', (folder): SchemaFolder => folder
			.add('nested', (subfolder): SchemaFolder => subfolder
				.add('double', 'String')));
		expect(schema.get('subkey.nested.double')).toBeInstanceOf(SchemaEntry);
		expect(schema).toMatchSnapshot();
	});

	test('get-folder-from-entry', (): void => {
		const schema = new Schema().add('key', 'String');
		expect(schema.get('key.non.existent.path')).toBeUndefined();
	});

	test('folder-empty', (): void => {
		const schema = new Schema()
			.add('test', (): void => {
				// noop
			});

		expect(schema).toBeInstanceOf(Schema);
		expect(schema.path).toBe('');
		expect(schema.type).toBe('Folder');
		expect(schema.isSchemaFolder()).toBe(true);

		expect(schema.defaults.size).toBe(1);
		const settingsFolder = schema.defaults.get('test') as SettingsFolder;
		expect(settingsFolder).toBeInstanceOf(SettingsFolder);
		expect(settingsFolder.size).toBe(0);

		expect(schema.size).toBe(1);
		const schemaFolder = schema.get('test') as SchemaFolder;
		expect(schemaFolder).toBeInstanceOf(SchemaFolder);
		expect(schemaFolder.size).toBe(0);
		expect(schemaFolder.key).toBe('test');
		expect(schemaFolder.parent).toBe(schema);
		expect(schemaFolder.path).toBe('test');
		expect(schemaFolder.type).toBe('Folder');
		expect(schemaFolder.isSchemaFolder()).toBe(true);
		expect(schemaFolder.defaults).toBeInstanceOf(SettingsFolder);
		expect(schemaFolder.defaults.size).toBe(0);

		expect(schema.toJSON()).toStrictEqual({
			test: {}
		});

		expect([...schema.keys()]).toStrictEqual(['test']);
		expect([...schema.keys(true)]).toStrictEqual([]);
		expect([...schema.values()]).toStrictEqual([schemaFolder]);
		expect([...schema.values(true)]).toStrictEqual([]);
		expect([...schema.entries()]).toStrictEqual([['test', schemaFolder]]);
		expect([...schema.entries(true)]).toStrictEqual([]);

		expect(schema).toMatchSnapshot();
	});

	test('folder-filled', (): void => {
		const schema = new Schema()
			.add('someFolder', (folder): SchemaFolder => folder
				.add('someKey', 'TextChannel'));
		expect(schema.defaults.size).toBe(1);
		const settingsFolder = schema.defaults.get('someFolder') as SettingsFolder;
		expect(settingsFolder).toBeInstanceOf(SettingsFolder);
		expect(settingsFolder.size).toBe(1);
		expect(settingsFolder.get('someKey')).toBeNull();
		expect(schema.defaults.get('someFolder.someKey')).toBeNull();

		expect(schema.size).toBe(1);
		const schemaFolder = schema.get('someFolder') as SchemaFolder;
		expect(schemaFolder).toBeInstanceOf(SchemaFolder);
		expect(schemaFolder.size).toBe(1);
		expect(schemaFolder.key).toBe('someFolder');
		expect(schemaFolder.parent).toBe(schema);
		expect(schemaFolder.path).toBe('someFolder');
		expect(schemaFolder.type).toBe('Folder');
		expect(schemaFolder.isSchemaFolder()).toBe(true);
		expect(schemaFolder.isSchemaEntry()).toBe(false);
		expect(schemaFolder.defaults).toBeInstanceOf(SettingsFolder);
		expect(schemaFolder.defaults.size).toBe(1);

		const innerSettingsFolder = schemaFolder.defaults.get('someKey');
		expect(innerSettingsFolder).toBeNull();

		const schemaEntry = schemaFolder.get('someKey') as SchemaEntry;
		expect(schemaEntry).toBeInstanceOf(SchemaEntry);
		expect(schemaEntry.key).toBe('someKey');
		expect(schemaEntry.parent).toBe(schemaFolder);
		expect(schemaEntry.path).toBe('someFolder.someKey');
		expect(schemaEntry.type).toBe('textchannel');
		expect(schemaEntry.isSchemaEntry()).toBe(true);
		expect(schemaEntry.isSchemaFolder()).toBe(false);
		expect(schemaEntry.toJSON()).toStrictEqual({
			array: false,
			configurable: true,
			default: null,
			inclusive: false,
			maximum: null,
			minimum: null,
			resolve: true,
			type: 'textchannel'
		});

		expect(schema.get('someFolder.someKey')).toBe(schemaFolder.get('someKey'));
		expect(schema.toJSON()).toStrictEqual({
			someFolder: {
				someKey: {
					array: false,
					configurable: true,
					default: null,
					inclusive: false,
					maximum: null,
					minimum: null,
					resolve: true,
					type: 'textchannel'
				}
			}
		});

		expect([...schema.keys()]).toStrictEqual(['someFolder']);
		expect([...schema.keys(true)]).toStrictEqual(['someKey']);
		expect([...schema.values()]).toStrictEqual([schemaFolder]);
		expect([...schema.values(true)]).toStrictEqual([schemaEntry]);
		expect([...schema.entries()]).toStrictEqual([['someFolder', schemaFolder]]);
		expect([...schema.entries(true)]).toStrictEqual([['someKey', schemaEntry]]);

		expect(schema).toMatchSnapshot();
	});

	test('delete', (): void => {
		const schema = new Schema().add('subkey', 'String');
		expect(schema.defaults.get('subkey')).toBeNull();

		expect(schema.delete('subkey')).toBe(true);
		expect(schema.defaults.get('subkey')).toBeUndefined();
	});

	test('delete-not-exists', (): void => {
		const schema = new Schema();
		expect(schema.delete('subkey')).toBe(false);
	});

	test('delete-ready', (): void => {
		const schema = new Schema();
		schema.ready = true;

		expect((): boolean => schema.delete('subkey')).toThrow('Cannot modify the schema after being initialized.');
	});
});

describe('schema-entry', (): void => {
	test('properties', (): void => {
		const schema = new Schema();
		const schemaEntry = new SchemaEntry(schema, 'test', 'textchannel');

		expect(schemaEntry.client).toBeNull();
		expect(schemaEntry.path).toBe('test');
		expect(schemaEntry.type).toBe('textchannel');
		expect(schemaEntry.parent).toBe(schema);
		expect(schemaEntry.array).toBe(false);
		expect(schemaEntry.configurable).toBe(true);
		expect(schemaEntry.default).toBeNull();
		expect(schemaEntry.filter).toBeNull();
		expect(schemaEntry.inclusive).toBe(false);
		expect(schemaEntry.maximum).toBeNull();
		expect(schemaEntry.minimum).toBeNull();
		expect(schemaEntry.shouldResolve).toBe(true);
		expect((): Serializer | null => schemaEntry.serializer).toThrow(Error);
		expect(schemaEntry.toJSON()).toStrictEqual({
			array: false,
			configurable: true,
			default: null,
			inclusive: false,
			maximum: null,
			minimum: null,
			resolve: true,
			type: 'textchannel'
		});

		expect(schemaEntry).toMatchSnapshot();
	});

	test('edit', (): void => {
		const schema = new Schema();
		const schemaEntry = new SchemaEntry(schema, 'test', 'textchannel', {
			array: false,
			configurable: false,
			default: 1,
			filter: (): boolean => true,
			inclusive: false,
			maximum: 100,
			minimum: 98,
			resolve: false
		});

		schemaEntry.edit({
			type: 'guild',
			array: true,
			configurable: true,
			default: [1],
			filter: null,
			inclusive: true,
			maximum: 200,
			minimum: 100,
			resolve: true
		});

		expect(schemaEntry.type).toBe('guild');
		expect(schemaEntry.array).toBe(true);
		expect(schemaEntry.configurable).toBe(true);
		expect(schemaEntry.filter).toBeNull();
		expect(schemaEntry.shouldResolve).toBe(true);
		expect(schemaEntry.maximum).toBe(200);
		expect(schemaEntry.minimum).toBe(100);
		expect(schemaEntry.default).toStrictEqual([1]);
		expect(schemaEntry).toMatchSnapshot();
	});

	test('check', (): void => {
		const schema = new Schema();
		const schemaEntry = new SchemaEntry(schema, 'test', 'textchannel');
		const throwsCheck = (): void => schemaEntry._check();

		/* eslint-disable @typescript-eslint/ban-ts-ignore */

		// #region Client
		expect(throwsCheck).toThrow(/Cannot retrieve serializers/i);
		schemaEntry.client = client;
		// #endregion Client

		// #region Type
		// @ts-ignore
		schemaEntry.type = null;
		expect(throwsCheck).toThrow(/Parameter 'type' must be a string/i);

		schemaEntry.type = 'totallyaserializerpleasebelieveme';
		expect(throwsCheck).toThrow(/is not a valid type/i);

		schemaEntry.type = 'string';
		// #endregion Type

		// #region Booleans
		// @ts-ignore
		schemaEntry.array = 'true';
		expect(throwsCheck).toThrow(/Parameter 'array' must be a boolean/i);
		schemaEntry.array = false;

		// @ts-ignore
		schemaEntry.configurable = 'true';
		expect(throwsCheck).toThrow(/Parameter 'configurable' must be a boolean/i);
		schemaEntry.configurable = true;

		// @ts-ignore
		schemaEntry.minimum = '123';
		expect(throwsCheck).toThrow(/Parameter 'minimum' must be a number or null/i);
		schemaEntry.minimum = 123;

		// @ts-ignore
		schemaEntry.maximum = '100';
		expect(throwsCheck).toThrow(/Parameter 'maximum' must be a number or null/i);
		schemaEntry.maximum = 100;

		expect(throwsCheck).toThrow(/Parameter 'minimum' must contain a value lower than the parameter 'maximum'/i);
		schemaEntry.maximum = 200;
		// #endregion Booleans

		// @ts-ignore
		schemaEntry.filter = 'true';
		expect(throwsCheck).toThrow(/Parameter 'filter' must be a function/i);
		schemaEntry.filter = null;

		schemaEntry.array = true;
		schemaEntry.default = null;
		expect(throwsCheck).toThrow(/Default key must be an array if the key stores an array/i);

		schemaEntry.array = false;
		schemaEntry.type = 'string';
		schemaEntry.default = true;
		expect(throwsCheck).toThrow(/Default key must be a/i);
		/* eslint-enable @typescript-eslint/ban-ts-ignore */
	});

	test('toJSON', (): void => {
		const schema = new Schema();
		const schemaEntry = new SchemaEntry(schema, 'test', 'textchannel', {
			array: true,
			configurable: false,
			default: [],
			inclusive: true,
			maximum: 1000,
			minimum: 100,
			resolve: true
		});

		const json = schemaEntry.toJSON();

		expect(json).toStrictEqual({
			type: 'textchannel',
			array: true,
			configurable: false,
			default: [],
			inclusive: true,
			maximum: 1000,
			minimum: 100,
			resolve: true
		});

		expect(json).toMatchSnapshot();
	});

	test('default-automatic', (): void => {
		const schema = new Schema();
		const schemaEntry = new SchemaEntry(schema, 'test', 'textchannel');

		// eslint-disable-next-line dot-notation
		const generateDefault = (): unknown => schemaEntry['_generateDefaultValue']();

		expect(generateDefault()).toBeNull();

		schemaEntry.edit({ array: true });
		expect(generateDefault()).toStrictEqual([]);

		schemaEntry.edit({ array: false, type: 'boolean' });
		expect(generateDefault()).toBe(false);
	});
});

describe('schema-folder', (): void => {
	test('properties', (): void => {
		const schema = new Schema();
		const schemaFolder = new SchemaFolder(schema, 'someFolder');
		expect(schemaFolder.parent).toBe(schema);
		expect(schemaFolder.key).toBe('someFolder');
		expect(schemaFolder.defaults).toBeInstanceOf(SettingsFolder);
		expect(schemaFolder.defaults.size).toBe(0);
		expect(schemaFolder.toJSON()).toStrictEqual({});

		expect(schemaFolder).toMatchSnapshot();
	});

	test('child', (): void => {
		const schema = new Schema();
		const schemaFolder = new SchemaFolder(schema, 'someFolder')
			.add('someKey', 'textchannel');

		expect(schemaFolder.defaults.size).toBe(1);
		expect(schemaFolder.defaults.get('someKey')).toBeNull();
		expect((schemaFolder.get('someKey') as SchemaEntry).parent).toBe(schemaFolder);
		expect(schemaFolder.toJSON()).toStrictEqual({
			someKey: {
				array: false,
				configurable: true,
				default: null,
				inclusive: false,
				maximum: null,
				minimum: null,
				resolve: true,
				type: 'textchannel'
			}
		});

		expect(schemaFolder).toMatchSnapshot();
	});
});

describe('settings', (): void => {
	let schema: Schema;
	let gateway: Gateway;
	let provider: Provider;
	beforeEach(async (): Promise<void> => {
		schema = new Schema()
			.add('count', 'number')
			.add('messages', (folder): SchemaFolder => folder
				.add('hello', 'string'));
		gateway = new Gateway(client, 'settings-test', {
			provider: 'Mock',
			schema
		});
		provider = gateway.provider!;

		client.gateways.register(gateway);
		await gateway.init();
	});

	test('properties', (): void => {
		const id = '1';
		const target = { id };
		const settings = new Settings(gateway, target, id);
		expect(settings.id).toBe(id);
		expect(settings.gateway).toBe(gateway);
		expect(settings.target).toBe(target);
		expect(settings.existenceStatus).toBe(SettingsExistenceStatus.Unsynchronized);
		expect(settings.toJSON()).toStrictEqual({
			count: null,
			messages: {
				hello: null
			}
		});
		expect(settings).toMatchSnapshot();
	});

	test('clone', (): void => {
		const id = '2';
		const settings = new Settings(gateway, { id }, id);
		const clone = settings.clone();
		expect(clone).toBeInstanceOf(Settings);
		expect(clone.id).toBe(settings.id);
		expect(clone.target).toBe(settings.target);
		expect(clone.toJSON()).toStrictEqual(settings.toJSON());
		expect(clone).toMatchSnapshot();
	});

	test('sync-not-exists', async (): Promise<void> => {
		expect.assertions(2);
		const id = '3';
		const settings = new Settings(gateway, { id }, id);
		await expect(settings.sync()).resolves.toBe(settings);
		expect(settings.existenceStatus).toBe(SettingsExistenceStatus.NotExists);
	});

	test('sync-exists', async (): Promise<void> => {
		expect.assertions(7);
		const id = '4';
		await provider.create(gateway.name, id, { count: 60 });
		const settings = new Settings(gateway, { id }, id);
		const promise = settings.sync();
		const args: [Settings] = await once(settings.client, 'settingsSync') as [Settings];
		await expect(promise).resolves.toBe(settings);
		expect(args).toHaveLength(1);

		const emittedSettings = args[0];
		expect(emittedSettings).toBe(settings);
		expect(emittedSettings.existenceStatus).toBe(SettingsExistenceStatus.Exists);
		expect(emittedSettings.get('count')).toBe(60);
		expect(settings.get('count')).toBe(60);
		expect(settings.existenceStatus).toBe(SettingsExistenceStatus.Exists);
	}, 10000);

	test('destroy-not-exists', async (): Promise<void> => {
		expect.assertions(2);
		const id = '5';
		const settings = new Settings(gateway, { id }, id);

		await expect(settings.destroy()).resolves.toBe(settings);
		expect(settings.existenceStatus).toBe(SettingsExistenceStatus.NotExists);
	});

	test('destroy-exists', async (): Promise<void> => {
		expect.assertions(9);
		const id = '6';
		await provider.create(gateway.name, id, { count: 120 });
		const settings = new Settings(gateway, { id }, id);
		settings.client.once('settingsDelete', (...args): void => {
			expect(args).toHaveLength(1);

			const emittedSettings = args[0];
			expect(emittedSettings).toBe(settings);
			expect(emittedSettings.get('count')).toBe(120);
			expect(emittedSettings.existenceStatus).toBe(SettingsExistenceStatus.Exists);
		});

		await expect(settings.sync()).resolves.toBe(settings);
		expect(settings.get('count')).toBe(120);
		await expect(settings.destroy()).resolves.toBe(settings);
		expect(settings.existenceStatus).toBe(SettingsExistenceStatus.NotExists);
		expect(settings.get('count')).toBeNull();
	});
});

describe('utils', (): void => {
	test('extensions', (): void => {
		expect(client.providers).toBeInstanceOf(Map);
		expect(client.serializers).toBeInstanceOf(Map);
		expect(client.gateways).toBeInstanceOf(Map);
	});

	test('providers', (): void => {
		const provider = client.providers.get('Mock');
		expect(provider).not.toBeUndefined();
	});
});