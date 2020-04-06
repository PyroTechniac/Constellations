import { AliasStore } from './base/AliasStore';
import { Serializer } from './Serializer';
import type { ConstellationClient } from '../Client';
import type { Constructor } from '../util/SharedTypes';

export class SerializerStore extends AliasStore<Serializer> {

	public constructor(client: ConstellationClient) {
		super(client, 'serializers', Serializer as unknown as Constructor<Serializer>);
	}

}
