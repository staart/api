import { ConfigService } from '@nestjs/config';
import admin from 'firebase-admin';
export declare class FirebaseService {
    private configService;
    private logger;
    client: typeof admin;
    constructor(configService: ConfigService);
    addCollectionItem(collectionName: string, data: any): Promise<FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>>;
    updateCollectionItem(collectionName: string, doc: string, data: any): Promise<FirebaseFirestore.WriteResult>;
}
