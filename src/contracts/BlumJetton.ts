import { toNano, beginCell, TupleBuilder, Address, Cell, ExternalAddress } from '@ton/core';

class BlumJetton {
    static BUY = 0xaf750d34;
    static SELL = 0x742b36d8;

    address: Address;

    constructor(address: Address) {
        this.address = address;
    }

    static createFromAddress(address: Address): BlumJetton {
        return new BlumJetton(address);
    }

    async getJettonData(provider: any): Promise<{
        ctxTotalSupply: bigint;
        mintable: bigint;
        ctxAdmin: Address | ExternalAddress | null;
        ctxContent: any;
        ctxWalletCode: any;
    }> {
        const source = (await provider.get('get_jetton_data')).stack;

        const ctxTotalSupply = source.pop().value as bigint;
        const mintable = source.pop().value as bigint;
        const ctxAdminCell = source.pop().cell as Cell;

        const ctxAdmin = ctxAdminCell.asSlice().loadAddressAny();
        const ctxContent = source.pop();
        const ctxWalletCode = source.pop();

        return {
            ctxTotalSupply,
            mintable,
            ctxAdmin,
            ctxContent,
            ctxWalletCode,
        };
    }

    async getWalletAddress(provider: any, ownerAddress: Address): Promise<{ jettonOwnerAddress: Address | ExternalAddress | null }> {
        const builder = new TupleBuilder();
        builder.writeAddress(ownerAddress);

        const source = (await provider.get('get_wallet_address', builder.build())).stack;
        const ownerAddressCell = source.pop().cell as Cell;

        const jettonOwnerAddress = ownerAddressCell.asSlice().loadAddressAny();

        return {
            jettonOwnerAddress
        };
    }

    async getCoinPrice(provider: any): Promise<{ coinPrice: bigint }> {
        const source = (await provider.get('coin_price')).stack;

        const coinPrice = source.pop().value as bigint;

        return {
            coinPrice,
        };
    }

    async getCoinsForTons(provider: any, tons: bigint, checkTradingState = true): Promise<{ fees: bigint; coins: bigint }> {
        const tradingState = await this.getTradingState(provider);
        if (!tradingState.tradingEnabled && checkTradingState) {
            throw new Error('Trading is disabled');
        }

        const builder = new TupleBuilder();
        builder.writeNumber(tons);

        const source = (await provider.get('coins_for_tons', builder.build())).stack;

        const fees = source.pop().value as bigint;
        const coins = source.pop().value as bigint;

        return {
            fees,
            coins,
        };
    }

    async getTonsForCoins(provider: any, coins: bigint, checkTradingState = true): Promise<{ fees: bigint; tons: bigint }> {
        const tradingState = await this.getTradingState(provider);
        if (!tradingState.tradingEnabled && checkTradingState) {
            throw new Error('Trading is disabled');
        }

        const builder = new TupleBuilder();
        builder.writeNumber(coins);

        const source = (await provider.get('tons_for_coins', builder.build())).stack;

        const fees = source.pop().value as bigint;
        const tons = source.pop().value as bigint;

        return {
            fees,
            tons,
        };
    }

    async getBclData(provider: any): Promise<any> {
        const source = (await provider.get('get_bcl_data')).stack;

        return {
            ctxTotalSupply: source.readBigNumber(),
            ctxBclSupply: source.readBigNumber(),
            ctxLiqSupply: source.readBigNumber(),
            ctxAdmin: source.readAddressOpt(),
            ctxAuthorAddress: source.readAddressOpt(),
            ctxContent: source.readCellOpt(),
            ctxFeeAddress: source.readAddressOpt(),
            ctxTradeFeeNumerator: source.readBigNumber(),
            ctxTradeFeeDenominator: source.readBigNumber(),
            ctxTtl: source.readBigNumber(),
            ctxLastTradeDate: source.readBigNumber(),
            ctxTradingEnabled: source.readBigNumber(),
            ctxTonLiqCollected: source.readBigNumber(),
            ctxReferral: source.readCellOpt(),
            ctxTradingCloseFee: source.readBigNumber(),
            fullPriceTonNeed: source.readBigNumber(),
            fullPriceTonFees: source.readBigNumber(),
            ctxRouterAddress: source.readAddressOpt(),
            ctxRouterPtonWalletAddress: source.readAddressOpt(),
        };
    }

    async getTradingState(provider: any): Promise<{ tradingEnabled: boolean }> {
        /**
         *
         * Returns trading state, which indicates whether trading is enabled or not
         *  
         */
        const bclData = await this.getBclData(provider);

        const tradingEnabled = bclData.ctxTradingEnabled === 1n;

        return {
            tradingEnabled,
        };
    }

    async createBuyJetton(provider: any, options: {
        tonAmount: bigint;
        limit: bigint;
        queryId?: number;
        referral?: Cell | null;
        buyerAddress?: Address | null;
        checkTradingState?: boolean;
    }): Promise<{ to: Address; value: bigint; body: Cell }> {
        const { tonAmount, limit, queryId = 0, referral = null, buyerAddress = null, checkTradingState = true } = options;

        if (tonAmount < toNano("0.05")) {
            throw new Error('Minimum amount must be > 0.05 TON');
        }

        if (checkTradingState) {
            const tradingState = await this.getTradingState(provider);
            if (!tradingState.tradingEnabled) {
                throw new Error('Trading is disabled');
            }
        }

        let body = beginCell()
            .storeUint(BlumJetton.BUY, 32)
            .storeUint(queryId, 64)
            .storeCoins(limit)
            .storeMaybeRef(referral);

        if (buyerAddress) {
            body.storeAddress(buyerAddress);
        }

        return {
            to: this.address,
            value: tonAmount,
            body: body.endCell(),
        };
    }
}

export { BlumJetton };
