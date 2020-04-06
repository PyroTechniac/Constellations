import type { ConstellationClient } from "../Client";

/**
 * Exclude undefined from set `A`
 */
export type NonUndefined<A> = A extends undefined ? never : A;

/**
 * Required type that works for nested structures
 */
export type DeepRequired<T> = T extends (...args: any[]) => any
	? T
	: T extends any[]
		? _DeepRequiredArray<T[number]>
		: T extends object
			? _DeepRequiredObject<T>
			: T

/** @internal */
export type _DeepRequiredArray<T> = Array<DeepRequired<NonUndefined<T>>>

/** @internal */
export type _DeepRequiredObject<T> = {
	[P in keyof T]-?: DeepRequired<NonUndefined<T[P]>>;
}

/**
 * A constructor function
 * @typeparam C The class
 */
export interface Constructor<C> {
	new (...args: any[]): C;
	readonly prototype: C;
}

export interface MentionRegex {
	userOrMember: RegExp;
	channel: RegExp;
	emoji: RegExp;
	role: RegExp;
	snowflake: RegExp;
}

export type DeepReadonly<T extends object> = {
	readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
}

export type KeyedObject = Record<PropertyKey, unknown>;
export type ReadonlyKeyedObject = DeepReadonly<KeyedObject>;

export type ReadyMessage = string | ((client: ConstellationClient) => string);
