/// <reference> 'node_modules/@types/node/index.d.ts'
import { Socket } from 'net';

/**
 * JS-APRS-IS - An APRS-IS client module
 *
 * This module is a client library for the APRS-IS. It has an object-oriented
 * interface which contains methods to connect and disconnect from a server,
 * and to read and write lines on the connection.
 *
 * What's different betweent this and perl-aprs-fap?
 * - No method that could possibly generate a passcode for a given callsign.
 * - Because node is event based, data is pushed rather than pulled; parent must subscribe to events.
 * - Stand alone module from perl-aprs-fap.  Allows a user to utilize any parser they chose.
 *
 * @author Andrew Fairhurst, KD0NKS
 *
 * @copyright 2017 by Andrew Fairhurst
 *
 * This library is free software; you can redistribute it and/or modify
 * it under the same terms as Perl itself.
 *
 * @emits {event} socketError
 * @emits {event} socketEnd
 * @emits {event} data
 *
 * TODO: UPDATE USAGE EXAMPLE, ADD TO WIKI
 * let connection = new IS('aprs.server.com', 12345, 'N0CALL', undefined, undefined, 'myapp 3.4b');
 *
 *   $is->connect('retryuntil' => 3) || die "Failed to connect: $is->{error}";
 *
 * for (my $i = 0; $i < 10; $i += 1) {
 *       my $l = $is->getline_noncomment();
 *       next if (!defined $l);
 *       print "\n--- new packet ---\n$l\n";
 *
 *       my %packetdata;
 *       my $retval = parseaprs($l, \%packetdata);
 *
 *       if ($retval == 1) {
 *           while (my ($key, $value) = each(%packetdata)) {
 *               print "$key: $value\n";
 *           }
 *       } else {
 *           warn "Parsing failed: $packetdata{resultmsg} ($packetdata{resultcode})\n";
 *       }
 *   }
 *
 *   $is->disconnect() || die "Failed to disconnect: $is->{error}";
 */
const VERSION: string = '0.01';
const MESSAGE_DELIMITER = '\r\n';
const DISCONNECT_EVENTS: string[] = ['destroy', 'end', 'close', 'error', 'timeout'];

export default class IS extends Socket {
    // not a fan of this... emit events instead? build it out to be a wrapper around null/readable/writable?
    private isSocketConnected: boolean;

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
     * @param {string} [appid=IS.js 0.01] - Your application's name and version number direction finding. Should not exceed 15 characters.
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
            , public callsign = "N0CALL"
            , public passcode = -1
            , public filter?: string
            , public appId = `IS.js ${VERSION}` // (appname and versionnum should not exceed 15 characters)
            ) {
		super();

        this.isSocketConnected = false;

        // TODO: Do we want to throw errors if the host, port, callsign, are null?
	}

    /**
     * Connects to the server.
     *
     * TODO: reconnects?  are we really interested?
     *
     * @example connection.connect()
     */
	connect(callback?: any): void { //sub connect($;%)
        super.connect(this.port, this.host, () => {
            this.isSocketConnected = true;

            if(callback) {
                callback();
            }
        });

        for(var e in DISCONNECT_EVENTS) {
            this.isSocketConnected = false;
        }

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
     * @example connection.disconnect();
     */
	disconnect(callback?: any) {
        super.end("", () => {
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
    sendLine(line: string) {
        if(!this.isConnected) {
            throw new Error("Socket not connected.");
        }

        // TODO: do we care about format validation?
        // Trusting the calling appliation to handle this appropriately for now.
        line = `line${MESSAGE_DELIMITER}`;

        this.emit('sending', line);
        this.emit('data', line);

        super.write(line, 'utf8');
    }

    /**
     * In a perfect world, this tells whether the socket is currently connected.
     *
     * @returns {boolean} True if connected, otherwise false.
     *
     * @example connection.isConnected()
     */
	isConnected(): boolean {
        // use socket.writeable instead?
        return this.isSocketConnected === true;
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
}