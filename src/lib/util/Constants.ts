import type { ConsoleOptions, ConsoleColorStyles } from './ConstellationConsole';
import type { MentionRegex } from './SharedTypes';
import type { QueryBuilderDatatype, QueryBuilderEntryOptions } from './QueryBuilder';
import { mergeDefault, isObject } from './Utils';
import { ConstellationClientOptions } from '../Client';

/* eslint-disable @typescript-eslint/no-namespace */

/** @internal */
export namespace ConsoleUtils {
	const colorBase = {
		shard: { background: 'cyan', text: 'black' },
		message: {},
		time: {}
	};

	export const types: Record<keyof ConsoleColorStyles, keyof ConsoleColorStyles> = {
		debug: 'log',
		error: 'error',
		log: 'log',
		verbose: 'log',
		warn: 'warn',
		wtf: 'error',
		info: 'info'
	};

	export const defaults: Omit<Required<ConsoleOptions>, 'useColor'> = {
		stdout: process.stdout,
		stderr: process.stderr,
		timestamps: true,
		utc: false,
		colors: {
			debug: mergeDefault(colorBase, { time: { background: 'magenta' } }),
			error: mergeDefault(colorBase, { time: { background: 'red' } }),
			log: mergeDefault(colorBase, { time: { background: 'blue' } }),
			verbose: mergeDefault(colorBase, { time: { text: 'grey' } }),
			warn: mergeDefault(colorBase, { time: { background: 'lightyellow', text: 'black' } }),
			wtf: mergeDefault(colorBase, { message: { text: 'red' }, time: { background: 'red' } })
		}
	};
}

/** @internal */
export namespace TimestampUtils { // eslint-disable-line @typescript-eslint/no-namespace
	/** @internal */
	export const enum Time {
		Second = 1000,
		Minute = Second * 60,
		Hour = Minute * 60,
		Day = Hour * 24
	}
	/** @internal */
	export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	/** @internal */
	export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	/** @internal */
	export const TOKENS = new Map<string, number>([
		['Y', 4],
		['Q', 1],
		['M', 4],
		['D', 4],
		['d', 4],
		['X', 1],
		['x', 1],
		['H', 2],
		['h', 2],
		['a', 1],
		['A', 1],
		['m', 2],
		['s', 2],
		['S', 3],
		['Z', 2],
		['l', 4],
		['L', 4],
		['T', 1],
		['t', 1]
	]);
}

/** @internal */
export namespace CronUtils {
	export const partRegex = /^(?:(\*)|(\d+)(?:-(\d+))?)(?:\/(\d+))?$/;
	export const wildcardRegex = /\bh\b|\B\?\B/g;
	export const allowedNum = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 6]];
	export const predefined: Record<string, string> = {
		'@annually': '0 0 1 1 *',
		'@yearly': '0 0 1 1 *',
		'@monthly': '0 0 1 * *',
		'@weekly': '0 0 * * 0',
		'@daily': '0 0 * * *',
		'@hourly': '0 * * * *'
	};

	export const tokens: Record<string, number> = {
		jan: 1,
		feb: 2,
		mar: 3,
		apr: 4,
		may: 5,
		jun: 6,
		jul: 7,
		aug: 8,
		sep: 9,
		oct: 10,
		nov: 11,
		dec: 12,
		sun: 0,
		mon: 1,
		tue: 2,
		wed: 3,
		thu: 4,
		fri: 5,
		sat: 6
	};

	export const tokensRegex = new RegExp(Object.keys(tokens).join('|'), 'g');
}

/** @internal */
export namespace GeneralUtils {
	export const MENTION_REGEX: MentionRegex = {
		userOrMember: /^(?:<@!?)?(\d{17,19})>?$/,
		channel: /^(?:<#)?(\d{17,19})>?$/,
		emoji: /^(?:<a?:\w{2,32}:)?(\d{17,19})>?$/,
		role: /^(?:<@&)?(\d{17,19})>?$/,
		snowflake: /^(\d{17,19})$/
	};
}

/** @internal */
export namespace QueryBuilderUtils {
	export const DATATYPES: [string, QueryBuilderDatatype][] = [
		['json', { type: 'JSON', serializer: (value): string => `'${JSON.stringify(value).replace(/'/g, "''")}'` }],
		['any', { extends: 'json' }],
		['boolean', { type: 'BOOLEAN', serializer: (value): string => `${value}` }],
		['bool', { extends: 'boolean' }],
		['snowflake', { type: 'VARCHAR(19)', serializer: (value): string => `'${value}'` }],
		['channel', { extends: 'snowflake' }],
		['textchannel', { extends: 'channel' }],
		['voicechannel', { extends: 'channel' }],
		['categorychannel', { extends: 'channel' }],
		['guild', { extends: 'snowflake' }],
		['number', { type: 'FLOAT', serializer: (value): string => `${value}` }],
		['float', { extends: 'number' }],
		['integer', { extends: 'number', type: 'INTEGER' }],
		['command', { type: 'TEXT' }],
		['language', { type: 'VARCHAR(5)' }],
		['role', { extends: 'snowflake' }],
		['string', { type: ({ maximum: max }): string => max ? `VARCHAR(${max})` : 'TEXT' }],
		['url', { type: 'TEXT' }],
		['user', { extends: 'snowflake' }]
	];

	export const OPTIONS: Required<QueryBuilderEntryOptions> = {
		array: (): string => 'TEXT',
		arraySerializer: (values): string => `'${JSON.stringify(values).replace(/'/g, "''")}'`,
		formatDatatype: (name, datatype, def = null): string => `${name} ${datatype}${def !== null ? ` NOT NULL DEFAULT ${def}` : ''}`,
		serializer: (value): string => `'${(isObject(value) ? JSON.stringify(value) : String(value)).replace(/'/g, "''")}'`
	};
}

/** @internal */
export namespace ClientUtils {
	export const DEFAULT_OPTIONS: ConstellationClientOptions = {
		commandEditing: false,
		commandLogging: false,
		commandMessageLifetime: 1800,
		console: {},
		consoleEvents: {
			debug: false,
			error: true,
			log: true,
			verbose: false,
			warn: true,
			wtf: true
		},
		createPiecesFolders: true,
		disabledCorePieces: [],
		language: 'en-US',
		noPrefixDM: false,
		prefix: '',
		readyMessage: (client): string => `Successfully initialized. Ready to serve ${client.guilds.cache.size} guild${client.guilds.cache.size === 1 ? '' : 's'}.`,
		typing: false,
		owners: [],
		production: process.env.NODE_ENV === 'production',
		prefixCaseInsensitive: false,
		providers: { default: 'json' },
		pieceDefaults: {
			languages: { enabled: true },
			providers: {enabled: true},
			serializers: {
				enabled: true,
				aliases: []
			}
		},
		schedule: {interval: 60000},
		slowmode: 0,
		slowmodeAggressive: false,
		settings: {
			preserve: true,
			gateways: {
				guilds: {},
				users: {},
				clientStorage: {}
			}
		}
	}
}