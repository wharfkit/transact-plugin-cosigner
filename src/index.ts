import {
    ABIDef,
    AbiProvider,
    AbstractTransactPlugin,
    Action,
    Name,
    NameType,
    PrivateKey,
    PrivateKeyType,
    SigningRequest,
    Struct,
    TransactContext,
    TransactHookTypes,
    Transaction,
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
            // Modify request to prepend noop action
            const modifiedRequest = await this.prependAction(request, context)
            // Sign Transaction
            const transaction = modifiedRequest.getRawTransaction()
            const signature = this.privateKey.signDigest(
                transaction.signingDigest(request.getChainId())
            )
            // Return modified request and new signature
            return {
                request: modifiedRequest,
                signatures: [signature],
            }
        })
    }

    async prependAction(
        request: SigningRequest,
        context: TransactContext
    ): Promise<SigningRequest> {
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

        // Resolve the current request into a fully formed transaction w/ tapos
        const info = await context.client.v1.chain.get_info()
        const header = info.getTransactionHeader()
        const newTransaction = Transaction.from({
            ...header,
            actions: [newAction, ...request.getRawActions()],
        })

        // Create a new request based on this full transaction
        const newRequest = await SigningRequest.create(
            {transaction: newTransaction},
            context.esrOptions
        )

        // Return the modified request
        return newRequest
    }
}
