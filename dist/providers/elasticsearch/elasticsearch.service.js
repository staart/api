"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ElasticSearchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElasticSearchService = void 0;
const elasticsearch_1 = require("@elastic/elasticsearch");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const aws_elasticsearch_connector_1 = __importDefault(require("aws-elasticsearch-connector"));
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const p_queue_1 = __importDefault(require("p-queue"));
const p_retry_1 = __importDefault(require("p-retry"));
let ElasticSearchService = ElasticSearchService_1 = class ElasticSearchService {
    constructor(configService) {
        var _a;
        this.configService = configService;
        this.logger = new common_1.Logger(ElasticSearchService_1.name);
        this.queue = new p_queue_1.default({ concurrency: 1 });
        this.elasticSearchConfig = this.configService.get('elasticSearch');
        this.deleteOldRecords = async (index, days) => {
            const now = new Date();
            now.setDate(now.getDate() - days);
            if (this.client)
                return this.client.deleteByQuery({
                    index,
                    body: {
                        query: {
                            bool: {
                                must: [
                                    {
                                        range: {
                                            date: {
                                                lte: now,
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                    },
                });
        };
        if ((_a = this.elasticSearchConfig.aws) === null || _a === void 0 ? void 0 : _a.accessKeyId) {
            aws_sdk_1.default.config.update({
                accessKeyId: this.elasticSearchConfig.aws.accessKeyId,
                secretAccessKey: this.elasticSearchConfig.aws.secretAccessKey,
                region: this.elasticSearchConfig.aws.region,
            });
            this.client = new elasticsearch_1.Client(Object.assign(Object.assign({}, aws_elasticsearch_connector_1.default(aws_sdk_1.default.config)), { node: this.elasticSearchConfig.node }));
        }
        else if (this.elasticSearchConfig.node)
            this.client = new elasticsearch_1.Client({
                auth: this.elasticSearchConfig.auth,
                node: this.elasticSearchConfig.node,
            });
        else
            this.logger.warn('ElasticSearch tracking is not enabled');
    }
    index(index, record, params) {
        if (this.client)
            this.queue
                .add(() => p_retry_1.default(() => this.indexRecord(index, record, params), {
                retries: this.elasticSearchConfig.retries,
                onFailedAttempt: (error) => {
                    this.logger.error(`Indexing record failed, retrying (${error.retriesLeft} attempts left)`, error.name);
                },
            }))
                .then(() => { })
                .catch(() => { });
    }
    search(params, options) {
        if (this.client)
            return this.client.search(params, options);
    }
    async indexRecord(index, record, params) {
        return this.client.index(Object.assign({ index, body: record }, params));
    }
};
ElasticSearchService = ElasticSearchService_1 = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ElasticSearchService);
exports.ElasticSearchService = ElasticSearchService;
//# sourceMappingURL=elasticsearch.service.js.map