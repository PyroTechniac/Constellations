import { Piece, PieceOptions } from "./base/Piece";
import { join } from "path";
import { pathExists } from "fs-nextra";
import { Constructor } from "../util/SharedTypes";
import { isClass, mergeDefault } from "../util/Utils";

export abstract class Language extends Piece {

	public abstract language: Record<string, string | string | ((...args: any[]) => string | string[])>;

	public get<T = string, A extends readonly unknown[] = readonly unknown[]>(term: string, ...args: A): T {
		if (!this.enabled && this !== this.client.languages.default) return this.client.languages.default!.get(term, ...args);
		const value = this.language[term];
		/* eslint-disable new-cap */
		switch (typeof value) {
			case 'function': return value(...args) as unknown as T;
			case 'undefined':
				if (this === this.client.languages.default) return (this.language.DEFAULT as (...args: any[]) => string)(term) as unknown as T;
				// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
				// @ts-ignore
				return `${this.language.DEFAULT(term)}\n\n**${this.language.DEFAULT_LANGUAGE}:**\n${this.store.default.get(term, ...args)}`;
			default: return value as unknown as T;
		}
	}

	public async init(): Promise<void> {
		for (const core of this.store.coreDirectories) {
			const loc = join(core, ...this.file);
			if (this.directory !== core && await pathExists(loc)) {
				try {
					const CorePiece = ((req): Constructor<Language> => req.default || req)(require(loc));
					if (!isClass(CorePiece)) return;
					const coreLang = new CorePiece(this.store, this.file, core);
					this.language = mergeDefault(coreLang.language, this.language);
				} catch {
					return;
				}
			}
		}
		return;
	}
}

export interface LanguageOptions extends PieceOptions { }