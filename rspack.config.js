import {defineConfig} from '@rspack/cli';

import * as path from "node:path";
import {fileURLToPath} from 'url';
import {dirname} from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
    entry: {
        main: './src/index.tsx',
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        alias: {},
        tsConfig: path.resolve(__dirname, './tsconfig.json'),
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'builtin:swc-loader',
                exclude: [/node_modules/],
                options: {
                    jsc: {
                        parser: {
                            syntax: 'typescript',
                        },
                    },
                },
                type: 'javascript/auto',
            },
            {
                test: /\.tsx$/,
                loader: 'builtin:swc-loader',
                exclude: [/node_modules/],
                options: {
                    jsc: {
                        parser: {
                            syntax: 'typescript',
                            tsx: true,
                        },
                    },
                },
                type: 'javascript/auto',
            },
        ],
    },
});