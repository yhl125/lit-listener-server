# lit-listener-server
lit-listener-server is NestJs server for automate transaction with Lit Protocol PKP using [lit-listener-sdk](https://github.com/yhl125/lit-listener-sdk)

swagger: https://lit-listener-server-demo.iampocket.com/api#/

## Run server
1. copy .env.example to .env
2. Run Mongodb
```bash
docker run -d -p 27017:27017 mongo
```
3. `yarn` to install the required dependencies
4. `yarn start` to start the server

## Run server with docker-compose
1. copy .env.example to .env
2. Run Mongodb
```bash
docker run -d -p 27017:27017 mongo
```
3. `docker-compose up` to start the server

## forentend example with lit-listener-server
[frontend example](https://demo-app.iampocket.com/lit-listener) using this server to run a simple automated transaction

[frontend source code](https://github.com/yhl125/iampocket-wallet/blob/develop/src/components/lit-listener/CreateCircuit.tsx)

```typescript
  function viemCircuit() {
    const transactionAction: IViemTransactionAction = {
      chain: {
        chainId: chainId,
        customChain: false,
      },
      transport: {
        type: 'http',
      },
      to: '0x0000000000000000000000000000000000000000',
      value: 100,
      type: 'viem',
    };

    const webhookCondition: IWebhookCondition = {
      url: 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
      responsePath: 'ethereum.usd',
      expectedValue: 1600,
      matchOperator: '>',
      interval: 10000,
      type: 'webhook',
    };

    const body = {
      name: 'string',
      description: 'string',
      litNetwork: 'cayenne',
      pkpPubKey: currentPKP!.publicKey,
      conditions: [webhookCondition],
      conditionalLogic: { type: 'EVERY' },
      options: { maxLitActionCompletions: 2 },
      actions: [transactionAction],
      sessionSigs: sessionSigs,
    };

    fetch(serverUrl + 'circuit-viem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }
```