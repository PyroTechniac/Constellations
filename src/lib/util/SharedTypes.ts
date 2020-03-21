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
export interface _DeepRequiredArray<T> extends Array<DeepRequired<NonUndefined<T>>> { }

/** @internal */
export type _DeepRequiredObject<T> = {
	[P in keyof T]-?: DeepRequired<NonUndefined<T[P]>>;
}