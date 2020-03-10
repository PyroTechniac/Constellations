// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
const { getPromiseDetails } = process.binding('util');

/**
 * The class for deep checking types
 */
export class Type {
    public value: unknown;

    public is: string;
}