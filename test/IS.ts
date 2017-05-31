/// <reference path="../node_modules/@types/node/index.d.ts" />
import * as net from 'net';
import 'mocha';
import { expect } from 'chai';

import ISSocket from '../src/IS';

describe('Tests for IS class', () => {
    describe('Test IS constructor.', () => {
        it('Should instantiate an IS instance using all possible default parameter values.', () => {
            let connection: ISSocket = new ISSocket('aprs.server.com', 12345);

            expect(connection.host).to.equal('aprs.server.com');
            expect(connection.port).to.equal(12345);
            expect(connection.callsign).to.equal('N0CALL');
            expect(connection.passcode).to.equal(-1);
            expect(connection.filter).to.be.undefined;
            expect(connection.appId).to.equal('IS.js 0.01');
        });

        it('Should instantiate an IS connection with given host, port, callsign, and appId.  All other values should default.', () => {
            let connection = new ISSocket('aprs.server.com', 12345, 'N0CALL', undefined, undefined, 'myapp 3.4b');

            expect(connection.host).to.equal('aprs.server.com');
            expect(connection.port).to.equal(12345);
            expect(connection.callsign).to.equal('N0CALL');
            expect(connection.passcode).to.equal(-1);
            expect(connection.filter).to.be.undefined;
            expect(connection.appId).to.equal('myapp 3.4b');
        });

        it('Should instantiate an IS connection with given host, port, callsign, filter, and appId.  All other values should default.', () => {
            let connection = new ISSocket('aprs.server.com', 12345, 'N0CALL', undefined, 'f/*', 'foobar 42');

            expect(connection.host).to.equal('aprs.server.com');
            expect(connection.port).to.equal(12345);
            expect(connection.callsign).to.equal('N0CALL');
            expect(connection.passcode).to.equal(-1);
            expect(connection.filter).to.equal('f/*');
            expect(connection.appId).to.equal('foobar 42')
        });

        it('Should instantiate an IS connection with given host, port, callsign, filter, and appId.  All other values should default.', () => {
            let connection = new ISSocket('aprs.server.com', 12345, 'N0CALL', 1234, 'f/*', 'myapp 1.2');

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
            let connection = new ISSocket('aprs.server.com', 12345);

            expect(connection.userLogin).to.equal("user N0CALL pass -1 vers IS.js 0.01");
        });

        it('Should return a user connection string where all parameters including filter are specified.', () => {
            let connection = new ISSocket('aprs.server.com', 12345, 'N0CALL', 1234, 'f/*', 'myapp 1.2');

            expect(connection.userLogin).to.equal("user N0CALL pass 1234 vers myapp 1.2 filter f/*")
        });
    });

    describe('Test connect/disconnect', () => {
        let connection: ISSocket = new ISSocket("localhost", 14580);
        let server: net.Server;

        before((done) => {
            server = net.createServer((c) => {
            }).listen(14580, () => {
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
        let connection: ISSocket = new ISSocket("localhost", 14580);
        let server: net.Server;
        let clientData: string[] = [];
        let clientPackets: string[] = [];
        let serverData: string[] = [];

        before((done) => {
            server = net.createServer((socket) => {
                socket.on('data', (data) => {
                    serverData.push(data.toString());
                });

                socket.write('from server 1\r\n');
            }).listen(14580);

            connection.on('data', (data) => {
                clientData.push(data.toString());
            });

            connection.on('packet', (data) => {
                clientPackets.push(data.toString());
            });

            done();
        });

        it('Client should throw an error trying to send a packet when not connected.', (done) => {
            expect(connection.sendLine.bind(connection, 'test 1')).to.throw('Socket not connected.');

            done();
        });

        it('Client should successfully connect to server.', (done) => {
            connection.connect(() => {
                connection.sendLine('from client 1');

                expect(connection.isConnected).to.be.true;
            });

            done();
        });

        it('Client should recieve 2 piece of data.', (done) => {
            expect(clientData.length).to.equal(2);

            done();
        });

        it('Client should recieve 2 packet.', (done) => {
            expect(clientPackets.length).to.equal(2);

            done();
        });

        it('Server should recieve 1 piece of data.', (done) => {
            expect(serverData.length).to.equal(1);

            done();
        });

        after((done) => {
            connection.disconnect();
            server.close();

            done();
        });
    });
});