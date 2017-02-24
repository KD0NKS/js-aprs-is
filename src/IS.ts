/// <reference> 'node_modules/@types/node/index.d.ts'
import { EventEmitter } from 'events' ;
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
 * @author Matti Aarnio, OH2MQK
 * @author Heikki Hannikainen, OH7LZB hessu@hes.iki.fiE<gt>
 *
 * @copyright 2017 by Andrew Fairhurst, 2000-3000 by Matti Aarnio, 2000-3000 by Heikki Hannikainen
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

export default class IS extends EventEmitter {
	// socket
	private socket: Socket;

    // not a fan of this... emit events instead?
    private isSocketConnected: boolean;

    // TODO: auto reconnect?

	/**
     * Initializes a new JS-APRS-IS socket. Takes two mandatory arguments,
     * the host:port pair to connect to and your client's callsign, and one or more
     * optional named options:
     *
     * @param {string} host - APRS-IS server to connect to.
     * @param {number} port - Port number of the APRS-IS server to connect to.
     * @param {string} [callsign=N0CALL] - Your station's callsign.
     * @param {number} [passcode=-1] - An APRS-IS passcode.
     * @param {string} [filter] - An APRS-IS filter string sent to the server.
     * @param {string} [appid=IS.js 0.01] - Your application's name and version number direction finding. Should not exceed 15 characters.
     * @param {boolean} [isTransmitEnabled=false] - Whether or not to allow the connection to transmit any packets other than a login message.
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
            , public isTransmitEnabled = false) {
		super();

        this.isSocketConnected = false;

        // TODO: Do we want to throw errors if the host, port, callsign, are null?
	}

/*
Connects to the server. Returns 1 on success, 0 on failure.
Takes an optional options hash as a parameter. Currently knows only one parameter,
retryuntil, which specifies the number of seconds to retry the connection. After
each failed attempt the code sleeps for 0.5 seconds before trying again. Defaults
to 0 (no retries).

TODO: reconnects?  are we really interested?

  $is->connect('retryuntil' => 10) || die "Failed to connect: $is->{error}";
*/
	connect(): void { //sub connect($;%)
        if(this.socket || this.socket !== undefined) {
            throw new Error('Already connected.')
        }

        this.socket = new Socket();

        this.socket.on('error', (error: Error) => {
            this.isSocketConnected = false;

            this.emit('socketError', error);
        });

        this.socket.on('end', () => {
            this.isSocketConnected = false;

            this.emit('socketEnd')
        });

        this.socket.on('data', (data) => {
            this.emit('data');
        });

        this.socket.connect(this.port, this.host, () => {
            this.isSocketConnected = true;
        });

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
     *
     * @example connection.disconnect();
     */
	disconnect() {  //sub disconnect($)
        if(this.socket != undefined) {
            try {
                this.socket.end();
            } catch(error) { }

            try {
                if(this.socket != undefined && this.socket) {
                    this.socket.destroy();
                }
            } catch(error) { }
        }

        // Let's make absolutely sure...
        this.socket = null;
    }

    /**
     * In a perfect world, this tells whether the socket is currently connected.
     *
     * @returns {boolean} True if connected, otherwise false.
     */
	isConnected(): boolean {
        return this.isSocketConnected === true;
    };
}

/*
sub user_command($)
{
	my($self) = @_;

	if (defined($self->{'filter'})) {
		return sprintf("user %s pass %s vers %s filter %s\r\n",
			$self->{'mycall'},
			$self->{'passcode'},
			$self->{'appid'}, $self->{'filter'} );
	} else {
		return sprintf("user %s pass %s vers %s\r\n",
			$self->{'mycall'},
			$self->{'passcode'},
			$self->{'appid'} );
	}
}

=head1 sendline(packet)

Transmits a line (typically an APRS packet) to the APRS-IS. The line
should be a complete packet but WITHOUT the <CR><LF> separator
used on the APRS-IS.

=cut

sub sendline($$)
{
	my($self, $line) = @_;
	return undef if ($self->{'state'} ne 'connected');

	if (!defined $self->{'sock'}->blocking(1)) {
		#warn "sendline: blocking(1) failed: $!\n";
		$self->{'error'} = "sendline: blocking(1) failed: $!";
		return undef;
	}
	my $ret = $self->{'sock'}->printf( "%s\r\n", $line);
	if (!$self->{'sock'}->flush) {
		#warn "sendline: flush() failed: $!\n";
		$self->{'error'} = "sendline: flush() failed: $!";
		return undef;
	}

	if (!defined $self->{'sock'}->blocking(0)) {
		#warn "sendline: blocking(1) failed: $!\n";
		$self->{'error'} = "sendline: blocking(1) failed: $!";
		return undef;
	}

	#warn "sent ($ret): $line\n";
	return $ret;
}
*/