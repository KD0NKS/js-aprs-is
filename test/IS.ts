import * as net from 'net';
import 'mocha';
import { expect } from 'chai';

import IS from '../src/IS';

describe('Tests for IS class', () => {
    describe('Test IS constructor.', () => {
        it('Should instantiate an IS instance using all possible default parameter values.', () => {
            let connection = new IS('aprs.server.com', 12345);

            expect(connection.host).to.equal('aprs.server.com');
            expect(connection.port).to.equal(12345);
            expect(connection.callsign).to.equal('N0CALL');
            expect(connection.passcode).to.equal(-1);
            expect(connection.filter).to.be.undefined;
            expect(connection.appId).to.equal('IS.js 0.01');
        });

        it('Should instantiate an IS connection with given host, port, callsign, and appId.  All other values should default.', () => {
            let connection = new IS('aprs.server.com', 12345, 'N0CALL', undefined, undefined, 'myapp 3.4b');

            expect(connection.host).to.equal('aprs.server.com');
            expect(connection.port).to.equal(12345);
            expect(connection.callsign).to.equal('N0CALL');
            expect(connection.passcode).to.equal(-1);
            expect(connection.filter).to.be.undefined;
            expect(connection.appId).to.equal('myapp 3.4b');
        });

        it('Should instantiate an IS connection with given host, port, callsign, filter, and appId.  All other values should default.', () => {
            let connection = new IS('aprs.server.com', 12345, 'N0CALL', undefined, 'f/*', 'foobar 42');

            expect(connection.host).to.equal('aprs.server.com');
            expect(connection.port).to.equal(12345);
            expect(connection.callsign).to.equal('N0CALL');
            expect(connection.passcode).to.equal(-1);
            expect(connection.filter).to.equal('f/*');
            expect(connection.appId).to.equal('foobar 42')
        });

        it('Should instantiate an IS connection with given host, port, callsign, filter, and appId.  All other values should default.', () => {
            let connection = new IS('aprs.server.com', 12345, 'N0CALL', 1234, 'f/*', 'myapp 1.2');

            expect(connection.host).to.equal('aprs.server.com');
            expect(connection.port).to.equal(12345);
            expect(connection.callsign).to.equal('N0CALL');
            expect(connection.passcode).to.equal(1234);
            expect(connection.filter).to.equal('f/*');
            expect(connection.appId).to.equal('myapp 1.2')
            expect(connection.isConnected()).to.be.false;
        });
    });

    describe('Test UserLogin.', () => {
        it('Should return a user connection string with all default parameters and no filter.', () => {
            let connection = new IS('aprs.server.com', 12345);

            expect(connection.userLogin).to.equal("user N0CALL pass -1 vers IS.js 0.01");
        });

        it('Should return a user connection string where all parameters including filter are specified.', () => {
            let connection = new IS('aprs.server.com', 12345, 'N0CALL', 1234, 'f/*', 'myapp 1.2');

            expect(connection.userLogin).to.equal("user N0CALL pass 1234 vers myapp 1.2 filter f/*")
        });
    });

    describe('Test connect/disconnect', () => {
        let connection: IS;
        let server;
        this.connection = new IS("localhost", 14580);

        before(() => {
            this.server = net.createServer((c) => {
                console.log('client connected');

                c.on('end', () => {
                    console.log('client disconnected');
                });
            }).on('error', (err) => {
                // handle errors here
                throw err;
            });

            this.server.listen('14580', () => {
                console.log('server bound');
            });

            this.connection.connect();
        });

        it('Client should successfully connect to server.', () => {
            expect(this.connection.isConnected()).to.be.true;

            this.connection.disconnect();
        });

        after(() => {
            it('Client should successfully disconnect from server.', () => {
                expect(this.connection.isConnected()).to.be.false;
            });
        });
    });
});