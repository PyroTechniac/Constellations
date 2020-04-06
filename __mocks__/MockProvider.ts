import { Provider, SettingsUpdateResults, mergeObjects } from '../src';

enum ErrorMessages {
	TableExists = 'Table Exists',
	TableNotExists = 'Table Not Exists',
	EntryExists = 'Entry Exists',
	EntryNotExists = 'Entry Not Exists'
}

export class MockProvider extends Provider {

	private tables = new Map<string, Map<string, object>>();

	public createTable(table: string): Promise<void> {
		return new Promise((resolve, reject): void => {
			if (this.tables.has(table)) return reject(new Error(ErrorMessages.TableExists));
			this.tables.set(table, new Map());
			resolve();
		})
	}

	public deleteTable(table: string): Promise<void> {
		return new Promise((resolve, reject): void => {
			if (!this.tables.has(table)) return reject(new Error(ErrorMessages.TableNotExists));
			this.tables.delete(table);
			resolve();
		});
	}

	public hasTable(table: string): Promise<boolean> {
		return Promise.resolve(this.tables.has(table));
	}

	public create(table: string, entry: string, data: object | SettingsUpdateResults): Promise<void> {
		return new Promise((resolve, reject): void => {
			const resolvedTable = this.tables.get(table);
			if (typeof resolvedTable === 'undefined') return reject(new Error(ErrorMessages.TableNotExists));
			if (resolvedTable.has(entry)) return reject(new Error(ErrorMessages.EntryExists));
			resolvedTable.set(entry, { ...this.parseUpdateInput(data), id: entry });
			resolve();
		})
	}

	public delete(table: string, entry: string): Promise<void> {
		return new Promise((resolve, reject): void => {
			const resolvedTable = this.tables.get(table);
			if (typeof resolvedTable === 'undefined') return reject(new Error(ErrorMessages.TableNotExists));
			if (!resolvedTable.has(entry)) return reject(new Error(ErrorMessages.EntryNotExists));
			resolvedTable.delete(entry);
			resolve();
		});
	}

	public get(table: string, entry: string): Promise<object | null> {
		return new Promise((resolve, reject): void => {
			const resolvedTable = this.tables.get(table);
			if (typeof resolvedTable === 'undefined') return reject(new Error(ErrorMessages.TableNotExists));
			resolve(resolvedTable.get(entry) ?? null);
		});
	}

	public getAll(table: string, entries?: readonly string[]): Promise<object[]> {
		return new Promise((resolve, reject): void => {
			const resolvedTable = this.tables.get(table);
			if (typeof resolvedTable === 'undefined') return reject(new Error(ErrorMessages.TableNotExists));

			if (typeof entries === 'undefined') {
				return resolve([...resolvedTable.values()]);
			}

			const values: object[] = [];
			for (const [key, value] of resolvedTable) {
				if (entries.includes(key)) values.push(value);
			}

			resolve(values);
		})
	}

	public getKeys(table: string): Promise<string[]> {
		return new Promise((resolve, reject): void => {
			const resolvedTable = this.tables.get(table);
			if (typeof resolvedTable === 'undefined') return reject(new Error(ErrorMessages.TableNotExists));
			resolve([...resolvedTable.keys()]);
		});
	}

	public has(table: string, entry: string): Promise<boolean> {
		return new Promise((resolve, reject): void => {
			const resolvedTable = this.tables.get(table);
			if (typeof resolvedTable === 'undefined') return reject(new Error(ErrorMessages.TableNotExists));
			resolve(resolvedTable.has(entry));
		});
	}

	public update(table: string, entry: string, data: object | SettingsUpdateResults): Promise<void> {
		return new Promise((resolve, reject): void => {
			const resolvedTable = this.tables.get(table);
			if (typeof resolvedTable === 'undefined') return reject(new Error(ErrorMessages.TableNotExists));

			const resolvedEntry = resolvedTable.get(entry);
			if (typeof resolvedEntry === 'undefined') return reject(new Error(ErrorMessages.EntryNotExists));

			resolvedTable.set(entry, mergeObjects({ ...resolvedEntry }, this.parseUpdateInput(data)));
			resolve();
		})
	}

	public replace(table: string, entry: string, data: object | SettingsUpdateResults): Promise<void> {
		return new Promise((resolve, reject): void => {
			const resolvedTable = this.tables.get(table);
			if (typeof resolvedTable === 'undefined') return reject(new Error(ErrorMessages.TableNotExists));

			const resolvedEntry = resolvedTable.get(entry);
			if (typeof resolvedEntry === 'undefined') return reject(new Error(ErrorMessages.EntryNotExists));

			resolvedTable.set(entry, { ...this.parseUpdateInput(data), id: entry });
			resolve();
		});
	}
}