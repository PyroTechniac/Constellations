import { Piece, PieceOptions, PieceJSON } from './Piece';
import type { AliasStore } from './AliasStore';

export class AliasPiece extends Piece {

	public aliases: string[]
	public constructor(store: AliasStore<AliasPiece>, file: string[], directory: string, options: AliasPieceOptions = {}) {
		super(store, file, directory, options);

		this.aliases = options.aliases ?? [];
	}

	public toJSON(): AliasPieceJSON {
		return {
			...super.toJSON(),
			aliases: this.aliases.slice(0)
		};
	}

}

export interface AliasPieceOptions extends PieceOptions {
	aliases?: string[];
}

export interface AliasPieceJSON extends PieceJSON {
	aliases: string[];
}
