import { TonClient } from '@ton/ton';
import { Address, toNano } from '@ton/core';
import { BlumJetton } from './../src/contracts/BlumJetton';

const tonClient = new TonClient({
    endpoint: 'https://toncenter.com/api/v2/jsonRPC',
    // apiKey: 'your_api_key',
});

const blumJettonAddress = Address.parse('EQCmF9eJucr_iW5Xpk9Au7l-jtRWRCOxTmNESSlbJ7F-8IdI');

const blumJettonProvider = tonClient.open(BlumJetton.createFromAddress(blumJettonAddress));

async function main() {
    const JettonData = await blumJettonProvider.getJettonData();
    console.log(JettonData);

    // get blum jetton wallet address for user
    const userAddress = Address.parse('UQD1KZNlg7m-8ymJqNKSA15nmc2ftTS1kyUlSuGonqr0bFas');
    const userJettonWalletAddress = await blumJettonProvider.getWalletAddress(userAddress);
    console.log(userJettonWalletAddress);

    const CoinPrice = await blumJettonProvider.getCoinPrice();
    console.log(CoinPrice);

    const BclData = await blumJettonProvider.getBclData();
    console.log(BclData);

    const CoinsForTons = await blumJettonProvider.getCoinsForTons(toNano("1"));
    console.log(CoinsForTons);

    const TonsForCoins = await blumJettonProvider.getTonsForCoins(toNano("1"));
    console.log(TonsForCoins);
}

main().catch(console.error);