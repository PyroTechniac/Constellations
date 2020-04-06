import Collection from '@discordjs/collection';
import { Store } from './Store';
import type { AliasPiece } from './AliasPiece';
import type { Constructor } from '../../util/SharedTypes';

/**
 * The common base for all Stores with aliases.
 */
export class AliasStore<V extends AliasPiece, VConstructor = Constructor<V>> extends Store<V, VConstructor> {

	/**
	 * The different aliases that represent the Pieces in this Store.
	 */
	public aliases: Collection<string, V> = new Collection();

	/**
	 * Identical to [Map.get()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/get).
	 * Gets an element with the specified key or alias, and returns it's value, or `undefined` if the element does not exist.
	 * @param name
	 */
	public get(name: string): V | undefined {
		return super.get(name) || this.aliases.get(name);
	}

	/**
	 * Identical to [Map.has()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/has).
	 * Checks if an element exists with the specified key or alias.
	 */
	public has(name: string): boolean {
		return super.has(name) || this.aliases.has(name);
	}

	/**
	 * Identical to {@link Store.add}, also registers aliases.
	 */
	public add(piece: V): V {
		const aliasPiece = super.add(piece);
		for (const alias of aliasPiece.aliases) this.aliases.set(alias, aliasPiece);
		return aliasPiece;
	}

	public delete(piece: string | V): boolean {
		const resolved = this.resolve(piece);
		if (typeof resolved === 'undefined') return false;
		for (const alias of resolved.aliases) this.aliases.delete(alias);
		return super.delete(resolved);
	}

	public clear(): void {
		super.clear();
		this.aliases.clear();
	}

}
