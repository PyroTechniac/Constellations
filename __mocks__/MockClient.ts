import { Client, ConstellationClientOptions, Gateway } from '../src';
import { MockProvider } from './MockProvider';
import { MockStringSerializer } from './MockStringSerializer';
import { MockNumberSerializer } from './MockNumberSerializer';
import { MockObjectSerializer } from './MockObjectSerializer';
import { MockLanguage } from './MockLanguage';

export class MockClient extends Client {
	public constructor(options: ConstellationClientOptions = {}) {
		super(options);

		this.reset();
	}

	public reset(): void {
		this.serializers.clear();
		this.providers.clear();
		this.languages.clear();
		this.gateways.clear();
		this.serializers.add(new MockStringSerializer(this.serializers, ['lib', 'MockStringSerializer'], 'dist'));
		this.serializers.add(new MockNumberSerializer(this.serializers, ['lib', 'MockNumberSerializer'], 'dist'));
		this.serializers.add(new MockObjectSerializer(this.serializers, ['lib', 'MockObjectSerializer'], 'dist'));
		this.providers.add(new MockProvider(this.providers, ['lib', 'MockProvider'], 'dist', { name: 'Mock' }));
		this.languages.add(new MockLanguage(this.languages, ['lib', 'MockLanguage'], 'dist'));
		this.gateways
			.register(new Gateway(this, 'clientStorage', { provider: 'Mock' }))
			.register(new Gateway(this, 'guilds', { provider: 'Mock' }))
			.register(new Gateway(this, 'users', { provider: 'Mock' }));
	}
}

export const client = new MockClient();