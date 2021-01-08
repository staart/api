import { User } from '@prisma/client';
import { Expose } from '../../providers/prisma/prisma.interface';
import { EnableSmsMfaDto, EnableTotpMfaDto } from './multi-factor-authentication.dto';
import { MultiFactorAuthenticationService } from './multi-factor-authentication.service';
export declare class MultiFactorAuthenticationController {
    private multiFactorAuthenticationService;
    constructor(multiFactorAuthenticationService: MultiFactorAuthenticationService);
    regenerateBackupCodes(userId: number): Promise<string[]>;
    disable2FA(userId: number): Promise<Expose<User>>;
    enableTotp(userId: number, body: EnableTotpMfaDto): Promise<string[] | string>;
    enableSms(userId: number, body: EnableSmsMfaDto): Promise<string[] | void>;
    enableEmail(userId: number, body: EnableTotpMfaDto): Promise<string[] | void>;
}
