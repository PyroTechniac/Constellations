import { Structures, User } from 'discord.js';
import type { Settings } from '../settings/structures/Settings';
import type { Gateway } from '../settings/gateway/Gateway';

export class ConstellationUser extends Structures.get('User') {

	/**
	 * The user level settings for this context (user || default)
	 */
	public settings: Settings = (this.client.gateways.get('users') as Gateway).acquire(this);

	/**
	 * Overrides `JSON.stringify` behavior of ConstellationUser.
	 */
	public toJSON(): object {
		return { ...super.toJSON(), settings: this.settings.toJSON() };
	}
}

Structures.extend('User', (): typeof User => ConstellationUser);