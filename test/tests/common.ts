import {assert} from 'chai'
import {mockFetch} from '$test/utils/mock-fetch'
import {ResourceProviderCosignerPlugin} from '../../src/index'

import {PrivateKey, Session, SessionOptions, WalletPluginPrivateKey} from '@wharfkit/session'

const wallet = new WalletPluginPrivateKey({
    privateKey: PrivateKey.from('5Jtoxgny5tT7NiNFp1MLogviuPJ9NniWjnU4wKzaX4t7pL4kJ8s'),
})

const mockSessionOptions: SessionOptions = {
    chain: {
        id: '73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d',
        url: 'https://jungle4.greymass.com',
    },
    fetch: mockFetch,
    permissionLevel: 'wharfkit1111@test',
    transactPlugins: [
        new ResourceProviderCosignerPlugin({
            actor: 'wharfkitnoop',
            permission: 'cosign',
            privateKey: '5JfFWg1CWsNTeXTWMyfChXXbyD31TCTknSVGwXDSpT6bPxKYLMM',
        }),
    ],
    walletPlugin: wallet,
}

suite('cosigner', function () {
    test('prepends action and signs transaction', async function () {
        const session = new Session(mockSessionOptions)
        const action = {
            authorization: [
                {
                    actor: 'wharfkit1111',
                    permission: 'test',
                },
            ],
            account: 'eosio.token',
            name: 'transfer',
            data: {
                from: 'wharfkit1111',
                to: 'wharfkittest',
                quantity: '0.0001 EOS',
                memo: 'wharfkit cosign plugin test',
            },
        }
        const result = await session.transact({
            action,
        })
        assert.equal(result.transaction?.actions.length, 2)
        assert.equal(result.signatures.length, 2)
        assert.equal(
            result.response?.transaction_id,
            'f87fef83dba6ca8c754a5f473ee3234c0a58bee149c20b855ae3cddb5dfd7730'
        )
    })
})
