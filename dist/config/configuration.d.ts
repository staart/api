import { ConfigFactory } from '@nestjs/config/dist/interfaces';
import { Configuration } from './configuration.interface';
declare const configFunction: ConfigFactory<Configuration>;
export default configFunction;
