# EthPool - Smart Contract Challenge

## 1. Considerations

1. The user rewards not auto increment in user's pool.
2. The user can withdraw only the rewards to restake them.
3. Minimum deposit of 10.000 wei based on basis point (percentage) calculation.

<br />

---

## 2. How to compile and test:

```bash
  npm install
  npm run compile
  npm run test
```

<br />

---

## 3. How to deploy to Rinkey network

- Copy .env.example to .env
- Edit .env file adding:
  - alchemy api key to RINKEBY_URL
  - PRIVATE_KEY

After compile and test execute the following command:

```bash
  npm run deploy
```

<br />

---

## 4. Deployed Contract Address to Rinkeby

Address: 0xe0be86d7e544d6D7D007f21C543Da1ce4F6bF748

Verified in Etherscan: https://rinkeby.etherscan.io/address/0xe0be86d7e544d6D7D007f21C543Da1ce4F6bF748#code

<br />

---

## 5. Run script to get total amount of ETH held in the contract

Replace the deployed contract address to .env file in DEPLOYED_CONTRACT_ADDRESS, then run the command:

```bash
  npm run get-contract-eth
```

<br />

---

## 6. Verify the contract in Etherscan

To verify deployed contract update .env file with etherscan api key in variable ETHERSCAN_KEY, then run the following command:

```bash
  npx hardhat verify CONTRACT_ADDRESS --network rinkeby
```
