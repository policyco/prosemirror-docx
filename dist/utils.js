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
exports.getLatexFromNode = exports.writeDocx = exports.createDocFromState = exports.createShortId = void 0;
const docx_1 = require("docx");
function createShortId() {
    return Math.random().toString(36).substr(2, 9);
}
exports.createShortId = createShortId;
function createDocFromState(state) {
    var _a;
    const toc = new docx_1.TableOfContents("Summary", {
        hyperlink: true,
    });
    const children = [toc].concat(state.children);
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
                                children: [
                                    new docx_1.TextRun(((_a = state === null || state === void 0 ? void 0 : state.options) === null || _a === void 0 ? void 0 : _a.footer) || ''),
                                    new docx_1.TextRun({
                                        children: [" Page ", docx_1.PageNumber.CURRENT],
                                    }),
                                ],
                            })
                        ],
                    }),
                },
                properties: {
                    type: docx_1.SectionType.CONTINUOUS,
                },
                children: children,
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