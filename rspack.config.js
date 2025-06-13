import {defineConfig} from '@rspack/cli';

import * as path from "node:path";
import {fileURLToPath} from 'url';
import {dirname} from 'path';
import HtmlRspackPlugin from "html-rspack-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
    entry: {
        web: './src/web/index.tsx',
        extension: './src/extension/index.tsx',
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
            {
                test: /\.png$/,
                type: 'asset',
            },
        ],
    },
    plugins: [new HtmlRspackPlugin({
        excludeChunks: ['extension'],
        title: "USCIS JSON Explainer",
        templateContent: `
            <!DOCTYPE html>
            <html>
              <head>
              <meta charset="utf-8" />
<!--                <link rel="icon" type="image/svg+xml" href="/vite.svg" />-->
                <meta name="viewport" content="initial-scale=1, width=device-width" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
                <link
                  rel="stylesheet"
                  href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
                />
                <title><%= htmlRspackPlugin.options.title %></title>
              </head>
              <body>
                <div id="root"></div>
              </body>
            </html>
        `,
    })],
});