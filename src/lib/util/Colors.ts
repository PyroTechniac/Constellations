export interface ColorsFormatOptions {

	/**
	 * The format for the background
	 */
	background?: string;

	/**
	 * The style or styles to apply
	 */
	style?: string | string[];

	/**
	 * The format for the text
	 */
	text?: string;
}

/** @internal */
export type ColorsFormatType = string | number | [string, string, string] | [number, number, number];

export interface ColorsFormatData {

	/**
	 * The opening format data styles
	 */
	opening: string[];

	/**
	 * The closing format data styles
	 */
	closing: string[];
}

/**
 * The Colors class that manages the colors displayed in the console.
 */
export class Colors {

	/**
	 * The opening tags
	 */
	public opening: string;

	/**
	 * The closing tags
	 */
	public closing: string;

	/**
	 * @param options The options for this format
	 */
	public constructor(options: ColorsFormatOptions = {}) {
		const { opening, closing } = Colors.text(options.text, Colors.background(options.background, Colors.style(options.style)));

		this.opening = Colors.useColors ? `\u001B[${opening.join(';')}m` : '';
		this.closing = Colors.useColors ? `\u001B[${closing.join(';')}m` : '';
	}

	/**
	 * Format a string.
	 * @param str The string to format
	 */
	public format(str: string): string {
		return `${this.opening}${str}${this.closing}`;
	}

	public static useColors: boolean | null = null;

	/**
	 * Apply the style.
	 * @param styles The style or styles to apply
	 * @param data The data
	 */
	private static style(styles?: string | string[], data: Partial<ColorsFormatData> = {}): ColorsFormatData {
		const { opening = [], closing = [] } = data;
		if (styles) {
			if (!Array.isArray(styles)) styles = [styles];
			for (let style of styles) {
				style = style.toLowerCase();
				if (!(style in this.STYLES)) continue;
				opening.push(this.STYLES[style as unknown as number].toString());
				closing.push(this.CLOSE[style as unknown as number].toString());
			}
		}

		return { opening, closing };
	}

	/**
	 * Apply the background.
	 * @param background The background to apply
	 * @param data The data
	 */
	private static background(background?: string, data: Partial<ColorsFormatData> = {}): ColorsFormatData {
		const { opening = [], closing = [] } = data;

		if (background && background.toLowerCase() in this.BACKGROUNDS) {
			opening.push(this.BACKGROUNDS[background.toLowerCase() as unknown as number].toString());
			closing.push(this.CLOSE.background.toString());
		}

		return { opening, closing };
	}

	/**
	 * Apply the text format.
	 * @param text The text format to apply
	 * @param data The data
	 */
	private static text(text?: string, data: Partial<ColorsFormatData> = {}): ColorsFormatData {
		const { opening = [], closing = [] } = data;
		if (text && text.toLowerCase() in this.TEXTS) {
			opening.push(this.TEXTS[text.toLowerCase() as unknown as number].toString());
			closing.push(this.CLOSE.text.toString());
		}

		return { opening, closing };
	}

}

export namespace Colors { // eslint-disable-line @typescript-eslint/no-namespace, no-redeclare

	/**
	 * The close codes
	 * @internal
	 */
	export enum CLOSE {
		normal,
		bold = 22,
		dim = 22,
		italic,
		underline,
		inverse = 27,
		hidden,
		strikethrough,
		text = 39,
		background = 49
	}

	/**
	 * The style codes
	 * @internal
	 */
	export enum STYLES {
		normal,
		bold,
		dim,
		italic,
		underline,
		inverse = 7,
		hidden,
		strikethrough
	}

	/**
	 * The text codes
	 * @internal
	 */
	export enum TEXTS {
		black = 30,
		red,
		green,
		yellow,
		blue,
		magenta,
		cyan,
		lightgray,
		lightgrey = 37,
		gray = 90,
		grey = 90,
		lightred,
		lightgreen,
		lightyellow,
		lightblue,
		lightmagenta,
		lightcyan,
		white
	}

	/**
	 * The background codes
	 * @internal
	 */
	export enum BACKGROUNDS {
		black = 40,
		red,
		green,
		yellow,
		blue,
		magenta,
		cyan,
		gray,
		grey = 47,
		lightgray = 100,
		lightgrey = 100,
		lightred,
		lightgreen,
		lightyellow,
		lightblue,
		lightmagenta,
		lightcyan,
		white
	}
}
