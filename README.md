# js-aprs-is

APRS is a registered trademark Bob Bruninga, WB4APR.

This project will attempt to provide a node version of the perl-aprs-fap/HAM::APRS::FAP IS class/module.
Over time, it is likely this will diverge from the original code due to platforms and networks,
but will attempt to keep usage straightforward and similar where applicable.  The biggest
difference will be the usage of a push rather than pull paradigm, which will also negate the need for some
methods/functions.

This project is only intended to communicate with JavAPRS-IS and APRS-C servers, not TNCs.

## USAGE
### npm (for now)
npm install git://github.com/KD0NKS/js-aprs-is.git --save

Extends NodeJS Socket, which means this is not guranteed to deliver one APRS packet per tcp packet.  Buffering must be implemented when using.

``` javascript
let bufferedData = '';
let connection = new ISSocket("aprsserverurl", PORTNUMBER, "N0CALL", -1, FILTER);

// Probably not the best way, but good enough for now.  Still consumes world feed on low end computer.
connection.on('data', (data: Buffer) => {
    bufferedData += data.toString();
    let msgs = bufferedData.split('\r\n');

    if(!bufferedData.endsWith('\r\n')) {
        bufferedData = msgs[msgs.length - 1];
        msgs = msgs.slice(0, -1);
    } else {
        bufferedData = '';
        msgs = msgs.filter(msg => msg.trim() != '');
    }

    //...
}
```

### typescript
* import
import ISSocket from 'js-aprs-is';

* tsconfig.json
"include": [
    "src/IS.ts"
]


## TO CONSIDER
* Allow connections to IS server to automatically reconnect on failure?
  * The original client specified number of retries at a half second interval.
  * Internal packet buffering to emit single packets?

## SEE ALSO

* [perl-aprs-fap](https://github.com/hessu/perl-aprs-fap)
* [C library port of Ham::APRS::FAP](http://pakettiradio.net/libfap/)
* [Python bindings for libfap](http://github.com/kd7lxl/python-libfap)

## COPYRIGHT AND LICENCE

Copyright(c) 2017 Andrew Fairhurst

### ORIGINAL COPYRIGHT

* Copyright (C) 2005-2012 Tapio Sokura
* Copyright (C) 2007-2012 Heikki Hannikainen

This library is free software; you can redistribute it and/or modify
it under the same terms as Perl itself.
