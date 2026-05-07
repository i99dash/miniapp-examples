# I99DASH Miniapp Examples

Reference miniapps built with the [`i99dash`](https://www.npmjs.com/package/i99dash) SDK.

This repo is the home for apps scaffolded by the `i99dash` CLI and curated examples that ship alongside the SDK.

## Examples

| Example | Description |
|---|---|
| [`adb-helper-style`](./adb-helper-style) | ADB helper-style miniapp |
| [`cluster-hello-world`](./cluster-hello-world) | Minimal cluster miniapp |
| [`cluster-remote`](./cluster-remote) | Remote cluster integration |
| [`dash-wallpaper`](./dash-wallpaper) | Dashboard wallpaper miniapp |
| [`nextjs-example`](./nextjs-example) | Next.js-based miniapp |
| [`pkg-launcher`](./pkg-launcher) | Package launcher miniapp |

## Getting started

Each example is self-contained. Inside an example folder:

```bash
pnpm install
pnpm dev
```

Refer to the per-example `README.md` for specifics.

## Creating a new miniapp

Use the SDK CLI:

```bash
npx i99dash create my-app
```

New apps live under this folder.

## Links

- SDK source: <https://github.com/i99dash/i99dash-sdk>
- npm package: <https://www.npmjs.com/package/i99dash>
