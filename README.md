# @wharfkit/resource-provider-cosigner-plugin

Automatically cosign transactions to assume resource costs using a noop action.

## Installation

```bash
yarn install @wharfkit/resource-provider-cosigner-plugin
```

## Usage

Include this `transactPlugin` in your Wharf Session Kit instance and specify the relevant information.

```js
const session = new Session({
    chain: {
        id: '73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d',
        url: 'https://jungle4.greymass.com',
    },
    permissionLevel: 'wharfkit1111@test',
    transactPlugins: [
        new ResourceProviderCosignerPlugin({
            actor: 'wharfkitnoop',
            permission: 'cosign',
            privateKey: '5JfFWg1CWsNTeXTWMyfChXXbyD31TCTknSVGwXDSpT6bPxKYLMM',
            // Optional parameters
            // contract: 'greymassnoop', // The noop contract name
            // action: 'noop', // The noop contract action
        }),
    ],
    walletPlugin: wallet,
})
```

Any transaction initiated with this session will automatically prepend a `greymassnoop:noop` action and sign it using the permissions specified for the `ResourceProviderCosignerPlugin`.

## Developing

You need [Make](https://www.gnu.org/software/make/), [node.js](https://nodejs.org/en/) and [yarn](https://classic.yarnpkg.com/en/docs/install) installed.

Clone the repository and run `make` to checkout all dependencies and build the project. See the [Makefile](./Makefile) for other useful targets. Before submitting a pull request make sure to run `make lint`.

---

Made with ☕️ & ❤️ by [Greymass](https://greymass.com), if you find this useful please consider [supporting us](https://greymass.com/support-us).
