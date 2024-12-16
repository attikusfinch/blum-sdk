import { TonClient, WalletContractV5R1, internal } from '@ton/ton';
import { Address, SendMode, toNano } from '@ton/core';
import { mnemonicToPrivateKey } from "@ton/crypto";
import { BlumJetton, BlumJettonWallet } from '../src';

interface BuyParams {
    tonClient: TonClient;
    jettonAddress: string;
    mnemonics: string[];
    tonAmount: string;
    slippage?: number;
}

interface SellParams {
    tonClient: TonClient;
    jettonAddress: string;
    mnemonics: string[];
    jettonAmount: string;
    slippage?: number;
}

export async function buy({ tonClient, jettonAddress, mnemonics, tonAmount, slippage = 20 }: BuyParams): Promise<bigint> {
    const keyPair = await mnemonicToPrivateKey(mnemonics);
    const wallet = tonClient.open(WalletContractV5R1.create({ workchain: 0, publicKey: keyPair.publicKey }));
    const sender = wallet.sender(keyPair.secretKey);

    const blumJetton = tonClient.open(BlumJetton.createFromAddress(Address.parse(jettonAddress)));

    const estimatedJettonData = await blumJetton.getCoinsForTons(toNano(tonAmount));

    const estimatedJettonAmount = estimatedJettonData.coins;
    const estimatedFee = estimatedJettonData.fees + toNano("0.05");

    const limit = estimatedJettonAmount * (BigInt(100) - BigInt(slippage)) / BigInt(100);

    const txParams = await blumJetton.createBuyJetton(sender, {
        tonAmount: toNano(tonAmount) + estimatedFee,
        limit: limit,
    });

    const tx = await wallet.createTransfer({
        seqno: await wallet.getSeqno(),
        secretKey: keyPair.secretKey,
        messages: [internal(txParams)],
        sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
    });

    await wallet.send(tx);

    return estimatedJettonAmount;
}

export async function sell({ tonClient, jettonAddress, mnemonics, jettonAmount, slippage = 20 }: SellParams): Promise<bigint> {
    const keyPair = await mnemonicToPrivateKey(mnemonics);
    const wallet = tonClient.open(WalletContractV5R1.create({ workchain: 0, publicKey: keyPair.publicKey }));

    const blumJetton = tonClient.open(BlumJetton.createFromAddress(Address.parse(jettonAddress)));
    const jettonWalletAddress = (await blumJetton.getWalletAddress(wallet.address)).jettonOwnerAddress;

    if (!jettonWalletAddress) {
        throw new Error('Failed to retrieve jetton wallet address');
    }

    const blumJettonWallet = tonClient.open(BlumJettonWallet.createFromAddress(Address.parse(jettonWalletAddress.toString())));

    const estimatedTonData = await blumJetton.getTonsForCoins(toNano(jettonAmount));

    const estimatedTonAmount = estimatedTonData.tons;
    const estimatedFee = estimatedTonData.fees;

    const limit = estimatedTonAmount * (BigInt(100) - BigInt(slippage)) / BigInt(100);

    const txParams = await blumJettonWallet.createSell({
        queryId: 0,
        amount: toNano(jettonAmount),
        minReceive: limit,
        fee: estimatedFee
    });

    const tx = await wallet.createTransfer({
        seqno: await wallet.getSeqno(),
        secretKey: keyPair.secretKey,
        messages: [internal(txParams)],
        sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
    });

    await wallet.send(tx);

    return estimatedTonAmount;
}

const tonClient = new TonClient({
    endpoint: 'https://toncenter.com/api/v2/jsonRPC',
    // apiKey: "your_api_key"
});

buy({
    tonClient,
    jettonAddress: 'EQCmF9eJucr_iW5Xpk9Au7l-jtRWRCOxTmNESSlbJ7F-8IdI',
    mnemonics: "".split(' '),
    tonAmount: '0.1',
}).then(console.log).catch(console.error);

sell({
    tonClient,
    jettonAddress: 'EQCmF9eJucr_iW5Xpk9Au7l-jtRWRCOxTmNESSlbJ7F-8IdI',
    mnemonics: "".split(' '),
    jettonAmount: '100000',
}).then(console.log).catch(console.error);
