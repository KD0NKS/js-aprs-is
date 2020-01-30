import { Socket } from 'net';

/**
 * JS-APRS-IS - An APRS-IS client module
 *
 * This module is a client library for the APRS-IS. It has an object-oriented
 * interface which contains methods to connect and disconnect from a server,
 * and to read and write lines on the connection.
 *
 * What's different betweent this and perl-aprs-fap?
 * - No method that could generate a passcode for a given callsign.
 * - Because node is event based, data is pushed rather than pulled; parent must subscribe to events.
 * - Stand alone module from perl-aprs-fap.  Allows a user to utilize any parser they chose.
 *
 * This library is free software; you can redistribute it and/or modify
 * it under the same terms as Perl itself.
 *
 * @emits {event} socketError
 * @emits {event} socketEnd
 * @emits {event} data
 * @emits {event} packet
 */
import { version } from '../package.json';

const VERSION: string = version;
const MESSAGE_DELIMITER: string = '\r\n';
const DISCONNECT_EVENTS: string[] = ['destroy', 'end', 'close', 'error', 'timeout'];
const CONNECT_EVENTS: string[] = ['connect', 'ready'];

export class ISSocket extends Socket {
    // not a fan of this... emit events instead? build it out to be a wrapper around null/readable/writable?
    private _isSocketConnected: boolean;
    private _bufferedData: string;

    // TODO: auto reconnect?
    // check for empty callsign
    // check for empty host
    // check for empty appid

    /**
     * Initializes a new JS-APRS-IS socket. Takes two mandatory arguments,
     * the host and port to connect to and your client's callsign, and one or more
     * optional named options:
     *
     * @param {string} host - APRS-IS server to connect to.
     * @param {number} port - Port number of the APRS-IS server to connect to.
     * @param {string} [callsign=N0CALL] - Your station's callsign.
     * @param {number} [passcode=-1] - An APRS-IS passcode.
     * @param {string} [filter] - An APRS-IS filter string sent to the server.
     * @param {string} [appid=IS.js 1.0.0] - Your application's name and version number direction finding. Should not exceed 15 characters.
     *
     * @example let connection = new IS('aprs.server.com', 12345);
     * @example let connection = new IS('aprs.server.com', 12345, 'N0CALL', undefined, undefined, 'myapp 3.4b');
     * @example let connection = new IS('aprs.server.com', 12345, 'N0CALL', undefined, 'f/*', 'foobar 42');
     * @example let connection = new IS('aprs.server.com', 12345, 'N0CALL', 1234, 'f/*', 'myapp 1.2', true);
    */
    // Don't provide multiple constructors.  Passing undefined parameters is annoying, but ideally, most, if not all
    // parameters should be used anyway.
    constructor(public host: string
            , public port: number
            , public callsign: string = "N0CALL"
            , public passcode: number = -1
            , public filter?: string
            , public appId: string = `IS.js ${VERSION}` // (appname and versionnum should not exceed 15 characters)
            ) {
        super();

        this._bufferedData = '';
        this._isSocketConnected = false;
        this.setNoDelay(true);

        // TODO: Do we want to throw errors if the host, port, callsign, are null?

        this.on('data', (data: Buffer) => {
            this._bufferedData += data.toString();
            let msgs = this._bufferedData.split('\r\n');

            if(this._bufferedData.endsWith('\r\n')) {
                this._bufferedData = '';
                msgs = msgs.filter(msg => msg.trim() != '');    // This isn't trimming the actual message
            } else {
                this._bufferedData = msgs[msgs.length - 1];
                msgs = msgs.slice(0, -1);
            }

            this.emitPackets(msgs);
        });

        DISCONNECT_EVENTS.forEach((e) => {
            this.on(e, () => {
                // Tested, but does not show up in reports as such.
                this._isSocketConnected = false;
            });
        });

        CONNECT_EVENTS.forEach((e) => {
            this.on(e, () => {
                this._isSocketConnected = true;
            });
        });
    }

    /**
     * Connects to the server.
     *
     * TODO: reconnects?  are we really interested?
     *
     * @example connection.connect()
     */
    public connect(callback?: any): any {
        super.connect(this.port, this.host, () => {
            if(callback) {
                callback();
            }
        });

        //return this;

        /*
        ##    *  Need to send on initial connect the following logon line:
        ##      user callsign pass passcode vers appname versionnum rest_of_line
        ##
        ##      callsign = login callsign-SSID
        ##      passcode = login passcode per APRS-IS algorithm, -1 = read-only
        ##      appname = application name (1 word)
        ##      versionnum = application version number (no spaces)
        ##      rest_of_line = server command if connecting to a port that supports commands (see Server Commands)
        ##
        ##      (appname and versionnum should not exceed 15 characters)
        ##
        ##
        ##    * Need to recognize both TCPIP and TCPXX as TCP/IP stations
        ##    * Need to provide a means to perform the user validation. This can either be a user entered password,
        ##      or a client program can automatically figure out the password given the callsign.
        ##      If the later is used, it is the client programmer's responsibility to be certain that non-amateurs
        ##      are not given registrations that can validate themselves in APRS-IS.
        ##    * Probably a good idea to perform some feedback about the limitations of TCPIP without a registration number.
        */
    }

    /**
     * Disconnects from the server.
     * Wrapper method for net.Socket.end() method.
     *
     * TODO: deprecate and implement end instead.
     *
     * @example connection.disconnect();
     */
    public disconnect(callback?: any): any {
        return super.end("", () => {
            if(callback) {
                callback();
            }
        });
    }

    /**
     * Transmits a line (typically an APRS packet) to the APRS-IS. The line
     * should be a complete packet but WITHOUT the <CR><LF> separator
     * used on the APRS-IS.
     *
     * @param {string} line - Packet/message to send with <CR><LF> delimiter.
     */
    public sendLine(line: string): void {
        if(this._isSocketConnected === false) {
            throw new Error('Socket not connected.');
        }

        // TODO: do we care about format validation?
        // Trusting the calling appliation to handle this appropriately for now.
        const data = `${line}${MESSAGE_DELIMITER}`;

        // Does it make sense to have a 'sending' and 'data' event?
        this.emit('sending', data);
        this.emit('data', data);

        this.write(data, 'utf8');
    }

    /**
     * In a perfect world, this tells whether the socket is currently connected.
     *
     * @returns {boolean} True if connected, otherwise false.
     *
     * @example connection.isConnected()
     */
    public isConnected(): boolean {
        // use socket.writeable instead?
        return this._isSocketConnected === true;
    };

    /**
     * Generates a user login packet for an APRS-IS server.
     * Replaces perl-aprs-is user_command function.
     *
     * @returns {string} Formatted user login packet/message without message delimiter.
     */
    get userLogin(): string {
        return `user ${this.callsign} pass ${this.passcode} vers ${this.appId}`
                + ((this.filter == undefined || !this.filter) ? '' : ` filter ${this.filter}`);
    }

    private async emitPackets(msgs: string[]) {
        msgs.forEach(msg => {
            this.emit("packet", msg)
        });
    }
};