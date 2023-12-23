import { Type } from 'class-transformer';
import { WalletFile } from './WalletFile';
import 'reflect-metadata';

export default class CardRequest {
    code: string;
    type: string;
    discovered: boolean;
    redactedEntered: string;
    redactedScanned: string;

    @Type(() => WalletFile)
    files: WalletFile[] = [];
}