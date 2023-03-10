import {
    AbstractTransactPlugin,
    Action,
    Name,
    NameType,
    prependAction,
    PrivateKey,
    PrivateKeyType,
    SigningRequest,
    Struct,
    TransactContext,
    TransactHookTypes,
} from '@wharfkit/session'

interface ResourceProviderCosignerOptions {
    readonly actor: NameType
    readonly permission: NameType
    readonly privateKey: PrivateKeyType
    readonly contract?: NameType
    readonly action?: NameType
}

class noop extends Struct {
    static abiName = 'noop'
    static abiFields = []
}

export class TransactPluginCosigner extends AbstractTransactPlugin {
    public id = 'transact-plugin-cosigner'
    readonly actor: Name
    readonly permission: Name
    readonly privateKey: PrivateKey
    readonly contract: Name = Name.from('greymassnoop')
    readonly action: Name = Name.from('noop')

    constructor(options: ResourceProviderCosignerOptions) {
        super()
        this.actor = Name.from(options.actor)
        this.permission = Name.from(options.permission)
        this.privateKey = PrivateKey.from(options.privateKey)
        if (options.contract) {
            this.contract = Name.from(options.contract)
        }
        if (options.action) {
            this.action = Name.from(options.action)
        }
    }

    register(context: TransactContext): void {
        context.addHook(TransactHookTypes.beforeSign, async (request, context) => {
            // Modify request data to prepend noop action
            const modifiedRequest = await this.prependAction(request)
            // Sign Transaction
            const resolved = await context.resolve(modifiedRequest)
            const signature = this.privateKey.signDigest(
                resolved.transaction.signingDigest(request.getChainId())
            )
            // Create a new request that is a 'Transaction' and not an 'Action[]' array.
            const newRequest = await context.createRequest({
                transaction: resolved.transaction,
            })
            // Return modified request and new signature
            return {
                request: newRequest,
                signatures: [signature],
            }
        })
    }

    async prependAction(request: SigningRequest): Promise<SigningRequest> {
        // Create noop action to assume resource costs
        const newAction = Action.from({
            account: this.contract,
            name: this.action,
            authorization: [
                {
                    actor: this.actor,
                    permission: this.permission,
                },
            ],
            data: noop.from({}),
        })

        // Prepend this action to the request
        const newRequest = prependAction(request, newAction)
        // Return the modified request
        return newRequest
    }
}
