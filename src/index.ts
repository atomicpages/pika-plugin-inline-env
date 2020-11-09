import * as fs from 'fs';
import * as path from 'path';

import { BuilderOptions as PikaBuilderOptions } from '@pika/types';
import { envExists, normalizeEnv, getVarName, getType } from './utils';

type BuilderOptions = Omit<PikaBuilderOptions, 'options'> & {
    options: {
        /**
         * An array of environment variables to replace.
         */
        env?: string[];

        /**
         * Set true to enable debug mode.
         * Set to `trace` to see full stack traces.
         */
        debug?: boolean | 'trace';

        /**
         * Set the file encoding.
         */
        encoding?: BufferEncoding;

        /**
         * Fail-fast if variable replacement fails,
         * otherwise print a warning to the console.
         */
        bail?: boolean;

        /**
         * Specify the file to read from and write to.
         */
        file?: string;
    };
};

export async function build({ out, options = {}, reporter }: BuilderOptions): Promise<void> {
    const opts: BuilderOptions['options'] = {
        encoding: 'utf-8',
        file: 'index.js',
        ...options,
    };

    const write = path.join(out, 'dist-src', opts.file);

    try {
        let file = fs.readFileSync(write, opts.encoding).toString();

        if (options.env) {
            options.env.forEach(env => {
                if (envExists(env)) {
                    const name = normalizeEnv(env);

                    if (file.includes(name)) {
                        let value: any = process.env[getVarName(name)];

                        switch (getType(value)) {
                            case 'boolean':
                                value = value.toLowerCase() === 'true';
                                break;
                            case 'number':
                                value = parseFloat(value);
                                break;
                            default:
                                value = `"${value}"`;
                        }

                        file = file.replace(name, value);
                    }
                } else {
                    const msg = `Environment variable '${env}' does not exists on node process`;

                    if (opts.bail) {
                        throw new Error(msg);
                    }

                    reporter.warning(msg);
                }
            });

            fs.writeFileSync(write, file, { encoding: opts.encoding });
        }

        reporter.created(write, 'module');
    } catch (e) {
        if (options.debug) {
            console.error(options.debug === 'trace' ? e : e.message);
        }

        process.exit(1);
    }
}

export const VERSION = process.env.VERSION;
