import { platform } from 'os';

const windows = platform() === 'win32';
/* istanbul ignore next */
export const lineEndings = windows ? '\r\n' : '\n';
