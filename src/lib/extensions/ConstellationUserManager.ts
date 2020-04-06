import {UserManager} from 'discord.js';
import { ConstellationUser } from './ConstellationUser';

export class ConstellationUserManager extends UserManager {

	/**
	 * Fetches a user and syncs their settings.
	 * @param id The ID of the user
	 * @param cache Whether or not this user should be cached
	 */
	public async fetch(id: string, cache?: boolean): Promise<ConstellationUser> {
		const user = await super.fetch(id, cache);
		await user.settings.sync();
		return user;
	}
}