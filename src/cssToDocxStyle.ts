import * as cssjson from 'cssjson';
import * as cssfontparser from 'cssfontparser';

const dpi = 96.0;
let defaultFontSize = 17;

function numericFontSize(fontSizeStr: string | undefined): number {
  if(!fontSizeStr) return 0;

  const matches = fontSizeStr.match(/([\.0-9]+)(.*)/);

  if (!matches) return 0;

  const sizeInt: number = parseFloat(matches[1]);
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

function convertPxToPt(val: number): number {
  return val * (72 / dpi);
}

function convertPxToTWIP(val: number): number {
  // TWIP = 1/1440 inch, units used in docx paragraph spacing property
  return (val / dpi) * 1440;
}

function getFontSize(str: string) {
  if (str) {
    const sizeInt = numericFontSize(str);
    if (sizeInt) {
      const size = `${Math.round(convertPxToPt(sizeInt)).toLocaleString()}pt`;
      return { size };
    }
  }
  return null;
}

function getFontWeight(str: string) {
  if (str) {
    const strObj = `{"${str}": true}`;
    return JSON.parse(strObj);
  }
  return null;
}

function getFontObj(str: string) {
  if (str) {
    const obj = cssfontparser.default(str);
    const ret: any = {};
    if (obj?.size) {
      ret.size = `${Math.round(convertPxToPt(obj.size)).toString()}pt`;
    }
    if (obj?.family) {
      if (obj.family.length > 0) {
        ret.font = obj.family[0];
      }
    }
    if (obj?.color) {
      ret.color = obj.color;
    }
    return ret;
  }
  return null;
}

function getFontFamily(str: string) {
  if (str) {
    return { font: str };
  }
  return null;
}

function getMarginBottom(str: string) {
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
function getSizeInTWIP(str: string): string | null {
  if (str) {
    const sizeInt = numericFontSize(str);
    if (sizeInt) {
      return `${Math.round(convertPxToTWIP(sizeInt)).toLocaleString()}pt`;
    }
  }
  return null;
}

function getMargin(str: string) {
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

function xlateToTextRunOptions(key: string, value: string) {
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

function xlateToParagraphOptions(key: string, value: string) {
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

function getDefaultOptionsForClass(nodeClass: string) {
  const margin = 30;
  switch (nodeClass) {
    case 'control-header':
      return {
        spacing: {
          after: `${Math.round(convertPxToTWIP(margin)).toLocaleString()}`,
          before: `${Math.round(convertPxToTWIP(margin)).toLocaleString()}`,
        },
      };
    default:
      return null;
  }
}

export function convert(cssString: string, fontSize: number | undefined, nodeClass: string | null) {
  const cssObj = cssjson.toJSON(cssString);
  const styleObj = cssObj?.attributes;
  if (!styleObj) {
    return {};
  }
  defaultFontSize = fontSize || defaultFontSize;

  let textRunOptions;
  let allTextRunOptions = {};
  let paragraphOptions;
  let allParagraphOptions = {};

  Object.entries(styleObj).map(([key, value]) => {
    // collect text run options
    textRunOptions = xlateToTextRunOptions(key, value as string);
    if (textRunOptions && typeof textRunOptions === 'object') {
      allTextRunOptions = { ...allTextRunOptions, ...textRunOptions };
    }
    // collect paragraph options
    paragraphOptions = xlateToParagraphOptions(key, value as string);
    if (paragraphOptions && typeof paragraphOptions === 'object') {
      allParagraphOptions = { ...allParagraphOptions, ...paragraphOptions };
    } else if (nodeClass) {
      const defaultClassOptions = getDefaultOptionsForClass(nodeClass);
      if(defaultClassOptions) {
        allParagraphOptions = { ...allParagraphOptions, ...defaultClassOptions };
      }
    }
    return true;
  });

  return {
    textRunOptions: allTextRunOptions,
    paragraphOptions: allParagraphOptions,
  };
}
