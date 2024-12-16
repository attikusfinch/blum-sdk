import { beginCell, toNano, Address, Cell, SendMode } from '@ton/core';

class BlumJettonWallet {
    static TRANSFER = 0xf8a7ea5;
    static TRANSFER_NOTIFICATION = 0x7362d09c;
    static INTERNAL_TRANSFER = 0x178d4519;
    static BURN = 0x595f07bc;
    static EXCESSES = 0xd53276db;
    static SELL = 0x742b36d8;

    address: Address;

    constructor(address: Address) {
        this.address = address;
    }

    static createFromAddress(address: Address): BlumJettonWallet {
        return new BlumJettonWallet(address);
    }

    async createTransfer(value: bigint, options: {
        queryId?: number;
        amount: bigint;
        destination: Address;
        responseAddress: Address;
        customPayload?: Cell | null;
        forwardAmount?: bigint;
        forwardPayload?: Cell | null;
    }): Promise<{ to: Address; value: bigint; body: Cell }> {
        const { queryId, amount, destination, responseAddress, customPayload, forwardAmount, forwardPayload } = options;

        return {
            to: this.address,
            value: value,
            body: beginCell()
                .storeUint(BlumJettonWallet.TRANSFER, 32)
                .storeUint(queryId ?? 0, 64)
                .storeCoins(amount)
                .storeAddress(destination)
                .storeAddress(responseAddress)
                .storeMaybeRef(customPayload ?? null)
                .storeCoins(forwardAmount ?? 0n)
                .storeMaybeRef(forwardPayload ?? null)
                .endCell(),
        };
    }

    async sendTransfer(provider: any, via: Address, value: bigint, options: {
        queryId?: number;
        amount: bigint;
        destination: Address;
        responseAddress: Address;
        customPayload?: Cell | null;
        forwardAmount?: bigint;
        forwardPayload?: Cell | null;
    }): Promise<void> {
        const { queryId, amount, destination, responseAddress, customPayload, forwardAmount, forwardPayload } = options;

        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(BlumJettonWallet.TRANSFER, 32)
                .storeUint(queryId ?? 0, 64)
                .storeCoins(amount)
                .storeAddress(destination)
                .storeAddress(responseAddress)
                .storeMaybeRef(customPayload ?? null)
                .storeCoins(forwardAmount ?? 0n)
                .storeMaybeRef(forwardPayload ?? null)
                .endCell(),
        });
    }

    async createSell(options: {
        queryId?: number;
        amount: bigint;
        minReceive: bigint;
        fee: bigint;
        referral?: Cell | null;
        value?: bigint;
    }): Promise<{ to: Address; value: bigint; body: Cell }> {
        const { queryId, amount, minReceive, fee, referral = null, value = toNano("0.06") } = options;

        return {
            to: this.address,
            value: value + fee,
            body: beginCell()
                .storeUint(BlumJettonWallet.SELL, 32)
                .storeUint(queryId ?? 0, 64)
                .storeCoins(amount)
                .storeCoins(minReceive)
                .storeMaybeRef(referral)
                .endCell(),
        };
    }

    async createBurn(value: bigint, options: {
        queryId?: number;
        amount: bigint;
        ownerAddress: Address;
        responseAddress: Address;
    }): Promise<{ to: Address; value: bigint; body: Cell }> {
        const { queryId, amount, ownerAddress, responseAddress } = options;

        return {
            to: this.address,
            value: value,
            body: beginCell()
                .storeUint(BlumJettonWallet.BURN, 32)
                .storeUint(queryId ?? 0, 64)
                .storeCoins(amount)
                .storeAddress(ownerAddress)
                .storeAddress(responseAddress)
                .endCell(),
        };
    }

    async sendBurn(provider: any, via: Address, value: bigint, options: {
        queryId?: number;
        amount: bigint;
        ownerAddress: Address;
        responseAddress: Address;
    }): Promise<void> {
        const { queryId, amount, ownerAddress, responseAddress } = options;

        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(BlumJettonWallet.BURN, 32)
                .storeUint(queryId ?? 0, 64)
                .storeCoins(amount)
                .storeAddress(ownerAddress)
                .storeAddress(responseAddress)
                .endCell(),
        });
    }

    async getWalletData(provider: any): Promise<{
        balance: bigint;
        ownerAddress: Address;
        minterAddress: Address;
        walletCode: Cell;
    }> {
        const result = await provider.get('get_wallet_data', []);
        const balance = result.stack.readBigNumber();
        const ownerAddress = result.stack.readAddress();
        const minterAddress = result.stack.readAddress();
        const walletCode = result.stack.readCell();

        return {
            balance,
            ownerAddress,
            minterAddress,
            walletCode,
        };
    }

    async getBalance(provider: any): Promise<bigint> {
        const { balance } = await this.getWalletData(provider);
        return balance;
    }
}

export { BlumJettonWallet };
