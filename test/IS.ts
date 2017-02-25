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
        let connection: IS = new IS("localhost", 14580);
        let server: net.Server;

        before((done) => {
            server = net.createServer((c) => {
            });

            server.listen('14580', () => {
                done();
            });
        });

        it('Client should successfully connect to server.', (done) => {
            connection.connect(() => {
                expect(connection.isConnected).to.be.true;
            });

            done();
        });

        it('Client should successfully disconnect from server.', (done) => {
            connection.disconnect(() => {
                expect(connection.isConnected).to.be.false;
            });

            done();
        });

        after((done) => {
            server.close();

            done();
        });
    });

    describe('Test connect/disconnect and receiving data from the server', () => {
        let connection: IS = new IS("localhost", 14580);
        let server: net.Server;
        let clientReceived: string[] = [];
        let serverReceived: string[] = [];

        before((done) => {
            server = net.createServer((c) => {
                c.write('test 1\r\n', 'utf8');
                c.write('test 2\r\n', 'utf8');

                c.on('data', (data) => {
                    serverReceived.push(data.toString());
                });
            });

            server.listen('14580', () => {
                done();
            });
        });

        it('Client should successfully connect to server.', (done) => {
            connection.on('data', (data) => {
                clientReceived.push(data.toString());
            });

            connection.on('connect', () => {
                this.write('test 1\r\n', 'utf8');
                this.write('test 2\r\n', 'utf8');
                this.write('test 3\r\n', 'utf8');
            });

            connection.connect(() => {
                expect(connection.isConnected).to.be.true;
            });

            done();
        });

        it('Client should successfully disconnect from server.', (done) => {
            connection.disconnect(() => {
                expect(connection.isConnected).to.be.false;
            });

            done();
        });

        it('Client should have received 2 messages.', () => {
            clientReceived.length = 2;
        });

        it('Server should have received 3 messages.', () => {
            clientReceived.length = 3;
        });

        after((done) => {
            server.close();

            done();
        });
    });
});