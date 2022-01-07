"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultDocxSerializer = exports.defaultMarks = exports.defaultNodes = void 0;
const docx_1 = require("docx");
const serializer_1 = require("./serializer");
const utils_1 = require("./utils");
exports.defaultNodes = {
    text(state, node) {
        var _a;
        state.text((_a = node.text) !== null && _a !== void 0 ? _a : '');
    },
    paragraph(state, node) {
        state.setParagraphAlignmentFromClass(node);
        state.renderInline(node);
        state.closeBlock(node);
    },
    heading(state, node) {
        state.renderInline(node);
        const heading = [
            docx_1.HeadingLevel.HEADING_1,
            docx_1.HeadingLevel.HEADING_2,
            docx_1.HeadingLevel.HEADING_3,
            docx_1.HeadingLevel.HEADING_4,
            docx_1.HeadingLevel.HEADING_5,
            docx_1.HeadingLevel.HEADING_6,
        ][node.attrs.level - 1];
        // TODO pass margin in Header node
        state.closeBlock(node, { heading, spacing: { before: 500, after: 500 } });
    },
    blockquote(state, node) {
        state.renderContent(node, { style: 'IntenseQuote' });
    },
    code_block(state, node) {
        state.renderCodeBlock(node);
        state.closeBlock(node);
    },
    horizontal_rule(state, node) {
        // Kinda hacky, but this works to insert two paragraphs, the first with a break
        state.closeBlock(node, { thematicBreak: true });
        state.closeBlock(node);
    },
    hard_break(state) {
        state.addRunOptions({ break: 1 });
    },
    ordered_list(state, node) {
        state.renderList(node, 'numbered');
    },
    bullet_list(state, node) {
        state.renderList(node, 'bullets');
    },
    list_item(state, node) {
        state.renderListItem(node);
    },
    // Presentational
    image(state, node) {
        const { src } = node.attrs;
        state.image(src);
        state.closeBlock(node);
    },
    // Technical
    math(state, node) {
        state.math((0, utils_1.getLatexFromNode)(node), { inline: true });
    },
    equation(state, node) {
        const { id, numbered } = node.attrs;
        state.math((0, utils_1.getLatexFromNode)(node), { inline: false, numbered, id });
        state.closeBlock(node);
    },
    table(state, node) {
        state.table(node);
    },
};
exports.defaultMarks = {
    em() {
        return { italics: true };
    },
    strong() {
        return { bold: true };
    },
    link() {
        // Note, this is handled specifically in the serializer
        // Word treats links more like a Node rather than a mark
        return {};
    },
    code() {
        return {
            font: {
                name: 'Monospace',
            },
            color: '000000',
            shading: {
                type: docx_1.ShadingType.SOLID,
                color: 'D2D3D2',
                fill: 'D2D3D2',
            },
        };
    },
    abbr() {
        // TODO: abbreviation
        return {};
    },
    subscript() {
        return { subScript: true };
    },
    superscript() {
        return { subScript: true };
    },
    strikethrough() {
        // doubleStrike!
        return { strike: true };
    },
    underline() {
        return {
            underline: {},
        };
    },
    smallcaps() {
        return { smallCaps: true };
    },
    allcaps() {
        return { allCaps: true };
    },
};
exports.defaultDocxSerializer = new serializer_1.DocxSerializer(exports.defaultNodes, exports.defaultMarks);
//# sourceMappingURL=schema.js.map