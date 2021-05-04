import React, { Component } from "react";
import HappyChefContract from "./contracts/HappyChef.json";
import getWeb3 from "./getWeb3";

import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import CardDeck from 'react-bootstrap/CardDeck';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';


import "./App.css";


class App extends Component {
  state = { storageValue: 0, web3: null, accounts: null, contract: null };

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

      // Callback when account is changed in Metamask
      window.ethereum.on('accountsChanged', accounts => {
          console.log(`Accounts updated ${accounts}`);
          this.setState({ accounts: accounts });
      });

      window.ethereum.on('chainChanged', networkId => {
          console.log(`Network updated ${networkId}`);
      });

      this.setState({ web3, accounts, contract: instance }, this.populate);
    } catch (error) {
      alert(`Failed to load web3, accounts, or contract. Check console for details.`,);
      console.error(error);
    }
  };

  populate = async () => {
    const { accounts, contract } = this.state;

    console.log('CALL getNbPools()');
    const nbPools = await contract.methods.getNbPools().call();
    console.log('nbPools = ' + nbPools);
   
    this.setState({ nbPools: nbPools });
  };

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }



    return (
      <div>
        <Navbar bg="light">
          <Navbar.Brand className="brand">
            <img src="images/happy.png" alt="Happy" height="30" className="d-inline-block align-top" />
            { ' ' } Happy Staking
          </Navbar.Brand>
          <Navbar.Collapse className="justify-content-end">
              <Button variant="outline-primary">Connect</Button>
          </Navbar.Collapse>
        </Navbar>

        <Container>
            <CardDeck style={{ padding: '16px' }}>
              <Card style={{ width: '18rem' }}>
                <Card.Body>
                  <Card.Title><img className="coin" src="images/dai-coin.svg" />DAI staking</Card.Title>
                  <Card.Text>
                    APR: XX.XX %<br />
                    Earn: HAPPY
                  </Card.Text>
                  <Card.Link><Button variant="primary">Unlock</Button></Card.Link>
                  <Card.Link><Button variant="primary">Stake</Button></Card.Link>
                  <Card.Link><Button variant="primary">Unstake</Button></Card.Link>
                </Card.Body>
                <Card.Footer>
                  <small className="text-muted">Total Liquidity: XXX,XXX,XXX</small>
                </Card.Footer>
              </Card>
              <Card style={{ width: '18rem' }}>
                <Card.Body>
                  <Card.Title><img className="coin" src="images/usdc-coin.svg" />USDC staking</Card.Title>
                  <Card.Text>
                    APR: XX.XX %<br />
                    Earn: HAPPY
                  </Card.Text>
                  <Card.Link><Button variant="primary">Unlock</Button></Card.Link>
                  <Card.Link><Button variant="primary">Stake</Button></Card.Link>
                </Card.Body>
                <Card.Footer>
                  <small className="text-muted">Total Liquidity: XXX,XXX,XXX</small>
                </Card.Footer>
              </Card>
              <Card style={{ width: '18rem' }}>
                <Card.Body>
                  <Card.Title><img className="coin" src="images/usdt-coin.svg" />USDT staking</Card.Title>
                  <Card.Text>
                    APR: XX.XX %<br />
                    Earn: HAPPY
                  </Card.Text>
                  <Card.Link><Button variant="primary">Unlock</Button></Card.Link>
                  <Card.Link><Button variant="primary">Stake</Button></Card.Link>
                </Card.Body>
                <Card.Footer>
                  <small className="text-muted">Total Liquidity: XXX,XXX,XXX</small>
                </Card.Footer>
              </Card>
            </CardDeck>
        </Container>
      </div>
    );
  }
}

export default App;
