import React, { Component } from 'react';

import PropTypes from 'prop-types';

import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';

import ERC20Contract from "../contracts/ERC20.json";


class Pool extends Component {

    state = {
        id: this.props.id,
        web3: this.props.web3,
        contract: this.props.contract,
        account: this.props.account,

        claim: 0,

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
                    { this.state.token } staking
                </Card.Title>
                    <Row>
                        <Col>
                            APR:
                        </Col>
                        <Col className="right">
                            12.00 %
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
                            <Button variant="primary" disabled={ this.state.claim === 0 }>Claim</Button>
                        </Col>
                    </Row>
                    <Row>
                        <div className="title">{ this.state.token } stacked</div>
                    </Row>
                    <Row>
                        <Col>
                            0
                        </Col>
                        <Col className="right">
                            <Button variant="primary" disabled>Unlock</Button>
                        </Col>
                    </Row>
            </Card.Body>
            <Card.Footer>
                <Row>
                    <Col>
                        Total Liquidity
                    </Col>
                    <Col className="right">
                        1,000,000.00
                    </Col>
                </Row>
                <Row>
                    <Col>
                        My staked value
                    </Col>
                    <Col className="right">
                        0
                    </Col>
                </Row>
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
