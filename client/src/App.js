import React, { Component } from "react";
import HappyChefContract from "./contracts/HappyChef.json";
import HappyContract from "./contracts/Happy.json";
import ERC20Contract from "./contracts/ERC20.json";
import getWeb3 from "./getWeb3";

import Button from 'react-bootstrap/Button';
import CardDeck from 'react-bootstrap/CardDeck';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';

import Pool from './components/Pool';

import "./App.css";


class App extends Component {
  state = { web3: null, accounts: null, contract: null, pools: [], happyPrice: 1, happyBalance: 0 };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = HappyChefContract.networks[networkId];
      console.log('HappyChef address = ' + deployedNetwork.address);
      const instance = new web3.eth.Contract(
        HappyChefContract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      // Get the happy token contract instance.
      this.happy = new web3.eth.Contract(ERC20Contract.abi, HappyContract.networks[networkId].address);

      // Callback when account is changed in Metamask
      window.ethereum.on('accountsChanged', accounts => {
          console.log(`Accounts updated: ${accounts}`);
          window.location.reload();
      });

      window.ethereum.on('chainChanged', networkId => {
          console.log(`Network updated: ${networkId}`);
          window.location.reload();
      });

      web3.eth.subscribe('newBlockHeaders', (err, res) => {
        if (!err) {
          this.updateHappyPrice();
        }
      });

      this.setState({ web3: web3, accounts: accounts, contract: instance }, this.populate);
    } catch (error) {
      alert(`Failed to load web3, accounts, or contract. Check console for details.`,);
      console.error(error);
    }
  };


  updateHappyPrice = () => {
    this.state.contract.methods.getLastHappyPrice().call().then((res) => 
            this.setState({ happyPrice: this.state.web3.utils.fromWei(res, 'ether') }));
  }


  updateHappyBalance = () => {
    this.happy.methods.balanceOf(this.state.accounts[0]).call().then((balance) => {
      this.setState({ happyBalance: Number(this.state.web3.utils.fromWei(balance, 'ether')).toFixed(6) });
    });
  }


  populate = async () => {
    const { contract } = this.state;

    this.updateHappyBalance();
    this.updateHappyPrice();

    const nbPools = await contract.methods.getNbPools().call();
    var pools = Array.from({length: nbPools}, (_, i) => i)
   
    this.setState({ pools: pools });
  };


  setChildCallables = (callables) => {
    this.childCallables = callables;
  }


  ellipsis(s) {
    return s.substring(0, 6) + '...' + s.substring(s.length - 4, s.length);
  }


  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }

    return (
      <>
        <Navbar bg="light">
          <Navbar.Brand className="brand">
            <img src="images/happy.png" alt="Happy" height="30" className="d-inline-block align-top" />
            { ' ' } Happy Staking
          </Navbar.Brand>
          <Navbar className="justify-content-between">
            <Navbar.Text>
              HAPPY: $ { this.state.happyPrice }
            </Navbar.Text>
          </Navbar>
          <Navbar.Collapse className="justify-content-end">
            <Button variant="outline-subtle">{ this.state.happyBalance } HAPPY</Button>
            <Button variant="outline-primary">{ this.state.accounts ? this.ellipsis(this.state.accounts[0]) : 'Connect' }</Button>
          </Navbar.Collapse>
        </Navbar>

        <Container>
            <CardDeck style={{ padding: '16px' }}>
              { this.state.pools.map(pool => (
                <Pool web3={this.state.web3} contract={this.state.contract} account={this.state.accounts[0]} 
                  updateHappyBalance={this.updateHappyBalance}
                  id={pool} key={pool} />
              ))}
            </CardDeck>
        </Container>
      </>
    );
  }
}

export default App;
