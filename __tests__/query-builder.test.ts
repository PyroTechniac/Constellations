import { sharedSchema } from './lib/query-builder';
import { QueryBuilder, QueryBuilderType, Constants, SchemaEntry } from '../src';

describe('basic', (): void => {
	test('constructor-no-arguments', (): void => {
		const qb = new QueryBuilder();
		expect(qb.size).toBe(Constants.QueryBuilderUtils.DATATYPES.length);
	});

	test('typeof', (): void => {
		const qb = new QueryBuilder();
		const type = qb.get('string')!;

		expect(typeof type).toBe('object');
		expect(typeof type.array).toBe('function');
		expect(typeof type.arraySerializer).toBe('function');
		expect(typeof type.extends).toBe('undefined');
		expect(typeof type.formatDatatype).toBe('function');
		expect(typeof type.type).toBe('function');
	});

	test('value-check', (): void => {
		const qb = new QueryBuilder();
		const type = qb.get('string')!;
		const getType = type.type as QueryBuilderType;
		const schemaEntry = sharedSchema.get('string19') as SchemaEntry;

		expect(type.array(type.type as string)).toBe('TEXT');
		expect(type.arraySerializer(['339942739275677727'], schemaEntry, type.serializer)).toBe('\'["339942739275677727"]\'');
		expect(getType(schemaEntry)).toBe('VARCHAR(19)');
		expect(type.formatDatatype('id', 'VARCHAR(19)', null)).toBe('id VARCHAR(19)');
		expect(type.formatDatatype('id', 'VARCHAR(19)', '\'339942739275677727\'')).toBe('id VARCHAR(19) NOT NULL DEFAULT \'339942739275677727\'');
		expect(type.serializer("' DROP TABLE 'users'; --", null as unknown as SchemaEntry)).toBe("''' DROP TABLE ''users''; --'");
		expect(type.arraySerializer(["' DROP TABLE 'users'; --"], null as unknown as SchemaEntry, type.serializer)).toBe(`'["'' DROP TABLE ''users''; --"]'`);
	});

	test('extends', (): void => {
		const qb = new QueryBuilder();
		{
			const typeSnowflake = qb.get('snowflake')!;
			const typeChannel = qb.get('channel')!;

			expect(typeSnowflake.type).toBe('VARCHAR(19)');
			expect(typeSnowflake.extends).toBeUndefined();
			expect(typeChannel.extends).toBe('snowflake');

			expect(typeChannel.array).toBe(typeSnowflake.array);
			expect(typeChannel.arraySerializer).toBe(typeSnowflake.arraySerializer);
			expect(typeChannel.formatDatatype).toBe(typeSnowflake.formatDatatype);
			expect(typeChannel.serializer).toBe(typeSnowflake.serializer);
			expect(typeChannel.type).toBe(typeSnowflake.type);
		}

		qb.add('snowflake', { type: 'BIGINT' });
		{
			const typeSnowflake = qb.get('snowflake')!;
			const typeChannel = qb.get('channel')!;

			expect(typeSnowflake.type).toBe('BIGINT');
			expect(typeChannel.type).toBe(typeSnowflake.type);
		}
	});
});

describe('mysql', (): void => {
	const qb = new QueryBuilder({
		array: (): string => 'JSON',
		arraySerializer: (values, piece, resolver): string => `JSON_ARRAY(${values.map((value) => resolver(value, piece)).join(', ')})`,
		formatDatatype: (name, datatype, def = null): string => `\`${name}\` ${datatype}${def !== null ? ` NOT NULL DEFAULT ${def}` : ''}`
	})
		.add('integer', { type: ({ maximum: max }): string => max! >= 2 ** 32 ? 'BIGINT' : 'INTEGER' })
		.add('float', { type: 'DOUBLE PRECISION' })
		.add('boolean', { type: 'BIT(1)', serializer: (input): string => input ? '1' : '0' });

	test('primitive-types', (): void => {
		expect(typeof qb.get('integer')!.type).toBe('function');
		expect(qb.get('float')!.type).toBe('DOUBLE PRECISION');
		expect(qb.get('boolean')!.type).toBe('BIT(1)');
	});

	test('integer-type', (): void => {
		const type = qb.get('integer')!;
		const getType = type.type as QueryBuilderType;
		const schemaEntry = sharedSchema.get('integer') as SchemaEntry;

		expect(getType(schemaEntry)).toBe('INTEGER');
		expect(type.array(getType(schemaEntry))).toBe('JSON');
		expect(type.serializer(420, schemaEntry)).toBe('420');
		expect(type.arraySerializer([420], schemaEntry, type.serializer)).toBe('JSON_ARRAY(420)');
		expect(type.formatDatatype('id', 'INTEGER', null)).toBe('`id` INTEGER');
		expect(type.formatDatatype('id', 'INTEGER', '420')).toBe('`id` INTEGER NOT NULL DEFAULT 420');
	});

	test('bigint-type', (): void => {
		const type = qb.get('integer')!;
		const getType = type.type as QueryBuilderType;
		const schemaEntry = sharedSchema.get('integerLarge') as SchemaEntry;

		expect(getType(schemaEntry)).toBe('BIGINT');
		expect(type.array(getType(schemaEntry))).toBe('JSON');
		expect(type.serializer(420, schemaEntry)).toBe('420');
		expect(type.arraySerializer([420], schemaEntry, type.serializer)).toBe('JSON_ARRAY(420)');
		expect(type.formatDatatype('id', 'BIGINT', null)).toBe('`id` BIGINT');
		expect(type.formatDatatype('id', 'BIGINT', '420')).toBe('`id` BIGINT NOT NULL DEFAULT 420');
	});

	test('boolean-type', (): void => {
		const type = qb.get('boolean')!;
		const getType = type.type as string;
		const schemaEntry = sharedSchema.get('boolean') as SchemaEntry;

		expect(getType).toBe('BIT(1)');
		expect(type.array(getType)).toBe('JSON');
		expect(type.serializer(false, schemaEntry)).toBe('0');
		expect(type.arraySerializer([true, false], schemaEntry, type.serializer)).toBe('JSON_ARRAY(1, 0)');
		expect(type.formatDatatype('id', 'BIT(1)', null)).toBe('`id` BIT(1)');
		expect(type.formatDatatype('id', 'BIT(1)', '1')).toBe('`id` BIT(1) NOT NULL DEFAULT 1');
	});

	test('string-type', (): void => {
		const type = qb.get('string')!;
		const getType = type.type as QueryBuilderType;
		const schemaEntry = sharedSchema.get('string19') as SchemaEntry;

		expect(type.array(getType(schemaEntry))).toBe('JSON');
		expect(type.serializer('339942739275677727', schemaEntry)).toBe("'339942739275677727'");
		expect(type.arraySerializer(['339942739275677727'], schemaEntry, type.serializer)).toBe(`JSON_ARRAY('339942739275677727')`);
		expect(type.formatDatatype('id', 'VARCHAR(19)', null)).toBe('`id` VARCHAR(19)');
		expect(type.formatDatatype('id', 'VARCHAR(19)', "'339942739275677727'")).toBe("`id` VARCHAR(19) NOT NULL DEFAULT '339942739275677727'");

		expect(type.serializer("' DROP TABLE 'users'; --", null as unknown as SchemaEntry)).toBe("''' DROP TABLE ''users''; --'");
		expect(type.arraySerializer(["' DROP TABLE 'users'; --"], null as unknown as SchemaEntry, type.serializer)).toBe(`JSON_ARRAY(''' DROP TABLE ''users''; --')`);
	});
});

describe('postgres', (): void => {
	const qb = new QueryBuilder({
		array: (type): string => `${type}[]`,
		arraySerializer: (values, piece, resolver): string =>
			values.length ? `array[${values.map((value) => resolver(value, piece)).join(', ')}]` : "'{}'",
		formatDatatype: (name, datatype, def = null): string => `"${name}" ${datatype}${def !== null ? ` NOT NULL DEFAULT ${def}` : ''}`
	})
		.add('boolean', { type: 'BOOL' })
		.add('integer', { type: ({ maximum: max }) => max! >= 2 ** 32 ? 'BIGINT' : 'INTEGER' })
		.add('float', { type: 'DOUBLE PRECISION' })
		.add('uuid', { type: 'UUID' })
		.add('any', { type: 'JSON', serializer: (input): string => `'${JSON.stringify(input)}'::json` })
		.add('json', { extends: 'any' });

	test('primitive-types', (): void => {
		expect(qb.get('boolean')!.type).toBe('BOOL');
		expect(typeof qb.get('integer')!.type).toBe('function');
		expect(qb.get('float')!.type).toBe('DOUBLE PRECISION');
		expect(qb.get('uuid')!.type).toBe('UUID');
		expect(qb.get('any')!.type).toBe('JSON');
		expect(qb.get('json')!.type).toBe('JSON');
	});

	test('advanced-types', (): void => {
		const type = qb.get('string')!;
		const getType = type.type as QueryBuilderType;
		const schemaEntry = sharedSchema.get('string19') as SchemaEntry;

		expect(type.array(getType(schemaEntry))).toBe('VARCHAR(19)[]');
		expect(type.serializer('339942739275677727', schemaEntry)).toBe("'339942739275677727'");
		expect(type.arraySerializer(['339942739275677727'], schemaEntry, type.serializer)).toBe("array['339942739275677727']");
		expect(type.formatDatatype('id', 'VARCHAR(19)', null)).toBe('"id" VARCHAR(19)');
		expect(type.formatDatatype('id', 'VARCHAR(19)', "'339942739275677727'")).toBe(`"id" VARCHAR(19) NOT NULL DEFAULT '339942739275677727'`);

		expect(type.serializer("' DROP TABLE 'users'; --", null as unknown as SchemaEntry)).toBe("''' DROP TABLE ''users''; --'");
		expect(type.arraySerializer(["' DROP TABLE 'users'; --"], null as unknown as SchemaEntry, type.serializer)).toBe(`array[''' DROP TABLE ''users''; --']`);
	});
});

describe('sqlite', (): void => {
	const qb = new QueryBuilder()
		.add('integer', { type: ({ maximum: max }): string => max! >= 2 ** 32 ? 'BIGINT' : 'INTEGER' })
		.add('float', { type: 'DOUBLE PRECISION' })
		.add('boolean', { type: 'TINYINT', serializer: (input): string => input ? '1' : '0' });

	test('primitive-types', (): void => {
		expect(typeof qb.get('integer')!.type).toBe('function');
		expect(qb.get('float')!.type).toBe('DOUBLE PRECISION');
		expect(qb.get('boolean')!.type).toBe('TINYINT');
	});

	test('integer-type', (): void => {
		const type = qb.get('integer')!;
		const getType = type.type as QueryBuilderType;
		const schemaEntry = sharedSchema.get('integer') as SchemaEntry;

		expect(getType(schemaEntry)).toBe('INTEGER');
		expect(type.array(getType(schemaEntry))).toBe('TEXT');
		expect(type.serializer(420, schemaEntry)).toBe('420');
		expect(type.arraySerializer([420], schemaEntry, type.serializer)).toBe("'[420]'");
		expect(type.formatDatatype('id', 'INTEGER', null)).toBe('id INTEGER');
		expect(type.formatDatatype('id', 'INTEGER', '420')).toBe('id INTEGER NOT NULL DEFAULT 420');
	});

	test('bigint-type', (): void => {
		const type = qb.get('integer')!;
		const getType = type.type as QueryBuilderType;
		const schemaEntry = sharedSchema.get('integerLarge') as SchemaEntry;

		expect(getType(schemaEntry)).toBe('BIGINT');
		expect(type.array(getType(schemaEntry))).toBe('TEXT');
		expect(type.serializer(420, schemaEntry)).toBe('420');
		expect(type.arraySerializer([420], schemaEntry, type.serializer)).toBe("'[420]'");
		expect(type.formatDatatype('id', 'BIGINT', null)).toBe('id BIGINT');
		expect(type.formatDatatype('id', 'BIGINT', '420')).toBe('id BIGINT NOT NULL DEFAULT 420');
	});

	test('boolean-type', (): void => {
		const type = qb.get('boolean')!;
		const getType = type.type as string;
		const schemaEntry = sharedSchema.get('boolean') as SchemaEntry;

		expect(getType).toBe('TINYINT');
		expect(type.array(getType)).toBe('TEXT');
		expect(type.serializer(false, schemaEntry)).toBe('0');
		expect(type.arraySerializer([true, false], schemaEntry, type.serializer)).toBe("'[true,false]'");
		expect(type.formatDatatype('id', 'TINYINT', null)).toBe('id TINYINT');
		expect(type.formatDatatype('id', 'TINYINT', '1')).toBe('id TINYINT NOT NULL DEFAULT 1');
	});

	test('string-type', (): void => {
		const type = qb.get('string')!;
		const getType = type.type as QueryBuilderType;
		const schemaEntry = sharedSchema.get('string19') as SchemaEntry;

		expect(type.array(getType(schemaEntry))).toBe('TEXT');
		expect(type.serializer('339942739275677727', schemaEntry)).toBe("'339942739275677727'");
		expect(type.arraySerializer(['339942739275677727'], schemaEntry, type.serializer)).toBe(`'["339942739275677727"]'`);
		expect(type.formatDatatype('id', 'VARCHAR(19)', null)).toBe('id VARCHAR(19)');
		expect(type.formatDatatype('id', 'VARCHAR(19)', "'339942739275677727'")).toBe(`id VARCHAR(19) NOT NULL DEFAULT '339942739275677727'`);

		expect(type.serializer("' DROP TABLE 'users'; --", null as unknown as SchemaEntry)).toBe( "''' DROP TABLE ''users''; --'");
		expect(type.arraySerializer(["' DROP TABLE 'users'; --"], null as unknown as SchemaEntry, type.serializer)).toBe(`'["'' DROP TABLE ''users''; --"]'`);
	});
});