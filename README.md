# js-aprs-is

APRS is a registered trademark Bob Bruninga, WB4APR.

This project will attempt to provide a node version of the perl-aprs-fap/HAM::APRS::FAP IS class/module.  Over time, it is likely this will diverge from the original code due to platforms, but will attempt to keep usage straightforward and similar where applicable.  The biggest difference will be the usage of a push rather than pull paradigm, which will also negate the need for some methods/functions.

* This project is only intended to communicate with JavAPRS-IS and APRS-C servers, not TNCs.
* This project only provides ability to connect to an APRS-IS server.  Parsing functionality will be provided by another library.

## USAGE
### npm (for now)
npm install git://github.com/KD0NKS/js-aprs-is.git --save

### typescript
* import
import ISSocket from 'js-aprs-is';

## TO CONSIDER
* Allow connections to IS server to automatically reconnect on failure?
  * The original client specified number of retries at a half second interval.

## SEE ALSO

* [perl-aprs-fap](https://github.com/hessu/perl-aprs-fap)
* [C library port of Ham::APRS::FAP](http://pakettiradio.net/libfap/)
* [Python bindings for libfap](http://github.com/kd7lxl/python-libfap)

## COPYRIGHT AND LICENCE

Copyright(c) 2017 Andrew Fairhurst

### ORIGINAL COPYRIGHT

* Copyright (C) 2005-2012 Tapio Sokura
* Copyright (C) 2007-2012 Heikki Hannikainen @hessu

This library is free software; you can redistribute it and/or modify
it under the same terms as Perl itself.
