import type { Store } from './Store';
import type { ConstellationClient } from '../../Client';
import { mergeDefault } from '../../util/Utils';
import { join } from 'path';

/**
 * The common class for all pieces.
 */
export class Piece {

	/**
	 * The name of this Piece
	 */
	public name: string;

	/**
	 * The file location where this Piece is stored
	 */
	public file: string[];

	/**
	 * Whether this Piece is enabled or not
	 */
	public enabled: boolean;

	/**
	 * The directory this piece is held in
	 */
	public directory: string;

	/**
	 * The Store that's holding this Piece
	 */
	public readonly store!: Store<this>;

	/**
	 * @param store The store this Piece is for
	 * @param file The path from the pieces folder to the Piece file
	 * @param directory The base directory for the pieces folder
	 * @param options The options for this piece
	 */
	public constructor(store: Store<Piece>, file: string[], directory: string, options: PieceOptions = {}) {
		const defaults = store.client.options.pieceDefaults[store.name];
		if (defaults) options = mergeDefault(defaults, options);
		Object.defineProperty(this, 'store', { value: store });

		this.file = file;

		this.name = options.name ?? file[file.length - 1].slice(0, -3);

		this.enabled = Boolean(options.enabled);

		this.directory = directory;
	}

	/**
	 * The type of Constellation piece this is
	 */
	public get type(): string {
		return this.store.name.slice(0, -1);
	}

	/**
	 * The absolute path to this piece
	 */
	public get path(): string {
		return join(this.directory, ...this.file);
	}

	/**
	 * The client this Piece was instantiated with
	 */
	public get client(): ConstellationClient {
		return this.store.client;
	}

	/**
	 * Reloads this Piece.
	 */
	public async reload(): Promise<this> {
		const piece = this.store.load(this.directory, this.file);
		await piece.init();
		if (this.client.listenerCount('pieceReloaded')) this.client.emit('pieceReloaded', piece);
		return piece;
	}

	/**
	 * Unloads this Piece.
	 */
	public unload(): boolean {
		if (this.client.listenerCount('pieceUnloaded')) this.client.emit('pieceUnloaded', this);
		return this.store.delete(this);
	}

	/**
	 * Disables this Piece.
	 * @chainable
	 */
	public disable(): this {
		if (this.client.listenerCount('pieceDisabled')) this.client.emit('pieceDisabled', this);
		this.enabled = false;
		return this;
	}

	/**
	 * Enables this Piece.
	 * @chainable
	 */
	public enable(): this {
		if (this.client.listenerCount('pieceEnabled')) this.client.emit('pieceEnabled', this);
		this.enabled = true;
		return this;
	}

	/**
	 * The init method to be optionally overwritten in actual Pieces.
	 * @abstract
	 */
	public async init(): Promise<any> {
		// Optionally defined in extension Classes
	}

	/**
	 * Defines toString behavior for Pieces.
	 */
	public toString(): string {
		return this.name;
	}

	/**
	 * Defines `JSON.stringify` behavior for Pieces.
	 */
	public toJSON(): PieceJSON {
		return {
			directory: this.directory,
			file: this.file,
			name: this.name,
			type: this.type,
			enabled: this.enabled,
			path: this.path
		};
	}

}

export interface PieceOptions {
	name?: string;
	enabled?: boolean;
}

export interface PieceJSON {
	directory: string;
	file: string[];
	path: string;
	type: string;
	name: string;
	enabled: boolean;
}
