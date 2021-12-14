"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDocFromState = exports.writeDocx = exports.defaultMarks = exports.defaultNodes = exports.defaultDocxSerializer = exports.DocxSerializer = exports.DocxSerializerState = void 0;
var serializer_1 = require("./serializer");
Object.defineProperty(exports, "DocxSerializerState", { enumerable: true, get: function () { return serializer_1.DocxSerializerState; } });
Object.defineProperty(exports, "DocxSerializer", { enumerable: true, get: function () { return serializer_1.DocxSerializer; } });
var schema_1 = require("./schema");
Object.defineProperty(exports, "defaultDocxSerializer", { enumerable: true, get: function () { return schema_1.defaultDocxSerializer; } });
Object.defineProperty(exports, "defaultNodes", { enumerable: true, get: function () { return schema_1.defaultNodes; } });
Object.defineProperty(exports, "defaultMarks", { enumerable: true, get: function () { return schema_1.defaultMarks; } });
var utils_1 = require("./utils");
Object.defineProperty(exports, "writeDocx", { enumerable: true, get: function () { return utils_1.writeDocx; } });
Object.defineProperty(exports, "createDocFromState", { enumerable: true, get: function () { return utils_1.createDocFromState; } });
//# sourceMappingURL=index.js.map