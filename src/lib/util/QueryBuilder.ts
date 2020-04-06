import type { SchemaEntry } from '../settings/schema/SchemaEntry';
import { QueryBuilderUtils } from './Constants';
import { mergeDefault, deepClone } from './Utils';

export class QueryBuilder extends Map<string, Required<QueryBuilderDatatype>> {

	/**
	 * The default array handler for this instance
	 */
	private array: QueryBuilderArray;

	/**
	 * The default array handler for this instance
	 */
	private arraySerializer: QueryBuilderArraySerializer;

	/**
	 * The default datatype formatter for the SQL database
	 */
	private formatDatatype: QueryBuilderFormatDatatype;

	/**
	 * The default serializer for this instance
	 */
	private serializer: QueryBuilderSerializer;

	/**
	 * @param options The default options for all datatypes plus formatDatatype
	 */
	public constructor(options: QueryBuilderEntryOptions = {}) {
		super();
		mergeDefault(QueryBuilderUtils.OPTIONS, options);

		this.array = options.array!;
		this.arraySerializer = options.arraySerializer!;
		this.formatDatatype = options.formatDatatype!;
		this.serializer = options.serializer!;

		for (const [name, datatype] of QueryBuilderUtils.DATATYPES) this.add(name, datatype);
	}

	/**
	 * Register a datatype to this instance.
	 * @param name The name for the datatype
	 * @param data The options for this query builder
	 */
	public add(name: string, data: QueryBuilderDatatype): this {
		if (typeof data.extends === 'string') {
			const datatype = this.get(data.extends);
			if (datatype) this.set(name, Object.assign(Object.create(datatype), data));
			else throw new Error(`"extends" in datatype ${name} does not point to a registered datatype.`);
		} else {
			const datatype = this.get(name);
			if (datatype) {
				Object.assign(datatype, data);
			} else {
				this.set(name, mergeDefault({
					array: this.array,
					arraySerializer: this.arraySerializer,
					extends: undefined,
					formatDatatype: this.formatDatatype,
					serializer: this.serializer,
					type: undefined
					// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
					// @ts-ignore
				}, deepClone(data)));
			}
		}
		return this;
	}

	/**
	 * Removes a datatype from this instance.
	 * @param name The name for the datatype to remove
	 */
	public remove(name: string): this {
		this.delete(name);
		return this;
	}

	/**
	 * Parse a SchemaEntry for the SQL datatype creation.
	 *
	 * ```typescript
	 * qb.generateDatatype(this.client.gateways.get('guilds').schema.get('prefix'));
	 * // type: 'string', array: true, max: 10
	 * // -> prefix VARCHAR(10)[]
	 * ```
	 * @param schemaEntry The SchemaEntry to process
	 */
	public generateDatatype(schemaEntry: SchemaEntry): string {
		const datatype = this.get(schemaEntry.type) || undefined;
		const parsedDefault = this.serialize(schemaEntry.default, schemaEntry, datatype);
		const type = typeof datatype!.type === 'function' ? datatype!.type(schemaEntry) : datatype!.type;
		const parsedDatatype = schemaEntry.array ? datatype!.array(type) : type;
		return datatype!.formatDatatype(schemaEntry.path, parsedDatatype, parsedDefault);
	}

	/**
	 * Parse the value.
	 * @param value The value to parse
	 * @param schemaEntry The SchemaEntry instance that manages this instance
	 * @param datatype The QueryBuilder datatype
	 */
	public serialize(value: unknown, schemaEntry: SchemaEntry, datatype: Required<QueryBuilderDatatype> = this.get(schemaEntry.type)!) {
		if (!datatype) throw new Error(`The type '${schemaEntry.type}' is unavailable, please set its definition.`);
		if (schemaEntry.array && !datatype.array) throw new Error(`The datatype '${datatype.type}' does not support arrays.`);

		if (value === null) return null;

		return schemaEntry.array ?
			datatype.arraySerializer(value as readonly unknown[], schemaEntry, datatype.serializer) :
			datatype.serializer(value, schemaEntry);
	}

	/**
	 * Returns any errors in the query builder.
	 */
	public debug(): string {
		const errors: string[] = [];
		for (const [name, datatype] of this) {
			if (!['string', 'function'].includes(typeof datatype.type)) errors.push(`"type" in datatype ${name} must be a string or a function, got: ${typeof datatype.type}`);
			if (typeof datatype.array !== 'function') errors.push(`"array" in datatype ${name} must be a function, got: ${typeof datatype.array}`);
			if (typeof datatype.arraySerializer !== 'function') errors.push(`"arraySerializer" in datatype ${name} must be a function, got: ${typeof datatype.arraySerializer}`);
			if (typeof datatype.formatDatatype !== 'function') errors.push(`"formatDatatype" in datatype ${name} must be a function, got: ${typeof datatype.formatDatatype}`);
			if (typeof datatype.serializer !== 'function') errors.push(`"serializer" in datatype ${name} must be a function, got: ${typeof datatype.serializer}`);
		}
		return errors.join('\n');
	}

}


export interface QueryBuilderArray {
	/**
	 * @param entry The schema entry for context
	 */
	(entry: string): string;
}

export interface QueryBuilderArraySerializer {
	/**
	 * @param values The values to resolve
	 * @param schemaEntry The SchemaEntry that manages this instance
	 * @param serializer The single-element serializer
	 */
	(values: readonly unknown[], schemaEntry: SchemaEntry, resolver: QueryBuilderSerializer): string;
}

export interface QueryBuilderSerializer {
	/**
	 * @param value The value to serialize
	 * @param schemaEntry The SchemaEntry that manages this instance
	 */
	(value: unknown, schemaEntry: SchemaEntry): string;
}

export interface QueryBuilderFormatDatatype {
	/**
	 * @param name The name of the SQL column
	 * @param datatype The SQL datatype
	 * @param def The default value
	 */
	(name: string, datatype: string, def?: string | null): string;
}

export interface QueryBuilderType {
	/**
	 * @param entry The SchemaEntry to determine the SQL type from
	 */
	(schemaEntry: SchemaEntry): string;
}

export interface QueryBuilderEntryOptions {
	/**
	 * The default array handler for this instance
	 */
	array?: QueryBuilderArray;

	/**
	 * The default array handler for this instance
	 */
	arraySerializer?: QueryBuilderArraySerializer;

	/**
	 * The default datatype formatter for the SQL database
	 */
	formatDatatype?: QueryBuilderFormatDatatype;

	/**
	 * The default serializer for this instance
	 */
	serializer?: QueryBuilderSerializer;
}

export interface QueryBuilderDatatype extends QueryBuilderEntryOptions {
	/**
	 * The SQL datatype
	 */
	type?: QueryBuilderType | string;

	/**
	 * The QueryBuilder primitive this extends to
	 */
	extends?: string;
}
