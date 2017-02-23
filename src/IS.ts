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
 * @AUTHORS
 * Andrew Fairhurst, KD0NKS
 *
 * @AUTHORS
 * Matti Aarnio, OH2MQK
 * Heikki Hannikainen, OH7LZB hessu@hes.iki.fiE<gt>
 *
 * @Copyright
 * Copyright 2000-3000 by Matti Aarnio
 * Copyright 2000-3000 by Heikki Hannikainen
 *
 * This library is free software; you can redistribute it and/or modify
 * it under the same terms as Perl itself.
 *
 *
 * TODO: UPDATE USAGE EXAMPLE, ADD TO WIKI
 * my $is = new Ham::APRS::IS('aprs.example.com:12345', 'N0CALL', 'appid' => 'IS-pm-test 1.0');
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
    private isSocketConnected: boolean;

    // TODO: auto reconnect?


	/**
     * @summary
     * Initializes a new JS-APRS-IS socket. Takes two mandatory arguments,
     * the host:port pair to connect to and your client's callsign, and one or more
     * optional named options:
     *
     * @param {string} host - APRS-IS server to connect to.
     * @param {number} port - Port number of the APRS-IS server to connect to.
     * @param {string} [callsign=N0CALL] - Your station's callsign.
     * @param {number} [passcode=-1] - An APRS-IS passcode.
     * @param {string} [filter] - An APRS-IS filter string sent to the server.
     * @param {string} [appid=IS.js 0.01] - Your application's name and version number direction finding.
     * @param {boolean} [isTransmitEnabled=false] - Whether or not to allow the connection to transmit any packets other than a login message.
     *
     * @example
     * let connection = new IS('aprs.server.com', 12345);
     * let connection = new IS('aprs.server.com', 12345, 'N0CALL', undefined, undefined, 'myapp 3.4b');
     * let connection = new IS('aprs.server.com', 12345, 'N0CALL', undefined, 'f/*', 'foobar 42');
     * let connection = new IS('aprs.server.com', 12345, 'N0CALL', 1234, 'f/*', 'myapp 1.2', true);
	 */
    // Don't provide multiple constructors.  Passing undefined parameters is annoying, but ideally, most, if not all
    // parameters should be used anyway.
	constructor(public host: string
            , public port: number
            , public callsign = "N0CALL"
            , public passcode = -1
            , public filter?: string
            , public appId = `IS.js ${VERSION}`
            , public isTransmitEnabled = false) {
		super();

        this.isSocketConnected = false;

        // TODO: Do we want to throw errors if the host, port, callsign, are null?
	}

/*
=head1 connect(options)

Connects to the server. Returns 1 on success, 0 on failure.
Takes an optional options hash as a parameter. Currently knows only one parameter,
retryuntil, which specifies the number of seconds to retry the connection. After
each failed attempt the code sleeps for 0.5 seconds before trying again. Defaults
to 0 (no retries).

  $is->connect('retryuntil' => 10) || die "Failed to connect: $is->{error}";

=cut
*/
	connect() { //sub connect($;%)
        /*
	my($self) = shift;

	my %options = @_;

	if ($self->{'state'} eq 'connected') {
		$self->{'error'} = 'Already connected';
		return 0;
	}

	$self->{'ibuf'} = '';

	my $retryuntil = defined $options{'retryuntil'} ? $options{'retryuntil'} : 0;
	my $starttime = time();

	while (!defined $self->{'sock'}) {
		$self->{'sock'} = IO::Socket::INET->new($self->{'host_port'});

		if (!defined($self->{'sock'})) {
			$self->{'error'} = "Failed to connect to $self->{host_port}: $!";

			if (time() - $starttime >= $retryuntil) {
				return 0;
			}

			select(undef, undef, undef, 0.5);
		}
	}

	$self->{'error'} = 'Connected successfully';

	#   printf ( "APRS::IS->new()  mycall='%s'  passcode=%d   filterre='%s'\n",
	#            $self->{aprsmycall}, $self->{passcode}, $self->{filterre} );

	##
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
	##

	$self->{'sock'}->blocking(1);
	$self->{'state'} = 'connected';

	my $s = $self->user_command();

	#warn "login: $s\n";
	if (!$self->{'sock'}->print($s)) {
		$self->{'error'} = "Failed to write login command to $self->{host_port}: $!";
		return 0;
	}

	if (!$self->{'sock'}->flush) {
		$self->{'error'} = "Failed to flush login command to $self->{host_port}: $!";
		return 0;
	}

	$self->{'sock'}->blocking(0);

	my $t = time();
	while (my $l = $self->getline()) {
		return 1 if ($l =~ /^#\s+logresp\s+/);
		if (time() - $t > 5) {
			$self->{'error'} = "Login command timed out";
			return 0;
		}
	}

	return 1;
*/
    }

/*
=head1 disconnect( )

Disconnects from the server. Returns 1 on success, 0 on failure.

  $is->disconnect() || die "Failed to disconnect: $is->{error}";

=cut
*/
	disconnect() {  //sub disconnect($)
        /*
        my($self) = @_;

	if (defined $self->{'sock'}) {
		$self->{'sock'}->close;
		undef $self->{'sock'};
	}

	$self->{'state'} = 'disconnected';

	return 1;
    */
    }

/*
=head1 connected( )

Checks whether we're connected currently. Returns 1 for connected, 0 for not connected.

=cut
*/
	isConnected() { //sub connected($)
        /*
        my($self) = @_;

        return 1 if $self->{'state'} eq 'connected';
        return 0;
        */

        return this.socket === null;
    }
}

/*
use 5.006;
use strict;
use warnings;

use Time::HiRes qw( time sleep );
use IO::Handle '_IOFBF';
use IO::Socket::INET;
use IO::Select;




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

# -------------------------------------------------------------------------
# Get a line (blocking)

=head1 getline(timeout)

Reads a line from the server (blocking). Returns the line read,
or undefined if the reading fails. Takes an optional timeout argument,
which tells getline to stop reading after the specified amount of
secounds. The timeout defaults to 5 seconds.

  $l = $is->getline();
  die "Failed to read: $is->{error}" if (!defined $l);

The returned line does not contain the <CR><LF> line feed used as a
separator between packets on the APRS-IS.

=cut


sub getline($;$)
{
	my($self, $timeout) = @_;

	if ($self->{'state'} ne 'connected') {
		$self->{'error'} = "getline: not connected";
		return undef;
	}

	$timeout = 5 if (!defined $timeout);

	my $end_t = time() + $timeout;
	my $sock = $self->{'sock'};

	while (1) {
		if ($self->{'ibuf'} =~ s/^(.*?)[\r\n]+//s) {
			#warn "got: $1\n";
			return $1;
		}

		if (time() > $end_t) {
			$self->{'error'} = "getline: timeout";
			return undef;
		}

		my($rin, $rout, $ein, $eout) = ('', '', '', '');
		vec($rin, fileno($sock), 1) = 1;
		$ein = $rin;
		my $nfound = select($rout = $rin, undef, $eout = $ein, 1);

		if (($nfound) && ($rout)) {
			my $rbuf;
			my $nread = sysread($sock, $rbuf, 1024);
			if ($nread > 0) {
				$self->{'ibuf'} .= $rbuf;
			} elsif ($nread < 1) {
				$self->{'error'} = "Failed to read from server: $!";

				$self->disconnect();
				return undef;
			}
		} elsif (($nfound) && ($eout)) {
			$self->{'error'} = "Failed to read from server (select returned errors): $!";
			#warn "getline: read error (on select)\n";
			$self->disconnect();
			return undef;
		}
	}
}

=head1 getline_noncomment(timeout)

Like getline, but only returns noncomment lines (ones which do not
begin with a '#' character). The server normally transmits keep-alive timestamp
messages, error and status messages as comments.

=cut

sub getline_noncomment($;$)
{
	my($self, $timeout) = @_;

	return undef if ($self->{'state'} ne 'connected');
	while (my $l = $self->getline($timeout)) {
		return $l if !defined $l;
		return $l if ($l !~ /^#/);
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

# aprspass($callsign)
#
# Calculates the APRS passcode for a given callsign. Ignores SSID
# and converts the callsign to uppercase as required. Returns an integer.
#
#  my $passcode = Ham::APRS::IS::aprspass($callsign);

sub aprspass($)
{
	my($call) = @_;

	$call =~ s/-([^\-]+)$//;
	$call = uc($call);

	my ($a, $h) = (0, 0);
	map($h ^= ord(uc) << ($a^=8), $call =~ m/./g);
	return (($h ^ 29666) & 65535);
}

=head1 sock()

Returns the perl socket used on the connection.

=cut

sub sock {
	my $self = shift;
	return $self->{sock};
}

1;
__END__
*/