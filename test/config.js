const fs = require('fs');
const Web3 = require('web3');
const w3 = new Web3();
const BigNumber = require('bignumber.js');

const config = {
  cfx_tethys: 'http://main.confluxrpc.org',
  cfx_oceanus: 'http://18.182.200.167:12537',
  cfx_testnet: 'http://test.confluxrpc.org',
  //'http://testnet-jsonrpc.conflux-chain.org:12537',
  cfx_oceanus: 'http://mainnet-jsonrpc.conflux-chain.org:12537',
  faucet_contract: JSON.parse(
    fs.readFileSync(__dirname + '/../build/contracts/SponsorFaucet.json'),
  ),
  /*
  internal_contract: JSON.parse(
    fs.readFileSync(__dirname + '/../build/contracts/InternalContract.json'),
  ),
  */
  dapp_contract: JSON.parse(
    fs.readFileSync(__dirname + '/../build/contracts/DappN.json'),
  ),
  test_contract: JSON.parse(
    fs.readFileSync(__dirname + '/../build/contracts/Test.json'),
  ),

  info:{
      //small level
      gasTotalLimit: w3.utils.toHex(new BigNumber(10).multipliedBy(1e18)),
      collateralTotalLimit: w3.utils.toHex(new BigNumber(5000).multipliedBy(1e18)),
      //gasBound: w3.utils.toHex(new BigNumber(10).multipliedBy(1e18)),
      gasBound: w3.utils.toHex(new BigNumber(1).multipliedBy(1e18)),
      
      storageBound: w3.utils.toHex(new BigNumber(500).multipliedBy(1e18)),
      upperBound: w3.utils.toHex(new BigNumber(10).multipliedBy(1e9)),
      value: w3.utils.toHex(new BigNumber(50).multipliedBy(1e18)),

      //large level
      generalGasTotalLimit: w3.utils.toHex(new BigNumber(10).multipliedBy(1e18)), 
      generalCollateralTotalLimit: w3.utils.toHex(new BigNumber(10000).multipliedBy(1e18)), 
      generalGasBound: w3.utils.toHex(new BigNumber(1).multipliedBy(1e18)), 
      generalStorageBound: w3.utils.toHex(new BigNumber(1000).multipliedBy(1e18)),
      generalUpperBound: w3.utils.toHex(new BigNumber(10).multipliedBy(1e9)),
      generalValue: w3.utils.toHex(new BigNumber(1).multipliedBy(1e18)), 
  },
  cfx_user: '',
  cfx_zero: '',
  cfx_owner: '',
  cfx_testUser: '',
  test_wcfx: '',
  test_internal: '',
  wcfx: '',
  faucet_owner: '',
  faucet_newOwner: '',
  //'0x162788589c8E386863f217FAef78840919fB2854',
  //'0x1f5d900E581F6Bf1fe93313aBEa2919230841aD9',
  //'0x162788589c8E386863f217FAef78840919fB2854',
};

module.exports = {
  config: config,
};
