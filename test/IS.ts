import 'mocha';
import { expect } from 'chai';
import IS from '../src/IS';

describe('TEST', () => {
    describe('Test IS constructor using all possible default parameter values.', () => {
        it('Should return an IS connection with all possible defaults taken.', () => {
            let connection = new IS('aprs.server.com', 12345);

            expect(connection.host).to.equal('aprs.server.com');
            expect(connection.port).to.equal(12345);
            expect(connection.callsign).to.equal('N0CALL');
            expect(connection.passcode).to.equal(-1);
            expect(connection.filter).to.equal(undefined);
            expect(connection.appId).to.equal('IS.js 0.01')
            expect(connection.isTransmitEnabled).to.equal(false);
        });
    });

    describe('Test IS constructor using callsign and appId.', () => {
        it('Should return an IS connection witn given host, port, callsign, and appId.  All other values should default.', () => {
            let connection = new IS('aprs.server.com', 12345, 'N0CALL', undefined, undefined, 'myapp 3.4b');

            expect(connection.host).to.equal('aprs.server.com');
            expect(connection.port).to.equal(12345);
            expect(connection.callsign).to.equal('N0CALL');
            expect(connection.passcode).to.equal(-1);
            expect(connection.filter).to.equal(undefined);
            expect(connection.appId).to.equal('myapp 3.4b')
            expect(connection.isTransmitEnabled).to.equal(false);
        });
    });

    describe('Test IS constructor using callsign, filter, and appId.', () => {
        it('Should return an IS connection witn given host, port, callsign, filter, and appId.  All other values should default.', () => {
            let connection = new IS('aprs.server.com', 12345, 'N0CALL', undefined, 'f/*', 'foobar 42');

            expect(connection.host).to.equal('aprs.server.com');
            expect(connection.port).to.equal(12345);
            expect(connection.callsign).to.equal('N0CALL');
            expect(connection.passcode).to.equal(-1);
            expect(connection.filter).to.equal('f/*');
            expect(connection.appId).to.equal('foobar 42')
            expect(connection.isTransmitEnabled).to.equal(false);
        });
    });

    describe('Test IS constructor passing all parameters.', () => {
        it('Should return an IS connection witn given host, port, callsign, filter, and appId.  All other values should default.', () => {
            let connection = new IS('aprs.server.com', 12345, 'N0CALL', 1234, 'f/*', 'myapp 1.2', true);

            expect(connection.host).to.equal('aprs.server.com');
            expect(connection.port).to.equal(12345);
            expect(connection.callsign).to.equal('N0CALL');
            expect(connection.passcode).to.equal(1234);
            expect(connection.filter).to.equal('f/*');
            expect(connection.appId).to.equal('myapp 1.2')
            expect(connection.isTransmitEnabled).to.equal(true);
        });
    });
});