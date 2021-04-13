import React, { Component } from "react";
import MyTokenJson from "./contracts/MyToken.json";
import MyTokenSaleJson from "./contracts/MyTokenSale.json";
import KycContractJson from "./contracts/KycContract.json";
import getWeb3 from "./getWeb3";

import "./App.css";

class App extends Component {
  state = { loaded:false, kycAddress: "0x123...", tokenSaleAddress: null, userTokens:0 };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      this.web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      this.accounts = await this.web3.eth.getAccounts();

      // Get the contract instance.
      //this.networkId = await this.web3.eth.net.getId(); <<- this doesn't work with MetaMask cuz something
      this.networkId = await this.web3.eth.getChainId();  

      this.myToken  = new this.web3.eth.Contract(
        MyTokenJson.abi,
        MyTokenJson.networks[this.networkId] && MyTokenJson.networks[this.networkId].address,
      );

      this.myTokenSale = new this.web3.eth.Contract(
        MyTokenSaleJson.abi,
        MyTokenSaleJson.networks[this.networkId] && MyTokenSaleJson.networks[this.networkId].address,
      );

      this.kycContract = new this.web3.eth.Contract(
        KycContractJson.abi,
        KycContractJson.networks[this.networkId] && KycContractJson.networks[this.networkId].address,
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.listenToTokenTransfer();
      this.setState({ loaded:true, tokenSaleAddress:MyTokenSaleJson.networks[this.networkId].address}, this.updateUserTokens);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  updateUserTokens = async () => {
    let userTokens = await this.myToken.methods.balanceOf(this.accounts[0]).call();
    this.setState({userTokens: userTokens});
  }

  listenToTokenTransfer = () => {
    this.myToken.events.Transfer({to: this.accounts[0]}).on("data", this.updateUserTokens);
  }

  handleBuyTokens = async () => {
    await this.myTokenSale.methods.buyTokens(this.accounts[0]).send({from: this.accounts[0], value: this.web3.utils.toWei("1", "wei")});
  }

  handleInputChange = (event) => {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;
    this.setState({
      [name]: value
    });
  }

  handleKycWhitelisting = async () => {
    await this.kycContract.methods.setKycCompleted(this.state.kycAddress).send({from: this.accounts[0]});
    alert("KYC for "+this.state.kycAddress+" is completed");
  }

  render() {
    if (!this.state.loaded) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <h1>CafeFreei Cappucino Token Sale</h1>
        <p>Get your Tokens today!</p>
        <h2>Kyc Whitelisting</h2>
        Address to allow: <input type="text" name="kycAddress" value={this.state.kycAddress}  onChange={this.handleInputChange} />
        <button type="buttom" onClick={this.handleKycWhitelisting} >Add to Whitelist</button>
        <h2>Buy Tokens, they are limited in number</h2>
        <p>If you want to buy tokens, send Wei to this address: {this.state.tokenSaleAddress}</p>
        <p>You currently have: {this.state.userTokens} CAPPU Tokens</p>
        <button type="button" onClick={this.handleBuyTokens}>Buy more tokens</button>
      </div>
    );
  }
}

export default App;
