import { Store } from "./base/Store";
import { Language } from "./Language";
import type { Constructor } from "../util/SharedTypes";
import type { ConstellationClient } from '../Client';

export class LanguageStore extends Store<Language> {
	public constructor(client: ConstellationClient) {
		super(client, 'languages', Language as unknown as Constructor<Language>);
	}

	public get default(): Language | null {
		return this.get(this.client.options.language) || null;
	}
}