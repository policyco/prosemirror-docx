"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatexFromNode = exports.writeToBuffer = exports.writeDocx = exports.createDocFromState = exports.createShortId = void 0;
const docx_1 = require("docx");
function createShortId() {
    return Math.random().toString(36).substr(2, 9);
}
exports.createShortId = createShortId;
const footerStyleDefinition = { style: docx_1.BorderStyle.NONE, size: undefined, color: 'FFFFFF' };
const footerBorders = {
    top: footerStyleDefinition,
    left: footerStyleDefinition,
    right: footerStyleDefinition,
    bottom: footerStyleDefinition,
};
function createDocFromState(state) {
    var _a, _b, _c, _d;
    const titleTOC = ((_a = state === null || state === void 0 ? void 0 : state.options) === null || _a === void 0 ? void 0 : _a.title) || '';
    const subTitleTOC = ((_b = state === null || state === void 0 ? void 0 : state.options) === null || _b === void 0 ? void 0 : _b.subTitle) || '';
    let footerLeftText = '';
    if (titleTOC && subTitleTOC) {
        footerLeftText = `${subTitleTOC} • ${titleTOC}`;
    }
    else if (titleTOC && !subTitleTOC) {
        footerLeftText = titleTOC;
    }
    else if (!titleTOC && subTitleTOC) {
        footerLeftText = subTitleTOC;
    }
    if (state.options.internalUseText) {
        footerLeftText += ` • ${state.options.internalUseText}`;
    }
    const footerTable = new docx_1.Table({
        width: {
            size: 100,
            type: docx_1.WidthType.PERCENTAGE,
        },
        rows: [
            new docx_1.TableRow({
                children: [
                    new docx_1.TableCell({
                        width: {
                            size: 70,
                            type: docx_1.WidthType.AUTO,
                        },
                        children: [
                            new docx_1.Paragraph({
                                alignment: docx_1.AlignmentType.LEFT,
                                text: footerLeftText,
                            }),
                        ],
                        columnSpan: 1,
                        borders: footerBorders,
                    }),
                    new docx_1.TableCell({
                        width: {
                            size: 30,
                            type: docx_1.WidthType.AUTO,
                        },
                        children: [
                            new docx_1.Paragraph({
                                alignment: docx_1.AlignmentType.RIGHT,
                                children: [
                                    new docx_1.TextRun({
                                        children: ['Page ', docx_1.PageNumber.CURRENT, ' of ', docx_1.PageNumber.TOTAL_PAGES],
                                    }),
                                ],
                            }),
                        ],
                        columnSpan: 1,
                        borders: footerBorders,
                    }),
                ],
            }),
        ],
    });
    const footer = ((_c = state === null || state === void 0 ? void 0 : state.options) === null || _c === void 0 ? void 0 : _c.footer) ? footerTable : new docx_1.TextRun({});
    const pageTitleTOC = new docx_1.Paragraph({
        children: [
            new docx_1.TextRun({
                text: state.options.title,
                size: 60,
                bold: true,
                break: 1,
            }),
            new docx_1.TextRun({
                text: ((_d = state === null || state === void 0 ? void 0 : state.options) === null || _d === void 0 ? void 0 : _d.subTitle) || '',
                size: 50,
                italics: true,
                break: 1,
            }),
            new docx_1.TextRun({
                text: '',
                break: 1,
            }),
        ],
    });
    const toc = new docx_1.TableOfContents('Summary', {
        hyperlink: true,
    });
    const pageBreak = new docx_1.Paragraph({
        pageBreakBefore: true,
    });
    const children = [pageTitleTOC, toc, pageBreak].concat(state.children);
    const doc = new docx_1.Document({
        footnotes: state.footnotes,
        numbering: {
            config: state.numbering,
        },
        features: {
            updateFields: true,
        },
        sections: [
            {
                footers: {
                    default: new docx_1.Footer({
                        children: [
                            new docx_1.Paragraph({
                                alignment: docx_1.AlignmentType.LEFT,
                                children: [footer],
                            }),
                        ],
                    }),
                },
                properties: {
                    type: docx_1.SectionType.CONTINUOUS,
                },
                children,
            },
        ],
    });
    return doc;
}
exports.createDocFromState = createDocFromState;
function writeDocx(doc, write) {
    return __awaiter(this, void 0, void 0, function* () {
        const buffer = yield docx_1.Packer.toBuffer(doc);
        return write(buffer);
    });
}
exports.writeDocx = writeDocx;
function writeToBuffer(doc) {
    return docx_1.Packer.toBuffer(doc);
}
exports.writeToBuffer = writeToBuffer;
function getLatexFromNode(node) {
    let math = '';
    node.forEach((child) => {
        if (child.isText)
            math += child.text;
        // TODO: improve this as we may have other things in the future
    });
    return math;
}
exports.getLatexFromNode = getLatexFromNode;
//# sourceMappingURL=utils.js.map