import * as Constants from './lib/util/Constants';
import type { Language } from './lib/structures/Language';
import type { Settings } from './lib/settings/structures/Settings';
import type { GatewayDriver } from './lib/settings/gateway/GatewayDriver';
import type { KeyedObject } from './lib/util/SharedTypes';
import type { SettingsUpdateContext } from './lib/settings/structures/SettingsFolder';

export * from './lib/Client';

// #region extensions

export * from './lib/extensions/ConstellationUser';

// #endregion extensions

// #region settings

export * from './lib/settings/gateway/Gateway';
export * from './lib/settings/gateway/GatewayDriver';
export * from './lib/settings/gateway/GatewayStorage';
export * from './lib/settings/schema/Schema';
export * from './lib/settings/schema/SchemaEntry';
export * from './lib/settings/schema/SchemaFolder';
export * from './lib/settings/structures/Settings';
export * from './lib/settings/structures/SettingsFolder';

// #endregion settings

// #region structures

export * from './lib/structures/base/AliasPiece';
export * from './lib/structures/base/AliasStore';
export * from './lib/structures/base/Piece';
export * from './lib/structures/base/Store';
export * from './lib/structures/Language';
export * from './lib/structures/LanguageStore';
export * from './lib/structures/Provider';
export * from './lib/structures/ProviderStore';
export * from './lib/structures/Serializer';
export * from './lib/structures/SerializerStore';
export * from './lib/structures/SQLProvider';

// #endregion structures

// #region utils

export { Constants };
export * from './lib/util/Colors';
export * from './lib/util/ConstellationConsole';
export * from './lib/util/Cron';
export * from './lib/util/Duration';
export * from './lib/util/QueryBuilder';
export * from './lib/util/RateLimit';
export * from './lib/util/RateLimitManager';
export * from './lib/util/RequestHandler';
export * from './lib/util/SharedTypes';
export * from './lib/util/Stopwatch';
export * from './lib/util/Timestamp';
export * from './lib/util/Type';
export * from './lib/util/Utils';

// #endregion utils

// #region augments

/** @internal */
declare module 'discord.js' {
	interface Client {
		gateways: GatewayDriver;
	}

	interface Guild {
		readonly language: Language;
	}

	interface User {
		settings: Settings;
	}

	interface ClientEvents {
		settingsSync: [Settings];
		settingsDelete: [Settings];
		settingsCreate: [Settings, KeyedObject, SettingsUpdateContext];
		settingsUpdate: [Settings, KeyedObject, SettingsUpdateContext];
	}
}

// #endregion augments