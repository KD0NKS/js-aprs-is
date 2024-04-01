import { Socket } from 'net';
import { v4 as uuidV4 } from 'uuid';

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
const MESSAGE_DELIMITER: string = '\r\n';
const DISCONNECT_EVENTS: string[] = ['destroy', 'end', 'close', 'error', 'timeout'];
const CONNECT_EVENTS: string[] = ['connect', 'ready'];

export class ISSocket extends Socket {
    private readonly _maxPacketLength: number = 512

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
     * @param {string} [appid] - Your application's name and version number direction finding. Should not exceed 15 characters.
     * @param {string} [host] - APRS-IS server to connect to.
     * @param {number} [port] - Port number of the APRS-IS server to connect to.
     * @param {string} [callsign] - Your station's callsign.
     * @param {number} [passcode=-1] - An APRS-IS passcode.  NOTE: isTransmitEnabled must be set to true even if this is set to be able to send a packet to the server.
     * @param {boolean} [isTransmitEnabled=false] - A flag to tell whether or not a packet can be sent on this connection.  Intended to prevent accidental sending of data. NOTE: passcode must be properly set, otherwise the server will reject any packets, even if this is true.
     * @param {string | null | undefined} [aprsFilter] - An APRS-IS filter string sent to the server.
     * @param {string | number} [id=uuidV4()] - A unique id for the application.  This is not required, but is here for convenience.
     *
     * @example let connection = new IS('myapp 3.4b', 'aprs.server.com', 12345, 'N0CALL');
     * @example let connection = new IS('foobar 42', 'aprs.server.com', 12345, 'N0CALL', undefined, 'f/*');
     * @example let connection = new IS('myapp 1.2', 'aprs.server.com', 12345, 'N0CALL', 1234, true, 'f/*', 'abc123');
    */
    // Don't provide multiple constructors.  Passing undefined parameters is annoying, but ideally, most, if not all
    // parameters should be used anyway.
    constructor(public appId: string // (appname and version num should not exceed 15 characters) TODO: Figure out how to pass process name and version to the parent app.
            , public host: string
            , public port: number
            , public callsign: string
            , public passcode: number = -1
            , public isTransmitEnabled: boolean  = false
            , public id: string | number = uuidV4() // This is odd at best... leave it for now
            , public aprsFilter?: string | null | undefined
            ) {
        super();

        this._bufferedData = '';
        this._isSocketConnected = false;
        this.setNoDelay(false);   // If your client software is bidirectional (sends and receives), turn off the Nagle algorithm when connecting to APRS-IS as it can introduce significant delays (TCP_NODELAY).

        // TODO: Do we want to throw errors if the host, port, callsign, are null?

        // TODO: Should make this public so it can be overwritten.
        this.on('data', (data: Buffer) => {
            this._bufferedData += data.toString();
            let msgs = this._bufferedData.split('\r\n');

            if(this._bufferedData.endsWith('\r\n')) {
                this._bufferedData = '';
                msgs = msgs.filter(msg => msg.trim() != '');    // This is trimming out any empty messages
            } else {
                this._bufferedData = msgs[msgs.length - 1];
                msgs = msgs.slice(0, -1);
            }

            this.emitPackets(msgs);
        });

        for(const e of DISCONNECT_EVENTS) {
            this.on(e, () => {
                // Tested, but does not show up in reports as such.
                this._isSocketConnected = false;
            });
        }

        for(const e of CONNECT_EVENTS){
            this.on(e, () => {
                this._isSocketConnected = true;
            });
        }
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
     * @param {string} line - Packet/message to send this should not include the <CR><LF> delimiter.
     */
    private sendLine(line: string): void {
        if(this._isSocketConnected === false) {
            throw new Error('Socket not connected.');
        }

        // TODO: do we care about format validation?
        // Trusting the calling appliation to handle this appropriately for now.
        const data = `${line}${MESSAGE_DELIMITER}`;

        if(data.length <= this._maxPacketLength) {
            // Does it make sense to have a 'sending' and 'data' event?
            this.emit('sending', data);
            this.emit('data', data);

            // TODO: use callback and emit 'sent' and data events
            this.write(data, 'utf8');
        } else {
            throw new Error("Packet length must be shorter than 512 bytes.")
        }
    }

    /**
     * Sends a login message regardless of the value of isTransmitEnabled.
     */
    public sendLogin(callback?: any): any {
        this.sendLine(`user ${this.callsign} pass ${this.passcode} vers ${this.appId}`
                + ((this.aprsFilter == undefined || !this.aprsFilter) ? '' : ` filter ${this.aprsFilter}`));

        if(callback) {
            callback()
        }
    }

    /**
     * Sends a packet only if:
     * - isTransmitEnabled is set to true.  Used as a safeguard to prevent unintentionally sending packets.
     * - packet is a control command starting with a '#' character.
     *
     * @param {string} packet - Packet to send WITHOUT the <CR><LF> separator.
     */
    public send(packet: string): void {
        if(this.isTransmitEnabled === true || packet.startsWith('#')) {
            this.sendLine(packet)
        } else {
            throw new Error("Transmitting data is not permitted.");
        }
    }

    /**
     * In a perfect world, this tells whether the socket is currently connected.
     *
     * @returns {boolean} True if connected, otherwise false.
     *
     * @example connection.isConnected
     */
    public isConnected(): boolean {
        // use socket.writeable instead?
        return this._isSocketConnected === true;
    }

    private emitPackets(msgs: string[]) {
        msgs.forEach(msg => {
            this.emit("packet", msg)
        });
    }
};
