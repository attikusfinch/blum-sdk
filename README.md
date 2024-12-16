# 🌸 [Blum](https://t.me/blum) Mempad SDK

## High-level Overview of Trading on Blum
After token deployment, it immediately becomes tradable using a bonding curve. Once the hardcap (currently set at 1500 TON) is reached, liquidity is automatically deposited into the Stonfi V2 pool and bounding curve trading locked

There are 2 phases in the Blum Jetton lifecycle:
1. Bonding Curve:
  - During this phase, the token is tradable using the bonding curve formula.
  - Users can buy and sell tokens.

2. DEX (Stonfi V2):
  - The smart contract adds liquidity to the Stonfi V2 pool and locks trading via the bonding curve.

## Features
- SDK for Blum Mempad smart-contract interactions

## Installation
```bash
npm install @fiscaldev/blum-sdk
```

### Examples of using can be found in folder /examples

❤️ Made by [@fiscaldev](https://t.me/fiscaldev)
