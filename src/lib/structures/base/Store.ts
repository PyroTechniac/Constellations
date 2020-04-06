import type { Piece, PieceJSON } from './Piece';
import Collection, { CollectionConstructor } from '@discordjs/collection';
import type { Constructor } from '../../util/SharedTypes';
import { join, extname, relative, sep } from 'path';
import { scan, ensureDir } from 'fs-nextra';
import type { ConstellationClient } from '../../Client';
import { isClass } from '../../util/Utils';

/**
 * The Store class to hold Pieces.
 */
export class Store<V extends Piece, VConstructor = Constructor<V>> extends Collection<string, V> {

	/**
	 * The constructor of the Piece this Store holds
	 */
	public readonly holds!: VConstructor;

	/**
	 * The client that instantiated this Store
	 */
	public readonly client!: ConstellationClient;

	/**
	 * The name of this Store
	 */
	public readonly name!: string;

	/**
	 * The core directories to read when loading pieces
	 */
	public readonly coreDirectories!: Set<string>;

	/**
	 * @param client The Client that created this Store
	 * @param name The name of the Store
	 * @param holds The constructor function of the Piece this store holds
	 */
	public constructor(client: ConstellationClient, name: string, holds: VConstructor) {
		super();

		Object.defineProperty(this, 'client', { value: client });

		Object.defineProperty(this, 'name', { value: name });

		Object.defineProperty(this, 'holds', { value: holds });

		Object.defineProperty(this, 'coreDirectories', { value: new Set<string>() });
	}

	/**
	 * The user directory where user made Pieces are found
	 */
	public get userDirectory(): string {
		return join(this.client.userBaseDirectory, this.name);
	}

	/**
	 * Registers a core directory to check for pieces.
	 * @param directory The directory to check for core pieces
	 */
	public registerCoreDirectory(directory: string): this {
		this.coreDirectories.add(join(directory, this.name));
		return this;
	}

	/**
	 * Adds a Piece to this Store.
	 * @param piece The Piece to add
	 */
	public add(piece: V): V {
		if (!(piece instanceof (this.holds as any))) throw new TypeError(`Only ${this} may be stored in this Store.`);
		const existing = this.get(piece.name);
		if (existing) this.delete(existing);
		else if (this.client.listenerCount('pieceLoaded')) this.client.emit('pieceLoaded', piece);
		this.set(piece.name, piece);
		return piece;
	}

	/**
	 * Loads a Piece from a directory and file location.
	 * @param directory The directory to load from
	 * @param file The file itselt
	 */
	public load(directory: string, file: string[]): V {
		const loc = join(directory, ...file);
		let piece: V | null = null;
		try {
			// eslint-disable-next-line no-shadow, @typescript-eslint/no-var-requires
			const Piece = ((req): VConstructor | undefined => req.default || req)(require(loc));
			if (!isClass(Piece) || typeof Piece === 'undefined') throw new TypeError('The exported structure is not a class.');
			const CastedPiece = Piece as VConstructor;
			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			piece = this.add(new CastedPiece(this, file, directory));
		} catch (error) {
			if (this.client.listenerCount('wtf')) this.client.emit('wtf', `Failed to load file '${loc}'. Error:\n${error.stack || error}`);
		}

		delete require.cache[loc];
		module.children.pop();
		return piece!;
	}

	/**
	 * Loads all the Pieces from the respective core directories
	 */
	public async loadAll(): Promise<number> {
		this.clear();
		if (!this.client.options.disabledCorePieces.includes(this.name)) {
			for (const directory of this.coreDirectories) await Store.walk(this as unknown as Store<V, Constructor<V>>, directory);
		}

		await Store.walk(this as unknown as Store<V, Constructor<V>>);
		return this.size;
	}

	/**
	 * Resolves and deletes a Piece from this Store.
	 * @param name The name or instance to delete
	 */
	public delete(name: V | string): boolean {
		const piece = this.resolve(name);
		if (typeof piece === 'undefined') return false;
		return super.delete(piece.name);
	}

	/**
	 * Resolves a Piece from a string or instance.
	 * @param name The name or instance to resolve
	 */
	public resolve(name: V | string): V | undefined {
		if (name instanceof (this.holds as unknown as Function)) return name as V;
		return this.get(name as string);
	}

	/**
	 * Defines toString behavior of Stores.
	 */
	public toString(): string {
		return this.name;
	}

	/**
	 * Defines valueOf behavior of Stores.
	 */
	public valueOf(): string {
		return this.name;
	}

	/**
	 * Defines `JSON.stringify` behavior of Stores.
	 */
	public toJSON(): PieceJSON[] {
		return this.map((piece): PieceJSON => piece.toJSON());
	}

	public static get [Symbol.species](): CollectionConstructor {
		return Collection as unknown as CollectionConstructor;
	}

	/**
	 * Walks the directories of Pieces for user and core directories.
	 * @param store The Store to load Pieces into
	 * @param directory The directory to find Pieces from
	 */
	private static async walk<V extends Piece, T extends Store<V>>(store: T, directory: string = store.userDirectory): Promise<V[]> {
		const files = await scan(directory, {
			filter: (stats, path): boolean => stats.isFile() && extname(path) === '.js'
		})
			.catch((): void => {
				if (store.client.options.createPiecesFolders) ensureDir(directory).catch((err): boolean => store.client.emit('error', err));
			});
		if (!files) return [];

		return Promise.all([...files.keys()].map((file) => store.load(directory, relative(directory, file).split(sep))));
	}

}
