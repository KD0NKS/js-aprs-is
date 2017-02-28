/// <reference types="node" />
import { Socket } from 'net';
export default class ISSocket extends Socket {
    host: string;
    port: number;
    callsign: string;
    passcode: number;
    filter: string;
    appId: string;
    private isSocketConnected;
    constructor(host: string, port: number, callsign?: string, passcode?: number, filter?: string, appId?: string);
    connect(callback?: any): void;
    disconnect(callback?: any): void;
    sendLine(line: string): void;
    isConnected(): boolean;
    readonly userLogin: string;
}
