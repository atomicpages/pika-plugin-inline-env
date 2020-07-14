# pika-plugin-inline-env

> Note: this plugin in intended to be used with `@pika/plugin-ts-standard-pkg`. If you're using `@pika/plugin-standard-pkg` see the section for how you can configure that pipeline.

A really simple, tiny pika plugin to inline `process.env` environment variables in `dist-src` so downstream builds don't become bloated with extra rollup plugins _or_ [custom solutions](https://github.com/atomicpages/pika-plugin-build-web).

## Motivation

Using the standard ts plugin from pika, there's no way to inline/inject environment variables in the source distribution. The specific use case I have in mind is where we want to surface version information to users of a library as an exported member. Considering the following:

```ts
// some other code...
export const VERSION = process.env.VERSION;
```

after `tsc` generates the bundle used by the node/web/umd builder, we're left with `dist-src/index.js` containing something like:

```ts
// some other code...
export const VERSION = process.env.VERSION;
```

There are two issues here:

1. App authors using bundlers like Webpack have no way of knowing the version of your library
2. If a UMD distribution exists for your library, rollup doesn't [replace the variable](https://rollupjs.org/repl/?version=2.21.0&shareable=JTdCJTIybW9kdWxlcyUyMiUzQSU1QiU3QiUyMm5hbWUlMjIlM0ElMjJtYWluLmpzJTIyJTJDJTIyY29kZSUyMiUzQSUyMmV4cG9ydCUyMGNvbnN0JTIwdiUyMCUzRCUyMHByb2Nlc3MuZW52LlZFUlNJT04lM0IlMjIlMkMlMjJpc0VudHJ5JTIyJTNBdHJ1ZSU3RCU1RCUyQyUyMm9wdGlvbnMlMjIlM0ElN0IlMjJmb3JtYXQlMjIlM0ElMjJ1bWQlMjIlMkMlMjJuYW1lJTIyJTNBJTIybXlCdW5kbGUlMjIlMkMlMjJhbWQlMjIlM0ElN0IlMjJpZCUyMiUzQSUyMiUyMiU3RCUyQyUyMmdsb2JhbHMlMjIlM0ElN0IlN0QlN0QlMkMlMjJleGFtcGxlJTIyJTNBbnVsbCU3RA==) for free

## How it Works

This plugin works by reading your `dist-src/index.js` file using [node fs](https://nodejs.org/api/fs.html), performing a simple search and replace and writing the file back to disk. All I/O operations are synchronous so make sure there are no other operations on the same file while the plugin is executing otherwise the file dat could become corrupt.

## Install

```sh
npm i @pika/pack pika-plugin-inline-env --save-dev
```

Note: `@pika/pack` is a peer dependencies -- you need to install this for this plugin to work.

## Usage

Note: All items under the `env` array are considered to live on `process.env` therefore you can omit `process.env` if you wish.

```json
{
    "name": "example-package-json",
    "version": "1.0.0",
    "@pika/pack": {
        "pipeline": [
            ["@pika/plugin-ts-standard-pkg"],
            [
                "pika-plugin-inline-env",
                {
                    "env": ["npm_package_version", "process.env.DEBUG"]
                }
            ]
        ]
    }
}
```

and to build:

```sh
DEBUG=false && npx pika build
```

> Tip: use [`cross-env`](https://www.npmjs.com/package/cross-env) to ensure this works on windows too
>
> ```sh
> cross-env MY_VERSION=1.2.3 && npx pika build
> ```

At the env of the build, we'll be left with a clean, inline environment variable in `dist-src/index.js`:

```js
// other code...
export const VERSION = "1.2.3";
```

For more information about `@pika/pack` &amp; help getting started, [check out the main project repo](https://github.com/pikapkg/pack).

## Options

All options are optional.

| Option       | Type                                                                                        | Default Value | Description                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------- |
| `"env"`      | string[]                                                                                    | []            | An array of env variables to replace. If it does not exist an empty string will be used instead |
| `"debug"`    | boolean \| 'trace'                                                                          | false         | Set true to enable debugging info on build failures                                             |
| `"encoding"` | [BufferEncoding](https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings) | 'utf-8'       | Override the file read and write encoding                                                       |
| `"bail"`     | boolean                                                                                     | false         | If an environment variable is missing, fail the build                                           |

## Using with  `@pika/plugin-standard-pkg`

This is not intended to be used with `@pika/plugin-standard-pkg`, use [`babel-plugin-transform-inline-environment-variables`](https://www.npmjs.com/package/babel-plugin-transform-inline-environment-variables) to inline environment variables using the standard packager.

## Gotchas

Passing environment variables from NPM scripts has some issues. Considering the following:

```json
{
    "scripts": {
        "build": "pika build",
        "pretest": "MY_VAR=1.2.3 npm run build",
        "test": "node test/assert.js"
    }
}
```

I suspect `npm run` is launched in a new child process. The solution is to place the env vars on the same line:

```diff
{
    "scripts": {
-        "build": "pika build",
+        "build": "MY_VAR=1.2.3 pika build",
-        "pretest": "MY_VAR=1.2.3 npm run build",
+        "pretest": "npm run build",
        "test": "node test/assert.js"
    }
}
```

or, [`cross-env-shell`](https://www.npmjs.com/package/cross-env#cross-env-vs-cross-env-shell) can be used:

```diff
{
    "scripts": {
-        "build": "pika build",
+        "build": "cross-env-shell pika build",
-        "pretest": "MY_VAR=1.2.3 npm run build",
+        "pretest": "cross-env MY_VAR=1.2.3 npm run build",
        "test": "node test/assert.js"
    }
}
```
