import * as net from 'net';
import * as chai from 'chai';
import { ISSocket } from '../src/ISSocket';

const expect = chai.expect;

describe('Tests for IS class', () => {
    describe('Test IS constructor.', function() {
        it('Should instantiate an IS instance using all possible default parameter values.', () => {
            const connection: ISSocket = new ISSocket('aprs.server.com', 12345);

            expect(connection.host).to.equal('aprs.server.com');
            expect(connection.port).to.equal(12345);
            expect(connection.callsign).to.equal('N0CALL');
            expect(connection.passcode).to.equal(-1);
            expect(connection.filter).to.be.undefined;
            expect(connection.appId).to.equal(`${process.title} ${process.version}`);
        });

        it('Should instantiate an IS connection with given host, port, callsign, and appId.  All other values should default.', () => {
            const connection = new ISSocket('aprs.server.com', 12345, 'N0CALL', undefined, undefined, 'myapp 3.4b');

            expect(connection.host).to.equal('aprs.server.com');
            expect(connection.port).to.equal(12345);
            expect(connection.callsign).to.equal('N0CALL');
            expect(connection.passcode).to.equal(-1);
            expect(connection.filter).to.be.undefined;
            expect(connection.appId).to.equal('myapp 3.4b');
        });

        it('Should instantiate an IS connection with given host, port, callsign, filter, and appId.  All other values should default.', () => {
            const connection = new ISSocket('aprs.server.com', 12345, 'N0CALL', undefined, 'f/*', 'foobar 42');

            expect(connection.host).to.equal('aprs.server.com');
            expect(connection.port).to.equal(12345);
            expect(connection.callsign).to.equal('N0CALL');
            expect(connection.passcode).to.equal(-1);
            expect(connection.filter).to.equal('f/*');
            expect(connection.appId).to.equal('foobar 42')
        });

        it('Should instantiate an IS connection with given host, port, callsign, filter, and appId.  All other values should default.', () => {
            const connection = new ISSocket('aprs.server.com', 12345, 'N0CALL', 1234, 'f/*', 'myapp 1.2');

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
            const connection = new ISSocket('aprs.server.com', 12345);

            expect(connection.userLogin).to.equal(`user N0CALL pass -1 vers ${process.title} ${process.version}`);
        });

        it('Should return a user connection string where all parameters including filter are specified.', () => {
            const connection = new ISSocket('aprs.server.com', 12345, 'N0CALL', 1234, 'f/*', 'myapp 1.2');

            expect(connection.userLogin).to.equal("user N0CALL pass 1234 vers myapp 1.2 filter f/*")
        });
    });

    describe('Test connect/disconnect', () => {
        const connection: ISSocket = new ISSocket("localhost", 14580);
        let server: net.Server;

        before(function() {
            server = net.createServer(function() {
            }).listen(14580);
        });

        it('Client should report not being connected to server.', function() {
            expect(connection.isConnected()).to.equal(false);
        });

        it('Client should successfully connect to server.', function() {
            connection.on('connect', function() {
                expect(connection.isConnected()).to.equal(true);
            });

            connection.connect();
        });

        it('Client should successfully disconnect from server.', function() {
            connection.on('disconnect', function() {
                expect(connection.isConnected()).to.equal(true);
            });

            connection.disconnect();
        });

        after(function() {
            server.close();
            connection.destroy();
        });
    });

    describe('Test connect/disconnect/connect', function() {
        const connection: ISSocket = new ISSocket("localhost", 14580);
        let server: net.Server;

        before(function() {
            server = net.createServer(function() {
            }).listen(14580);
        });

        it('Client should report not being connected to server.', function() {
            expect(connection.isConnected()).to.equal(false);
        });

        it('Client should successfully connect to server.', function() {
            connection.on('connect', function() {
                expect(connection.isConnected()).to.equal(true);
            });

            connection.connect();
        });

        it('Client should successfully disconnect from server.', function() {
            connection.on('disconnect', function() {
                expect(connection.isConnected()).to.equal(false);
            });

            connection.disconnect();
        });

        it('Client should successfully connect to server.', function() {
            connection.on('connect', function() {
                expect(connection.isConnected()).to.equal(true);
            });

            connection.connect();
        });

        after(function() {
            server.close();
            connection.destroy();
        });
    });

    describe('Test connect/disconnect and receiving data from the server', function() {
        const connection: ISSocket = new ISSocket("localhost", 14580);
        const clientData: string[] = [];
        const clientPackets: string[] = [];
        const serverData: string[] = [];

        let server: net.Server;

        before(function(done) {
            connection.on('data', function(data) {
                clientData.push(data.toString());
            });

            connection.on('packet', (data: Buffer) => {
                clientPackets.push(data.toString());
            });

            server = net.createServer(function(socket) {
                socket.on('data', (data) => {
                    serverData.push(data.toString());
                });

                socket.write('from server 1\r\nfrom server 2\r\nfrom server 3\r\n from ');
                socket.write('server 4\r\nfrom server 5\r\nfrom server 6\r\n from ');
                socket.write('server 7\r\nfrom server 8\r\nfrom server 9\r\n from ');
                socket.write('server 10\r\nfrom server 11\r\nfrom server 12\r\n from ');
                socket.write('server 13\r\nfrom server 14\r\nfrom server 15\r\n from ');
            }).listen(14580, () => {
                done();
            });
        });

        it('Client should throw an error trying to send a packet when not connected.', function() {
            expect(connection.sendLine.bind(connection, 'test 1')).to.throw('Socket not connected.');
        });

        it('Client should successfully connect to server.', function(done) {
            connection.connect(function() {
                connection.sendLine('from client 1');

                done();
            });
        });

        it('Client should recieve 2 pieces of data.', function() {
            expect(clientData.length).to.equal(2);
        });

        it('Client should recieve 16 packets.', function() {
            expect(clientPackets.length).to.equal(16);
        });

        it('Server should recieve 1 piece of data.', function() {
            expect(serverData.length).to.equal(1);
        });

        after(function() {
            connection.disconnect();
            server.close();
            connection.destroy();
        });
    });

    describe('Test connect/disconnect and receiving data from the server', function() {
        const connection: ISSocket = new ISSocket("localhost", 14580);
        const clientPackets: string[] = [];

        let server: net.Server;

        before(function(done) {
            connection.on('packet', (data: Buffer) => {
                clientPackets.push(data.toString());
            });

            server = net.createServer(function(socket) {
                socket.write('from server 1 \r\n');
            }).listen(14580);

            connection.connect(() => {
                done();
            });
        });

        it('Client should recieve 1 packet.', function() {
            console.log(clientPackets);
            expect(clientPackets.length).to.equal(1);
        });

        it('The packet received should end in a space.', function() {
            expect(clientPackets[0].endsWith(' '));
        });

        after(function() {
            connection.disconnect();
            server.close();
            connection.destroy();
        });
    });

    /*
    Async issues?
    describe('Test event to toggle isSocketConnected', () => {
        let connection: ISSocket = new ISSocket("localhost", 14580);
        let server: net.Server;

        before((done) => {
            server = net.createServer((socket) => {
                //socket.on('end', () => {
                //    server.close();
                //});

                //socket.on('connect', (callback: any) => {
                //    this.destroy();
                //});
            }).listen(14580, () => {
                connection.connect(() => {
                    done();
                });
            });
        });

        it('Client successfully report socket status as disconnected.', (done) => {
            connection.on('close', () => {
                expect(connection.isConnected).to.be.false;
                done();
            });

            server.close();
        });
    });
    */
});
