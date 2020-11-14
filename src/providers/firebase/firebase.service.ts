import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import admin from 'firebase-admin';
import { Configuration } from '../../config/configuration.interface';

@Injectable()
export class FirebaseService {
  private logger = new Logger(FirebaseService.name);
  client = admin;

  constructor(private configService: ConfigService) {
    const config = this.configService.get<Configuration['firebase']>(
      'firebase',
    );
    if (config.serviceAccountKey)
      this.client.initializeApp({
        credential: this.client.credential.cert(
          typeof config.serviceAccountKey === 'string'
            ? JSON.parse(config.serviceAccountKey)
            : config.serviceAccountKey,
        ),
        databaseURL: config.databaseUrl,
      });
    else this.logger.warn('Firebase API key not found');
  }

  async addCollectionItem(collectionName: string, data: any) {
    const reference = this.client.firestore().collection(collectionName);
    return reference.add(data);
  }

  async updateCollectionItem(collectionName: string, doc: string, data: any) {
    const reference = this.client
      .firestore()
      .collection(collectionName)
      .doc(doc);
    return reference.update(data);
  }
}
