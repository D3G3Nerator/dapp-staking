import React, { Component } from 'react';

import PropTypes from 'prop-types';

import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';

import ERC20Contract from "../contracts/ERC20.json";


class Pool extends Component {

    constructor(props) {
        super(props);

        this.id = this.props.id;
        this.web3 = this.props.web3;
        this.contract = this.props.contract;
        this.account = this.props.account;
        this.updateHappyBalance = this.props.updateHappyBalance;

        this.state = {
            yield: 0,
            price: 0,

            claim: 0,
            poolBalance: 0,
            userBalance: 0,
            unlocked: false,

            token: null,
            tokenBalance: 0,
            icon: null,

            deposit: 0,
            depositShow: false,

            withdraw: 0,
            withdrawShow: false
        };
    }

    
    async componentDidMount() {
        this.pool = await this.contract.methods.pools(this.id).call();
        this.setState({ yield: this.pool.yield / 100 });
        this.updatePrices();

        // Get the pool token contract instance.
        this.token = new this.web3.eth.Contract(ERC20Contract.abi, this.pool.token);
        this.token.methods.symbol().call().then((token) => {
            this.setState({ token: token, icon: 'images/' + token.toLowerCase() + '-coin.svg' });
        });
        this.token.methods.allowance(this.account, this.contract._address).call().then((remaining) => this.setState({ unlocked: Number(remaining) !== 0 }));

        this.contract.methods.pendingReward(this.id, this.account).call().then((reward) => this.setState({ claim: reward }));
        this.updatePoolBalance();
        this.updateUserBalance();

        this.web3.eth.subscribe('newBlockHeaders', (err, res) => {
            if (!err) {
                this.onNewBlock(res);
            }
        });
    }


    onNewBlock = async (block) => {
        this.updatePrices();
    }


    updatePrices = () => {
        this.contract.methods.pendingReward(this.id, this.account).call().then((reward) => {
            this.setState({ claim:  Number(this.web3.utils.fromWei(reward)).toFixed(6) });
        });
        this.contract.methods.getLastPrice(this.id).call().then((price) => {      
            this.setState({ price: Number(this.web3.utils.fromWei(price)) }); 
        });
    }


    updatePoolBalance = () => {
        this.contract.methods.getPoolBalance(this.id).call().then((balance) => {
            this.setState({ poolBalance: Number(this.web3.utils.fromWei(balance)).toFixed(2) });
        });
    }


    updateUserBalance = () => {
        this.contract.methods.getUserBalance(this.id, this.account).call().then((balance) => {            
            this.setState({ userBalance: Number(this.web3.utils.fromWei(balance)) });
        });
    }


    onUnlock = async () => {
        this.setState({ unlockLoading: true });        
        this.token.methods.approve(this.contract._address, -1).send({ from: this.account }).then((res) => {
            this.setState({ unlocked: res.status === true, unlockLoading: false });
        });        
    }


    onDeposit = async () => {
        const balance = await this.token.methods.balanceOf(this.account).call();
        this.setState({ depositShow: true, depositLoading: true, tokenBalance: this.web3.utils.fromWei(balance) });
    }


    onWithdraw = async () => {
        this.setState({ withdrawShow: true, withdrawLoading: true });
    }


    onDepositClose = async () => {
        this.contract.methods.stake(this.id, this.web3.utils.toWei(this.state.deposit)).send({from: this.account}).then((res) => {
            this.updateUserBalance();
            this.updatePoolBalance();
            this.setState({ depositLoading: false });
        });
        this.setState({ depositShow: false });
    }


    onWithdrawClose = async () => {
        this.contract.methods.unstake(this.id, this.web3.utils.toWei(this.state.withdraw)).send({from: this.account}).then((res) => {
            this.updateUserBalance();
            this.setState({ withdrawLoading: false });
        });
        this.setState({ withdrawShow: false });
    }


    onClaim = async() => {
        this.setState({ claimLoading: true });
        this.contract.methods.unstake(this.id, 0).send({from: this.account}).then(() => {
            this.updatePrices();
            this.setState({ claimLoading: false });
            this.updateHappyBalance();
        });
    }


    render() {
        return (
        <>

        <Card style={{ width: '18rem' }}>
            <Card.Body>
                <Card.Title>
                    <img className="coin" alt={ 'coin ' + this.state.id } src={ this.state.icon } />
                    { this.state.token } staking
                </Card.Title>
                    <Row>
                        <Col>
                            APR:
                        </Col>
                        <Col className="right">
                            { this.state.yield } %
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            Earn:
                        </Col>
                        <Col className="right">
                            HAPPY
                        </Col>
                    </Row>
                    <Row>
                        <div className="title">HAPPY earned</div>
                    </Row>
                    <Row>
                        <Col>
                            { this.state.claim }
                        </Col>
                        <Col className="right">
                            <Button variant="primary" onClick={this.onClaim} disabled={ this.state.claim === 0 }>
                                    { this.state.claimLoading && 
                                        <Spinner as="span" animation="border" size="sm" />
                                    }
                                Claim
                            </Button>
                        </Col>
                    </Row>
                    <Row>
                        <div className="title">{ this.state.token } stacked</div>
                    </Row>
                    <Row>
                        <Col>
                            { this.state.userBalance }
                        </Col>
                        <Col className="right">
                            { !this.state.unlocked &&
                                <Button variant="primary" onClick={this.onUnlock} disabled={this.state.unlockLoading}>
                                    { this.state.unlockLoading && 
                                        <Spinner as="span" animation="border" size="sm" />
                                    }
                                    Unlock
                                </Button>
                            }
                            { this.state.unlocked &&
                                <>
                                <Button variant="primary" onClick={this.onDeposit} disabled={this.state.depositShow}>
                                    { this.state.depositLoading && 
                                        <Spinner as="span" animation="border" size="sm" />
                                    }
                                    +
                                </Button>
                                {' '}
                                </>
                            }
                            { this.state.unlocked && this.state.userBalance !== '0' &&
                                <Button variant="primary" onClick={this.onWithdraw} disabled={this.state.withdrawShow}>
                                    { this.state.withdrawLoading && 
                                        <Spinner as="span" animation="border" size="sm" />
                                    }
                                    -
                                </Button>
                            }                            
                        </Col>
                    </Row>
            </Card.Body>
            <Card.Footer>
                <Row>
                    <Col>
                        Total Pool Liquidity
                    </Col>
                    <Col className="right">
                        $ { this.state.price * this.state.poolBalance }
                    </Col>
                </Row>
                <Row>
                    <Col>
                        My staked value
                    </Col>
                    <Col className="right">
                        $ { this.state.price * this.state.userBalance }
                    </Col>
                </Row>
            </Card.Footer>
        </Card>

        <Modal show={this.state.depositShow} centered backdrop="static" >
            <Modal.Header>
                <Modal.Title>{this.state.token} deposit</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group>
                        Your {this.state.token} balance: { this.state.tokenBalance } 
                        {/* <Button className="float-right" variant="outline-secondary" onClick={this.setState({ deposit: this.state.tokenBalance })} >Max</Button> */}
                    </Form.Group>
                    <Form.Group>
                        <Form.Control type="text" value={this.state.deposit} onChange={(e) => this.setState({deposit: e.target.value})}/>
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={this.onDepositClose}>Deposit</Button>
                <Button variant="secondary" onClick={() => this.setState({ depositShow: false })}>Cancel</Button>
            </Modal.Footer>
        </Modal>

        <Modal show={this.state.withdrawShow} centered backdrop="static" >
            <Modal.Header>
                <Modal.Title>{this.state.token} withdraw</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group>
                        Your {this.state.token} balance: { this.state.userBalance } 
                        {/* <Button className="float-right" variant="outline-secondary" onClick={this.setState({ deposit: this.state.tokenBalance })} >Max</Button> */}
                    </Form.Group>
                    <Form.Group>
                        <Form.Control type="text" value={this.state.withdraw} onChange={(e) => this.setState({withdraw: e.target.value})}/>
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={this.onWithdrawClose}>Withdraw</Button>
                <Button variant="secondary" onClick={() => this.setState({ withdrawShow: false })}>Cancel</Button>
            </Modal.Footer>
        </Modal>

        </>
        );
    }

}


Pool.propTypes = {
    web3: PropTypes.object.isRequired,
    contract: PropTypes.object.isRequired,
    account: PropTypes.string.isRequired,
    id: PropTypes.number.isRequired,
    updateHappyBalance: PropTypes.func.isRequired,
}


export default Pool;
