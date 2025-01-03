import { Server, createServer } from 'net';
import * as chai from 'chai';
import { ISSocket } from '../src/ISSocket';

const expect = chai.expect;
const port = 14580;

describe('Tests for IS class', () => {
    describe('Test IS constructor.', function() {
        it('Should instantiate an IS instance using all possible default parameter values.', () => {
            const connection: ISSocket = new ISSocket('my test app', 'aprs.server.com', 12345, 'N0CALL');

            expect(connection.appId).to.equal('my test app');
            expect(connection.host).to.equal('aprs.server.com');
            expect(connection.port).to.equal(12345);
            expect(connection.callsign).to.equal('N0CALL');
            expect(connection.passcode).to.equal(-1);
            expect(connection.isTransmitEnabled).to.equal(false);
            expect(connection.aprsFilter).to.be.undefined;
            expect(connection.id).to.not.be.undefined;
            expect(connection.id).to.not.equal('');
        });

        it('Should instantiate an IS connection with given host, port, callsign, appId, and id should be a number.  All other values should default.', () => {
            const connection: ISSocket = new ISSocket('myapp 3.4b', 'aprs.server.com', 12345, 'N0CALL', undefined, undefined, 12345, undefined);

            expect(connection.appId).to.equal('myapp 3.4b');
            expect(connection.host).to.equal('aprs.server.com');
            expect(connection.port).to.equal(12345);
            expect(connection.callsign).to.equal('N0CALL');
            expect(connection.passcode).to.equal(-1);
            expect(connection.isTransmitEnabled).to.equal(false);
            expect(connection.aprsFilter).to.be.undefined;
            expect(connection.id).to.equal(12345);
        });

        it('Should instantiate an IS connection with given host, port, callsign, aprsFilter, appId, and id should be a string.  All other values should default.', () => {
            const connection: ISSocket = new ISSocket('foobar 42', 'aprs.server.com', 12345, 'N0CALL', undefined, undefined, '12345', 'f/*');

            expect(connection.appId).to.equal('foobar 42')
            expect(connection.host).to.equal('aprs.server.com');
            expect(connection.port).to.equal(12345);
            expect(connection.callsign).to.equal('N0CALL');
            expect(connection.passcode).to.equal(-1);
            expect(connection.isTransmitEnabled).to.equal(false);
            expect(connection.aprsFilter).to.equal('f/*');
            expect(connection.id).to.equal('12345');
        });

        it('Should instantiate an IS connection with given host, port, callsign, aprsFilter, and appId.  All other values should default.', () => {
            const connection: ISSocket = new ISSocket('myapp 1.2', 'aprs.server.com', 12345, 'N0CALL', 1234, true, undefined, 'f/*');

            expect(connection.appId).to.equal('myapp 1.2')
            expect(connection.host).to.equal('aprs.server.com');
            expect(connection.port).to.equal(12345);
            expect(connection.callsign).to.equal('N0CALL');
            expect(connection.passcode).to.equal(1234);
            expect(connection.isTransmitEnabled).to.equal(true)
            expect(connection.aprsFilter).to.equal('f/*');
            expect(connection.isConnected()).to.be.false;
        });
    });

    describe('Test UserLogin without callback and no filter.', function() {
        let server: Server;
        const connection: ISSocket = new ISSocket("myapp 1.2", "localhost", port, "N0CALL", undefined, undefined, undefined, 'f/*');

        let serverData: string[] = [];

        before(function(done) {
            server = createServer(function(socket) {
                socket.on('data', function(data) {
                    serverData.push(data.toString());
                });
            }).listen(port);

            connection.connect(() => {
                connection.sendLogin();
                done();
            });
        });

        it("Connection should send login packet", function(done) {
            expect(serverData.length).to.equal(1);
            expect(serverData[0]).to.equal("user N0CALL pass -1 vers myapp 1.2 filter f/*\r\n");

            done();
        });

        after(function() {
            connection.disconnect();
            server.close();
            connection.destroy();
        });
    });

    describe('Test UserLogin with callback.', function() {
        let server: Server;
        let callbackTest;

        const callbackTestValue = "Callback";
        const connection: ISSocket = new ISSocket("myapp 1.2", "localhost", port, "N0CALL");

        let serverData: string[] = [];

        before(function(done) {
            server = createServer(function(socket) {
                socket.on('data', function(data) {
                    serverData.push(data.toString());
                });
            }).listen(port);

            connection.connect(() => {
                connection.sendLogin(() => {
                    callbackTest = callbackTestValue;
                });
                done();
            });
        });

        it("Connection should send login packet", function(done) {
            expect(serverData.length).to.equal(1);
            expect(serverData[0]).to.equal("user N0CALL pass -1 vers myapp 1.2\r\n");

            done();
        });

        it("Login should have run the callback function", function(done) {
            expect(callbackTest).to.equal(callbackTestValue);

            done();
        });

        after(function() {
            connection.disconnect();
            server.close();
            connection.destroy();
        });
    });

    describe('Test filters and trying to send data when isTransmitEnabled is set to false.', function() {
        let server: Server;
        const connection: ISSocket = new ISSocket("myapp 1.2", "localhost", port, "N0CALL");

        let serverData: string[] = [];

        before(function(done) {
            server = createServer(function(socket) {
                socket.on('data', function(data) {
                    serverData.push(data.toString());
                });
            }).listen(port);

            connection.connect(() => {
                connection.send("# filter f/*");

                done();
            });
        });

        it("Connection should be able to set filter.", function(done) {
            expect(serverData[0]).to.equal("# filter f/*\r\n");
            expect(serverData.length).to.equal(1);

            done();
        });

        it('Client should throw an error trying to send a packet when transmitting is disabled.', function() {
            expect(connection.send.bind(connection, 'test 1')).to.throw('Transmitting data is not permitted.');
        });

        after(function() {
            connection.disconnect();
            server.close();
            connection.destroy();
        });
    });

    describe('Test trying to send too many bytes in a packet.', function() {
        const connection: ISSocket = new ISSocket("myapp 1.2", "localhost", port, "N0CALL", 12345, true);
        const serverData: string[] = [];

        let server: Server;

        before(function(done) {
            server = createServer(function(socket) {
                socket.on('data', (data) => {
                    serverData.push(data.toString());
                });
            }).listen(port);

            connection.connect(() => {
                done();
            });
        });

        it('Client should throw an error trying to send too long of packet.', function() {
            expect(connection.send.bind(connection, 'm53jg80gNklq8NBX4di52hGa1z096QMnK8aRmYXCL31TJqAgL89iNdRgXhKz8QOKObb0sQAS2A22AwS1cbK30lPGF9fWyddDptPr5S2K4lSWapiKk0eM5uQbQxNk884tuQaY3joC8IRbkzAzzw1IaiGm8lttM9Duk1m8vZE5LlxhIB4rofi6lZQPOua8ugyuoiKCAjrtusV1rm5T29T6RSE8SCog0pX5ZO87WCRTPxRT51vwUXYPfClZz9AC2hRxMaKaOyhMUv1wQNKThJPh63OacU5erCPlzTWxqOS5id7MFVFhV3ozON5vrVXObYyVYyvIKxbbovPOf8O14iNwatkGqWgSRrj1G7lJdzhzBgquppSkPM2vQX55Lrnnizszx44RLVoIhoTBxnGsSomCZaLkScdBFksB2HUgRdMw711YC680QUV3tWlJRDnHB8IZWn2BgRYQbl4M02ILvZ7ZwB9PuVeztb8x9ufX4SzzgahCpNdkY36CY0ATL5NVf7Q'))
                    .to.throw('Packet length must be shorter than 512 bytes.');
        });

        after(function() {
            connection.disconnect();
            server.close();
            connection.destroy();
        });
    });

    describe('Test connect/disconnect', () => {
        const connection: ISSocket = new ISSocket("myapp 1.2", "localhost", port, "N0CALL");
        let server: Server;

        before(function() {
            server = createServer(function() {
            }).listen(port);
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
        const connection: ISSocket = new ISSocket("myapp 1.2", "localhost", port, "N0CALL");
        let server: Server;

        before(function() {
            server = createServer(function() {
            }).listen(port);
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
        const connection: ISSocket = new ISSocket("myapp 1.2", "localhost", port, "N0CALL", 12345, true);

        const clientData: string[] = [];
        const clientPackets: string[] = [];
        const serverData: string[] = [];

        let server: Server;

        before(function(done) {
            connection.on('data', function(data) {
                clientData.push(data.toString());
            });

            connection.on('packet', (data: Buffer) => {
                clientPackets.push(data.toString());
            });

            server = createServer(function(socket) {
                socket.on('data', (data) => {
                    serverData.push(data.toString());
                });

                socket.write('from server 1\r\nfrom server 2\r\nfrom server 3\r\n from ');
                socket.write('server 4\r\nfrom server 5\r\nfrom server 6\r\n from ');
                socket.write('server 7\r\nfrom server 8\r\nfrom server 9\r\n from ');
                socket.write('server 10\r\nfrom server 11\r\nfrom server 12\r\n from ');
                socket.write('server 13\r\nfrom server 14\r\nfrom server 15\r\n from ');
            }).listen(port, () => {
                done();
            });
        });

        it('Client should throw an error trying to send a packet when not connected.', function() {
            expect(connection.send.bind(connection, 'test 1')).to.throw('Socket not connected.');
        });

        it('Client should successfully connect to server.', function(done) {
            connection.connect(function() {
                connection.send('from client 1');

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
        const connection: ISSocket = new ISSocket("myapp 1.2", "localhost", port, "N0CALL");
        const clientPackets: string[] = [];

        let server: Server;

        before(function(done) {
            connection.on('packet', (data: Buffer) => {
                clientPackets.push(data.toString());
            });

            server = createServer(function(socket) {
                socket.write('from server 1 \r\n');
            }).listen(port);

            connection.connect(() => {
                done();
            });
        });

        it('Client should recieve 1 packet.', function() {
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

    describe('Test callback on disconnect', function() {
        const connection: ISSocket = new ISSocket("myapp 1.2", "localhost", port, "N0CALL");
        let server: Server;

        before(function(done) {
            server = createServer(function(socket) {
                socket.write('from server 1 \r\n');
            }).listen(14580);

            connection.connect(() => {
                done();
            });
        });

        it('Should execute the callback in the disconnect', function() {
            let count = 0;

            connection.disconnect(function() {
                count++;

                // This should probably be outside the disconnect.
                expect(count).to.equal(1);
            });
        });

        after(function() {
            connection.disconnect();
            server.close();
            connection.destroy();
        });
    });
});
