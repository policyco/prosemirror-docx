"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cssToToDocxStyle = void 0;
const cssjson = __importStar(require("cssjson"));
const cssfontparser = __importStar(require("cssfontparser"));
const dpi = 96.0;
function numericFontSize(fontSizeStr) {
    const parent = null;
    const matches = fontSizeStr.match(/([\.0-9]+)(.*)/);
    if (!matches) {
        return;
    }
    const sizeInt = parseFloat(matches[1]);
    const units = matches[2].toLowerCase().trim();
    const val = Math.round(sizeInt);
    switch (units) {
        case 'em':
            if (parent === null) {
                return;
            }
            return val * parent;
            break;
        case 'px':
            return val;
            break;
        case 'pt':
            return val / (72 / dpi);
            break;
        case 'pc':
            return val / (6 / dpi);
            break;
        case 'mm':
            return val * (dpi / 25.4);
            break;
        case 'cm':
            return val * (dpi / 2.54);
            break;
        case 'in':
            return val * dpi;
            break;
        case '%':
            if (parent === null) {
                return;
            }
            return parent * (val / 100);
            break;
    }
}
function convertPxToPt(val) {
    return val * (72 / dpi);
}
function getFontSize(str) {
    if (str) {
        const sizeInt = numericFontSize(str);
        if (sizeInt) {
            const size = `${Math.round(convertPxToPt(sizeInt)).toLocaleString()}pt`;
            return { size };
        }
    }
    return null;
}
function getFontWeight(str) {
    if (str) {
        const strObj = `{"${str}": true}`;
        return JSON.parse(strObj);
    }
    return null;
}
function getFontObj(str) {
    if (str) {
        const obj = cssfontparser.default(str);
        const ret = {};
        if (obj === null || obj === void 0 ? void 0 : obj.size) {
            ret.size = `${Math.round(convertPxToPt(obj.size)).toString()}pt`;
        }
        if (obj === null || obj === void 0 ? void 0 : obj.family) {
            if (obj.family.length > 0) {
                ret.font = obj.family[0];
            }
        }
        if (obj === null || obj === void 0 ? void 0 : obj.color) {
            ret.color = obj.color;
        }
        return ret;
    }
    return null;
}
function getFontFamily(str) {
    if (str) {
        return { font: str };
    }
    return null;
}
function xlate(key, value) {
    const ret = {};
    switch (key) {
        case 'text-align': // left
            break;
        case 'font-size': // 13pt
            const fontSize = getFontSize(value);
            if (fontSize) {
                return fontSize;
            }
            break;
        case 'font-weight': // bold
            const fontWeight = getFontWeight(value);
            if (fontWeight) {
                return fontWeight;
            }
            break;
        case 'font': // 700 13pt Inter, sans-serif
            const fontObj = getFontObj(value);
            if (fontObj) {
                return fontObj;
            }
            break;
        case 'font-family': // Inter
            const fontFamily = getFontFamily(value);
            if (fontFamily) {
                return fontFamily;
            }
            break;
        case 'margin-bottom': // 50px
            break;
        default:
            break;
    }
    return null;
}
function cssToToDocxStyle(cssString) {
    const cssObj = cssjson.toJSON(cssString);
    const styleObj = cssObj === null || cssObj === void 0 ? void 0 : cssObj.attributes;
    if (!styleObj) {
        return {};
    }
    let docxStyle = {};
    for (const [key, value] of Object.entries(styleObj)) {
        const retObj = xlate(key, value);
        if (retObj && typeof retObj === 'object') {
            docxStyle = Object.assign(Object.assign({}, docxStyle), retObj);
        }
    }
    return docxStyle;
}
exports.cssToToDocxStyle = cssToToDocxStyle;
//# sourceMappingURL=cssToDocxStyle.js.map