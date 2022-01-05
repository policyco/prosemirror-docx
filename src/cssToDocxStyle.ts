import * as cssjson from 'cssjson';
import * as cssfontparser from 'cssfontparser';

const dpi = 96.0;

function numericFontSize(fontSizeStr: string): number | undefined {
  const parent = null;

  const matches = fontSizeStr.match(/([\.0-9]+)(.*)/);

  if (!matches) {
    return;
  }

  const sizeInt: number = parseFloat(matches[1]);
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

function convertPxToPt(val: number): number {
  return val * (72 / dpi);
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

function xlate(key: string, value: string) {
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

export function cssToToDocxStyle(cssString: string) {
  const cssObj = cssjson.toJSON(cssString);
  const styleObj = cssObj?.attributes;
  if (!styleObj) {
    return {};
  }

  let docxStyle = {};
  for (const [key, value] of Object.entries(styleObj)) {
    const retObj = xlate(key, value as string);
    if (retObj && typeof retObj === 'object') {
      docxStyle = { ...docxStyle, ...retObj };
    }
  }
  return docxStyle;
}

