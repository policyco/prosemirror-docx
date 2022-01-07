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
exports.convert = void 0;
const cssjson = __importStar(require("cssjson"));
const cssfontparser = __importStar(require("cssfontparser"));
const dpi = 96.0;
let defaultFontSize = 17;
function numericFontSize(fontSizeStr) {
    if (!fontSizeStr)
        return 0;
    const matches = fontSizeStr.match(/([\.0-9]+)(.*)/);
    if (!matches)
        return 0;
    const sizeInt = parseFloat(matches[1]);
    const units = matches[2].toLowerCase().trim();
    const val = Math.round(sizeInt);
    switch (units) {
        case 'em':
        case 'rem':
            return val * defaultFontSize;
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
            return defaultFontSize * (val / 100);
            break;
    }
    return 0;
}
function convertPxToPt(val) {
    return val * (72 / dpi);
}
function convertPxToTWIP(val) {
    // TWIP = 1/1440 inch, units used in docx paragraph spacing property
    return (val / dpi) * 1440;
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
function getMarginBottom(str) {
    if (str) {
        const sizeInt = numericFontSize(str);
        if (sizeInt) {
            return {
                spacing: {
                    after: `${Math.round(convertPxToTWIP(sizeInt)).toLocaleString()}`,
                },
            };
        }
    }
    return null;
}
// given a size 15px, 1em, ... convert to TWIP
function getSizeInTWIP(str) {
    if (str) {
        const sizeInt = numericFontSize(str);
        if (sizeInt) {
            return `${Math.round(convertPxToTWIP(sizeInt)).toLocaleString()}pt`;
        }
    }
    return null;
}
function getMargin(str) {
    const bits = str.split(/[ ]./);
    switch (bits.length) {
        case 1:
            return {
                spacing: {
                    before: Math.round(convertPxToTWIP(numericFontSize(bits[0]))),
                    after: Math.round(convertPxToTWIP(numericFontSize(bits[0]))),
                },
                indent: {
                    left: Math.round(convertPxToTWIP(numericFontSize(bits[0]))),
                },
            };
            break;
        case 2:
            return {
                spacing: {
                    before: Math.round(convertPxToTWIP(numericFontSize(bits[0]))),
                    after: Math.round(convertPxToTWIP(numericFontSize(bits[0]))),
                },
                indent: {
                    left: Math.round(convertPxToTWIP(numericFontSize(bits[1]))),
                },
            };
            break;
        case 3:
            return {
                spacing: {
                    before: Math.round(convertPxToTWIP(numericFontSize(bits[0]))),
                    after: Math.round(convertPxToTWIP(numericFontSize(bits[2]))),
                },
                indent: {
                    left: Math.round(convertPxToTWIP(numericFontSize(bits[1]))),
                },
            };
            break;
        case 4:
            return {
                spacing: {
                    before: Math.round(convertPxToTWIP(numericFontSize(bits[0]))),
                    after: Math.round(convertPxToTWIP(numericFontSize(bits[2]))),
                },
                indent: {
                    left: Math.round(convertPxToTWIP(numericFontSize(bits[3]))),
                },
            };
            break;
        default:
            return {};
            break;
    }
}
function xlateToTextRunOptions(key, value) {
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
        default:
            break;
    }
    return null;
}
function xlateToParagraphOptions(key, value) {
    const ret = {};
    switch (key) {
        case 'margin-bottom': // 50px
            return getMarginBottom(value);
            break;
        case 'margin': // 50px
            return getMargin(value);
            break;
        default:
            return {};
            break;
    }
    return {};
}
function convert(cssString, fontSize) {
    const cssObj = cssjson.toJSON(cssString);
    const styleObj = cssObj === null || cssObj === void 0 ? void 0 : cssObj.attributes;
    if (!styleObj) {
        return {};
    }
    defaultFontSize = fontSize || 17;
    let textRunOptions;
    let allTextRunOptions = {};
    let paragraphOptions;
    let allParagraphOptions = {};
    Object.entries(styleObj).map(([key, value]) => {
        // collect text run options
        textRunOptions = xlateToTextRunOptions(key, value);
        if (textRunOptions && typeof textRunOptions === 'object') {
            allTextRunOptions = Object.assign(Object.assign({}, allTextRunOptions), textRunOptions);
        }
        // collect paragraph options
        paragraphOptions = xlateToParagraphOptions(key, value);
        if (paragraphOptions && typeof paragraphOptions === 'object') {
            allParagraphOptions = Object.assign(Object.assign({}, allParagraphOptions), paragraphOptions);
        }
        return true;
    });
    return {
        textRunOptions: allTextRunOptions,
        paragraphOptions: allParagraphOptions,
    };
}
exports.convert = convert;
//# sourceMappingURL=cssToDocxStyle.js.map