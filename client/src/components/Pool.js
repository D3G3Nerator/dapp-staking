import React, { Component } from 'react';

import PropTypes from 'prop-types';

import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';

import ERC20Contract from "../contracts/ERC20.json";


class Pool extends Component {

    state = {
        id: this.props.id,
        web3: this.props.web3,
        contract: this.props.contract,
        account: this.props.account,

        token: null,
        pool: null
    }


    async componentDidMount() {
        const pool = await this.state.contract.methods.pools(this.state.id).call();

        // Get the pool token contract instance.
        const erc20 = new this.state.web3.eth.Contract(ERC20Contract.abi, pool.token);
        
        const token = await erc20.methods.symbol().call();

        this.setState({ token: token, pool: pool, icon: 'images/' + token.toLowerCase() + '-coin.svg' });
    }


    render() {
        return (<Card style={{ width: '18rem' }}>
            <Card.Body>
                <Card.Title>
                    <img className="coin" alt={ 'coin ' + this.state.id } src={ this.state.icon } />
                    {this.state.token} staking
                </Card.Title>
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
        );
    }

}


Pool.propTypes = {
    web3: PropTypes.object.isRequired,
    contract: PropTypes.object.isRequired,
    account: PropTypes.string.isRequired,
    id: PropTypes.number.isRequired
}


export default Pool;
