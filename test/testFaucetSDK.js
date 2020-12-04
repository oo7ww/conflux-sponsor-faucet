const {Conflux} = require('js-conflux-sdk');
const config = require('./config.js').config;
const {gasTotalLimit, collateralTotalLimit, gasBound, storageBound, value, upperBound,
       generalGasTotalLimit, generalCollateralTotalLimit, generalGasBound, generalStorageBound,
       generalValue, generalUpperBound
} = config.info;
const fs = require('fs');
const program = require('commander');
const BigNumber = require('bignumber.js');
const Web3 = require('web3');
const w3 = new Web3();
const cfx = new Conflux({url: config.cfx_testnet});
const internalContract = require('../build/contracts/SponsorWhitelistControl.json');
const AdminControl = require('../build/contracts/AdminControl.json');
const testFaucet = require('../build/contracts/testFaucet.json');
const dappN = require('../build/contracts/dappN.json');
const Faucet = require('../faucet.js');

const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
const internal_contractAddr = '0x0888000000000000000000000000000000000001';
const smallKey = '0x0000000000000000000000000000000000000000';
const largeKey = '0x0000000000000000000000000000000000000001';

const internal_contract = cfx.Contract({
    abi: internalContract.abi,
    address: internal_contractAddr,
});

async function waitForReceipt(hash) {
  for (;;) {
      let res = await cfx.getTransactionReceipt(hash);
      if (res != null) {
        if (
          res.stateRoot !==
          '0x0000000000000000000000000000000000000000000000000000000000000000'
        ) {
          return res;
        }
      }
      await sleep(30000);
    }
}

const price = 1;
const admin_contract_addr = '0x0888000000000000000000000000000000000000';

//let owner = cfx.Account(config.cfx_owner);
//let new_owner = cfx.Account(config.cfx_user);
let new_owner = cfx.wallet.addPrivateKey(config.cfx_user);
let zero = cfx.wallet.addPrivateKey(config.cfx_testUser);
//let oneCFX = cfx.wallet.addPrivateKey(config.cfx_user); 
let testUser = cfx.wallet.addPrivateKey(config.test_wcfx);
let wcfx = cfx.wallet.addPrivateKey(config.wcfx);
let faucet_owner = new_owner;
//= cfx.Account(config.faucet_owner);

async function deploy() {
    let receipt;
    let nonce = Number(await cfx.getNextNonce(new_owner.address));

    //deploy faucet 
    console.log('deploy faucet');
    let faucet = cfx.Contract({
        abi: config.faucet_contract.abi,
        bytecode: config.faucet_contract.bytecode,
    });
    let tx_hash = await faucet
        .constructor(
            [
                gasTotalLimit,
                collateralTotalLimit,
                gasBound,
                storageBound,
                upperBound ],
            [   
                6*generalGasTotalLimit,
                6*generalCollateralTotalLimit,
                6*generalGasBound,
                6*generalStorageBound,
                6*generalUpperBound ]
        )
        .sendTransaction({
            from: new_owner,
            nonce: nonce,
            price: price,
        });
    receipt = await waitForReceipt(tx_hash);
    if(receipt.outcomeStatus !== 0) throw new Error('faucet deploy failed!');
    let faucet_addr = receipt.contractCreated;
    console.log('faucet contract address: ', faucet_addr);
    faucet = cfx.Contract({
        abi: config.faucet_contract.abi,
        address: faucet_addr,
    })
    nonce++;
    
    
    //deploy dapp
    console.log('deploy dapp'); 
    let dapp = cfx.Contract({
        abi: config.dapp_contract.abi,
        bytecode: config.dapp_contract.bytecode,
    })

    tx_hash = await dapp
        .constructor('0x0000000000000000000000000000000000000000')
        .sendTransaction({
            from: new_owner,
            nonce: nonce,
        });
    receipt = await waitForReceipt(tx_hash);
    if(receipt.outcomeStatus !== 0) throw new Error('dapp deploy failed!');
    let dapp_addr1 = receipt.contractCreated;
    console.log('test dapp 1 contract address: ', dapp_addr1);
    let dapp1 = cfx.Contract({
        abi: config.dapp_contract.abi,
        address: dapp_addr1,
    });
    nonce++;

    tx_hash = await dapp
        .constructor('0x0000000000000000000000000000000000000000')
        .sendTransaction({
            from: new_owner,
            nonce: nonce,
        });
    receipt = await waitForReceipt(tx_hash);
    if(receipt.outcomeStatus !== 0) throw new Error('dapp deploy failed!');
    let dapp_addr2 = receipt.contractCreated;
    console.log('test dapp 2 contract address: ', dapp_addr2);
    let dapp2 = cfx.Contract({
        abi: config.dapp_contract.abi,
        address: dapp_addr2,
    });
    nonce++;

    tx_hash = await dapp
        .constructor('0x0000000000000000000000000000000000000000')
        .sendTransaction({
            from: new_owner,
            nonce: nonce,
        });
    receipt = await waitForReceipt(tx_hash);
    if(receipt.outcomeStatus !== 0) throw new Error('dapp deploy failed!');
    let dapp_addr3 = receipt.contractCreated;
    console.log('test dapp 3 contract address: ', dapp_addr3);
    let dapp3 = cfx.Contract({
        abi: config.dapp_contract.abi,
        address: dapp_addr3,
    });
    nonce++;
    
    /*
    let res = {}
    res.faucet_address = faucet_addr;
    res.dapp_1 = dapp_addr1;
    res.dapp_2 = dapp_addr2;
    res.dapp_3 = dapp_addr3;
    fs.writeFileSync(
        __dirname + '/address.json',
        JSON.stringify(res),
    );
    */
    
    //sponsor first send cfx
    console.log('send cfx to faucet');
    tx_hash = await cfx.sendTransaction({
        from: new_owner,
        to: faucet_addr,
        gas: 21040,
        nonce: nonce,
        gasPrice: 1,
        value: value,
    });
    receipt = await waitForReceipt(tx_hash);
    if(receipt.outcomeStatus !== 0) throw new Error('init sponsor failed!');
    nonce++;

    let faucet_balance = Number(await cfx.getBalance(faucet_addr));
    console.log('faucet current balance: ', faucet_balance);
    let addr_config = JSON.parse(fs.readFileSync("./address.json"));
    let lastAddress = addr_config.faucet_address;
    
    let old_dapp1 = addr_config.dapp_1;
    let old_dapp2 = addr_config.dapp_2;
    let old_dapp3 = addr_config.dapp_3;

    let FaucetSDK =  new Faucet.Faucet(config.cfx_testnet, faucet_addr, lastAddress);

    /*
    console.log('test replace condition: replace gasSponsor');
    tx_hash = await internal_contract.setSponsorForGas(
        old_dapp3,
        6*generalUpperBound
    ).sendTransaction({
        from: new_owner,
        nonce: nonce,
        gasPrice: price,
        value: 6*generalGasBound
    });
    receipt = await waitForReceipt(tx_hash);
    console.log('internal_sponsor old_dapp3:', tx_hash);
    if(receipt.outcomeStatus !== 0) throw new Error('internal sponsor old_dapp3 failed!');
    nonce++;

    sponsorInfo = await cfx.getSponsorInfo(old_dapp3);
    console.log(sponsorInfo);
    */

    //add dapp2 to large contracts list
    console.log('add dapp2 to large contracts list');
    tx_hash = await faucet.addLargeContracts([dapp_addr2])
        .sendTransaction({
            from: new_owner,
            gas: 1000000,
            nonce: nonce,
            gasPrice: price,
        });
    receipt = await waitForReceipt(tx_hash);
    if(receipt.outcomeStatus !== 0) throw new Error('add large contracts failed!');
    nonce++;
    
    //check if dapp2 in large_contracts
    let flag = await faucet.isLargeContract(dapp_addr2).call();
    console.log('dapp2 isLargeContract:', flag);

    //add dapp3 to custom contracts list
    console.log('add dapp3 to custom contracts list');
    tx_hash = await faucet.addCustomContracts(dapp_addr3, [
            2*generalGasTotalLimit,
            2*generalCollateralTotalLimit,
            2*generalGasBound,
            2*generalStorageBound,
            2*generalUpperBound
        ])
        .sendTransaction({
            from: new_owner,
            gas: 1000000,
            nonce: nonce,
            gasPrice: price, 
        });
    receipt = await waitForReceipt(tx_hash);
    if(receipt.outcomeStatus !== 0) throw new Error('add custom contracts failed!');
    nonce++;
    
    flag = await faucet.isCustomContract(dapp_addr3).call();
    console.log('dapp3 isCustomContract:', flag);
    let faucetParams = await faucet.getBounds(dapp_addr3).call();
    console.log('dapp3 params: ', faucetParams);
    
    
    //check dapp without history
    console.log('check dapp without sponsorship history');
    let r = await FaucetSDK.checkAppliable(dapp_addr1);
    console.log(r);
    r = await FaucetSDK.checkAppliable(dapp_addr2);
    console.log(r);
    r = await FaucetSDK.checkAppliable(dapp_addr3);
    console.log(r);

    //dapp1
    //Dapp Dev apply and check getMethod by sdk 
    console.log('check if appliable for dapp1');
    let isAppliable = await cfx.call({
        to: faucet_addr,
        data: faucet.isAppliable(dapp_addr1).data,
    });
    console.log('isApplialbe cfx_call return: ', isAppliable);
    let dappBoundsInfo = await FaucetSDK.getFaucetParams(dapp_addr1);
    console.log('dapp1 bounds:', dappBoundsInfo);
    console.log('apply dapp1 to faucet');
    let rawTx = await FaucetSDK.apply(dapp_addr1);
    tx_hash = await cfx
        .sendTransaction({
            from: new_owner,
            to: faucet_addr,
            gas: rawTx.gas,
            nonce: nonce,
            gasPrice: price,
            data: rawTx.data,
        });
    receipt = await waitForReceipt(tx_hash);
    if(receipt.outcomeStatus !== 0) throw new Error('dapp1 apply failed!');
    nonce++;
    dappBoundsInfo = await FaucetSDK.getFaucetParams(dapp_addr1);
    console.log('dapp1 bounds:', dappBoundsInfo);

    //dapp2 
    console.log('check appliable for dapp2 ');
    isAppliable = await faucet.isAppliable(dapp_addr2).call();
    console.log('dapp2 isAppliable: ', isAppliable);
    dappBoundsInfo = await FaucetSDK.getFaucetParams(dapp_addr2);
    console.log('dapp2 bounds:', dappBoundsInfo);
    console.log('apply dapp2 to faucet');
    rawTx = await FaucetSDK.apply(dapp_addr2);
    tx_hash = await cfx
        .sendTransaction({
            from: new_owner,
            to: faucet_addr,
            gas: rawTx.gas,
            nonce: nonce,
            gasPrice: price,
            data: rawTx.data,
        });
    receipt = await waitForReceipt(tx_hash);
    if(receipt.outcomeStatus !== 0) throw new Error('dapp2 apply failed!');
    nonce++;
    dappBoundsInfo = await FaucetSDK.getFaucetParams(dapp_addr2);
    console.log('dapp2 bounds:', dappBoundsInfo);

    //dapp3
    console.log('check appliable for dapp3 ');
    isAppliable = await faucet.isAppliable(dapp_addr3).call();
    console.log('dapp3 isAppliable: ', isAppliable);
    dappBoundsInfo = await FaucetSDK.getFaucetParams(dapp_addr3);
    console.log('dapp3 bounds:', dappBoundsInfo);
    console.log('apply dapp3 to faucet');
    rawTx = await FaucetSDK.apply(dapp_addr3);
    tx_hash = await cfx
        .sendTransaction({
            from: new_owner,
            to: faucet_addr,
            gas: rawTx.gas,
            nonce: nonce,
            gasPrice: price,
            data: rawTx.data,
        });receipt = await waitForReceipt(tx_hash);
    if(receipt.outcomeStatus !== 0) throw new Error('dapp3 apply failed!');
    nonce++;
    dappBoundsInfo = await FaucetSDK.getFaucetParams(dapp_addr3);
    console.log('dapp3 bounds:', dappBoundsInfo);

    //check dapp with sponsorship history
    console.log('check dapp with sponsorship history');
    r = await FaucetSDK.checkAppliable(old_dapp1);
    console.log(r);
    r = await FaucetSDK.checkAppliable(old_dapp2);
    console.log(r);
    r = await FaucetSDK.checkAppliable(old_dapp3);
    console.log(r);

    /*
    console.log('apply old_dapp1 to faucet');
    rawTx = await FaucetSDK.apply(old_dapp1);
    try {
        tx_hash = await cfx
            .sendTransaction({
                from: new_owner,
                to: faucet_addr,
                gas: rawTx.gas,
                nonce: nonce,
                gasPrice: price,
                data: rawTx.data,
            });
        receipt = await waitForReceipt(tx_hash);
        console.log('old_dapp1 apply tx_hash: ', tx_hash);
        if(receipt.outcomeStatus !== 0) throw new Error('old_dapp1 apply failed!');
        nonce++;
    } catch (e){
        console.error(e);
    }
    */
    console.log('add old_dapp1 to large contracts list');
    tx_hash = await faucet.addLargeContracts([old_dapp1])
        .sendTransaction({
            from: new_owner,
            gas: 1000000,
            nonce: nonce,
            gasPrice: price,
        });
    receipt = await waitForReceipt(tx_hash);
    if(receipt.outcomeStatus !== 0) throw new Error('add large contracts failed!');
    nonce++;
    
    r = await FaucetSDK.checkAppliable(old_dapp1);
    console.log(r);
    console.log('apply old_dapp1 to faucet');
    rawTx = await FaucetSDK.apply(old_dapp1);
    try {
        tx_hash = await cfx
            .sendTransaction({
                from: new_owner,
                to: faucet_addr,
                gas: rawTx.gas,
                nonce: nonce,
                gasPrice: price,
                data: rawTx.data,
            });
        receipt = await waitForReceipt(tx_hash);
        console.log('old_dapp3 apply tx_hash: ', tx_hash);
        if(receipt.outcomeStatus !== 0) throw new Error('old_dapp1 apply failed!');
        nonce++;
    } catch (e){
        console.error(e);
    }

    let sponsorInfo = await cfx.getSponsorInfo(old_dapp1);
    console.log(sponsorInfo);
    
}

async function withdraw(address) {
    let receipt;
    let tx_hash;
    let nonce = Number(await cfx.getNextNonce(faucet_owner.address));
    let balance = await cfx.getBalance(address);
    console.log('faucet current balance: ', balance);
    
    let faucet = cfx.Contract({
        abi: config.faucet_contract.abi,
        address: address,
    });

    let contractOwner = await faucet.owner().call();
    console.log('contract owner is: ', contractOwner);
    
    //let val = w3.utils.toHex(balance);
    tx_hash = await faucet.withdraw(faucet_owner, balance)
        .sendTransaction({
            from: faucet_owner,
            //gas: 1000000,
            nonce: nonce,
            //gasPrice: 1,
        });
    receipt = await waitForReceipt(tx_hash);
    console.log(receipt);
    if(receipt.outcomeStatus !== 0) throw new Error('withdraw failed!');
}

program
  .option('-t, --ut', 'unit test for faucet')
  .option('-w, --address [type]', 'withdraw from faucet')
  .parse(process.argv);

if(program.ut) {
    deploy();
}

if(program.address) {
    console.log(program.address);
    withdraw(program.address);
}