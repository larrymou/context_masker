"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.infrastructurePatterns = void 0;
exports.infrastructurePatterns = [
    {
        name: 'database_url',
        regex: /\b(?:postgres(?:ql)?|mysql|mongodb|redis):\/\/[^\s"']+/gi,
        placeholder: () => '<<DB_URL:***>>',
        category: 'infrastructure',
    },
    {
        name: 'redis_url',
        regex: /\bredis:\/\/[^\s"']+/gi,
        placeholder: () => '<<REDIS:***>>',
        category: 'infrastructure',
    },
    {
        name: 'private_key',
        regex: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC )?PRIVATE KEY-----/g,
        placeholder: () => '<<PRIVATE_KEY:***>>',
        category: 'infrastructure',
    },
];
