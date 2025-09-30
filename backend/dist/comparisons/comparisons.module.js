"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComparisonsModule = void 0;
const common_1 = require("@nestjs/common");
const comparisons_gateway_1 = require("./comparisons.gateway");
const prisma_module_1 = require("../prisma/prisma.module");
const openai_service_1 = require("../services/openai.service");
const anthropic_service_1 = require("../services/anthropic.service");
const jwt_1 = require("@nestjs/jwt");
let ComparisonsModule = class ComparisonsModule {
};
exports.ComparisonsModule = ComparisonsModule;
exports.ComparisonsModule = ComparisonsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET || 'supersecretkey',
            }),
        ],
        providers: [comparisons_gateway_1.ComparisonsGateway, openai_service_1.OpenaiService, anthropic_service_1.AnthropicService],
    })
], ComparisonsModule);
//# sourceMappingURL=comparisons.module.js.map