# js-aprs-is ![npm](https://img.shields.io/npm/v/js-aprs-is) [![Build Status](https://github.com/KD0NKS/js-aprs-is/actions/workflows/build-and-test.yml/badge.svg?branch=master)](https://github.com/KD0NKS/js-aprs-is/actions/workflows/build-and-test.yml) [![Coverage Status](https://coveralls.io/repos/github/KD0NKS/js-aprs-is/badge.svg?branch=master)](https://coveralls.io/github/KD0NKS/js-aprs-is?branch=master)  [![Codacy Badge](https://api.codacy.com/project/badge/Grade/afd6ae751d31433c8314c940f79afd01)](https://www.codacy.com/app/KD0NKS/js-aprs-is?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=KD0NKS/js-aprs-is&amp;utm_campaign=Badge_Grade) [![Known Vulnerabilities](https://snyk.io/test/github/KD0NKS/js-aprs-is/badge.svg)](https://snyk.io/test/github/KD0NKS/js-aprs-is)
APRS is a registered trademark Bob Bruninga, WB4APR.

This project will attempt to provide a node version of the perl-aprs-fap/HAM::APRS::FAP IS class/module.  Over time, it is likely this will diverge from the original code due to platforms, but will attempt to keep usage straightforward and similar where applicable.  The biggest difference will be the usage of a push rather than pull paradigm, which will also negate the need for some methods/functions.

* This project is only intended to communicate with JavAPRS-IS and APRS-C servers, not TNCs.
* This project only provides ability to connect to an APRS-IS server.  Parsing functionality can be provided by [https://github.com/KD0NKS/js-aprs-fap]https://github.com/KD0NKS/js-aprs-fap or another library.

## USAGE
### Demo
[https://github.com/KD0NKS/aprs-is-demo](https://github.com/KD0NKS/aprs-is-demo)

### npm
npm install js-aprs-is --save

Extends NodeJS Socket, which means this is not guranteed to deliver one APRS packet per tcp packet.  Buffering must be implemented when using.

### TypeScript
* import
import ISSocket from 'js-aprs-is';

### Using this the easy way
``` javascript
let connection = new ISSocket("aprsserverurl", PORTNUMBER, "N0CALL", -1, FILTER);

connection.on('packet', (data: string) => {
    // ...
});
```

### BYOB (Bring your own buffer)

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

## KNOWN ISSUES
* Timeout should be implemented.
  * Need to research timeout tollerance on APRS-IS servers.  30 seconds?
  * On timeout event, socket should automatically send login message.
  * Hook tests fail due to async issues.

## TO CONSIDER
* Allow connections to IS server to automatically reconnect on failure?
  * The original client specified number of retries at a half second interval.
  * Internal packet buffering to emit single packets?

## SEE ALSO

* [js-aprs-fap](https://github.com/KD0NKS/js-aprs-fap)
* [perl-aprs-fap](https://github.com/hessu/perl-aprs-fap)
* [C library port of Ham::APRS::FAP](http://pakettiradio.net/libfap/)
* [Python bindings for libfap](http://github.com/kd7lxl/python-libfap)

# ORIGINAL COPYRIGHT
* Copyright (C) 2005-2012 Tapio Sokura
* Copyright (C) 2007-2012 Heikki Hannikainen

This library is free software; you can redistribute it and/or modify
it under the same terms as Perl itself.
