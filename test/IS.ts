import 'mocha';
import { expect } from 'chai';
import IS from '../src/IS';

describe('TEST', () => {
    describe('Test default IS.', () => {
        it('Should return an IS connection with all possible defaults taken.', () => {
            var connection = new IS('www.test.com', 1234);

            expect(connection.host).to.equal('www.test.com');
            expect(connection.port).to.equal(1234);
            expect(connection.callsign).to.equal('N0CALL');
            expect(connection.passcode).to.equal(-1);
        });
    });
});