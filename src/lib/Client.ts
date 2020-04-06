import * as Discord from 'discord.js';
import * as path from 'path';
import { SerializerStore } from './structures/SerializerStore';
import { LanguageStore } from './structures/LanguageStore';
import { ProvidersOptions, ProviderStore } from './structures/ProviderStore';
import { ConsoleOptions, ConsoleEvents } from './util/ConstellationConsole';
import { ReadyMessage } from './util/SharedTypes';
import { AliasPieceOptions } from './structures/base/AliasPiece';
import { mergeDefault } from './util/Utils';
import { ClientUtils } from './util/Constants';
import { Settings } from './settings/structures/Settings';
import { ClientApplication } from 'discord.js';
import { Piece } from './structures/base/Piece';
import { Store } from './structures/base/Store';
import Collection from '@discordjs/collection';
import { GatewayDriver } from './settings/gateway/GatewayDriver';
import { ConstellationUserManager } from './extensions/ConstellationUserManager';


export class ConstellationClient extends Discord.Client {

	/**
	 * The directory where the user files are at
	 */
	public userBaseDirectory: string = path.dirname(require.main!.filename);

	public users: ConstellationUserManager = new ConstellationUserManager(this);

	public options!: Required<ConstellationClientOptions>;

	public serializers: SerializerStore = new SerializerStore(this);

	public providers: ProviderStore = new ProviderStore(this);

	public languages: LanguageStore = new LanguageStore(this);

	public settings: Settings | null = null;

	public application: ClientApplication | null = null;

	public pieceStores: Collection<string, Store<Piece>> = new Collection();

	public gateways: GatewayDriver = new GatewayDriver(this);

	public constructor(options: ConstellationClientOptions = {}) {
		super(mergeDefault(ClientUtils.DEFAULT_OPTIONS, options));

		this.registerStore(this.serializers)
			.registerStore(this.providers)
			.registerStore(this.languages);
	}

	public async fetchApplication(): Promise<ClientApplication> {
		this.application = await super.fetchApplication();
		return this.application;
	}

	public registerStore(store: Store<Piece>): this {
		this.pieceStores.set(store.name, store);
		return this;
	}

	public unregisterStore(name: string): this {
		this.pieceStores.delete(name);
		return this;
	}
}

export { ConstellationClient as Client }

export interface ConstellationClientOptions extends Discord.ClientOptions {
	pieceDefaults?: {
		[k: string]: any
		serializers: AliasPieceOptions
	};
	createPiecesFolders?: boolean;
	disabledCorePieces?: string[];
	providers?: ProvidersOptions;
	language?: string;
	commandEditing?: boolean;
	commandLogging?: boolean;
	commandMessageLifetime?: number;
	console?: ConsoleOptions;
	consoleEvents?: ConsoleEvents;
	noPrefixDM?: boolean;
	owners?: string[];
	prefix?: string | string[];
	prefixCaseInsensitive?: boolean;
	production?: boolean;
	readyMessage?: ReadyMessage;
	regexPrefix?: RegExp;
	schedule?: any;
	slowmode?: number;
	slowmodeAggressive?: boolean;
	settings?: any;
	typing?: boolean;
}
