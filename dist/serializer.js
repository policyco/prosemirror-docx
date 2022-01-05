"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocxSerializer = exports.DocxSerializerState = void 0;
const buffer_image_size_1 = __importDefault(require("buffer-image-size"));
const docx_1 = require("docx");
const cssToDocxStyle_1 = require("./cssToDocxStyle");
const numbering_1 = require("./numbering");
const utils_1 = require("./utils");
const MAX_IMAGE_WIDTH = 600;
class DocxSerializerState {
    constructor(nodes, marks, options) {
        this.footnotes = {};
        this.current = [];
        // not sure what this actually is, seems to be close for 8.5x11
        this.maxImageWidth = MAX_IMAGE_WIDTH;
        this.$footnoteCounter = 0;
        this.nodes = nodes;
        this.marks = marks;
        this.options = options !== null && options !== void 0 ? options : {};
        this.children = [];
        this.numbering = [];
    }
    renderContent(parent, opts) {
        parent.forEach((node, _, i) => {
            if (opts)
                this.addParagraphOptions(opts);
            this.render(node, parent, i);
        });
    }
    render(node, parent, index) {
        if (typeof parent === 'number')
            throw new Error('!');
        if (!this.nodes[node.type.name])
            throw new Error(`Token type \`${node.type.name}\` not supported by Word renderer`);
        this.nodes[node.type.name](this, node, parent, index);
    }
    renderMarks(node, marks) {
        return marks
            .map((mark) => {
            var _a, _b;
            return (_b = (_a = this.marks)[mark.type.name]) === null || _b === void 0 ? void 0 : _b.call(_a, this, node, mark);
        })
            .reduce((a, b) => (Object.assign(Object.assign({}, a), b)), {});
    }
    renderInline(parent) {
        var _a;
        const style = (0, cssToDocxStyle_1.cssToToDocxStyle)((_a = parent === null || parent === void 0 ? void 0 : parent.attrs) === null || _a === void 0 ? void 0 : _a.style);
        // Pop the stack over to this object when we encounter a link, and closeLink restores it
        let currentLink;
        const closeLink = () => {
            if (!currentLink)
                return;
            const hyperlink = new docx_1.ExternalHyperlink({
                link: currentLink.link,
                // child: this.current[0],
                children: this.current,
            });
            this.current = [...currentLink.stack, hyperlink];
            currentLink = undefined;
        };
        const openLink = (href) => {
            const sameLink = href === (currentLink === null || currentLink === void 0 ? void 0 : currentLink.link);
            this.addRunOptions({ style: 'Hyperlink' });
            // TODO: https://github.com/dolanmiu/docx/issues/1119
            // Remove the if statement here and oneLink!
            const oneLink = true;
            if (!oneLink) {
                closeLink();
            }
            else {
                if (currentLink && sameLink)
                    return;
                if (currentLink && !sameLink) {
                    // Close previous, and open a new one
                    closeLink();
                }
            }
            currentLink = {
                link: href,
                stack: this.current,
            };
            this.current = [];
        };
        const progress = (node, offset, index) => {
            const links = node.marks.filter((m) => m.type.name === 'link');
            const hasLink = links.length > 0;
            if (hasLink) {
                openLink(links[0].attrs.href);
            }
            else if (!hasLink && currentLink) {
                closeLink();
            }
            if (node.isText) {
                const marks = this.renderMarks(node, node.marks);
                this.text(node.text, Object.assign(Object.assign({}, marks), style));
            }
            else {
                this.render(node, parent, index);
            }
        };
        parent.forEach(progress);
        // Must call close at the end of everything, just in case
        closeLink();
    }
    renderList(node, style) {
        if (!this.currentNumbering) {
            const nextId = (0, utils_1.createShortId)();
            this.numbering.push((0, numbering_1.createNumbering)(nextId, style));
            this.currentNumbering = { reference: nextId, level: 0 };
        }
        else {
            const { reference, level } = this.currentNumbering;
            this.currentNumbering = { reference, level: level + 1 };
        }
        this.renderContent(node);
        if (this.currentNumbering.level === 0) {
            delete this.currentNumbering;
        }
        else {
            const { reference, level } = this.currentNumbering;
            this.currentNumbering = { reference, level: level - 1 };
        }
    }
    // This is a pass through to the paragraphs, etc. underneath they will close the block
    renderListItem(node) {
        if (!this.currentNumbering)
            throw new Error('Trying to create a list item without a list?');
        this.addParagraphOptions({ numbering: this.currentNumbering });
        this.renderContent(node);
    }
    addParagraphOptions(opts) {
        this.nextParentParagraphOpts = Object.assign(Object.assign({}, this.nextParentParagraphOpts), opts);
    }
    addRunOptions(opts) {
        this.nextRunOpts = Object.assign(Object.assign({}, this.nextRunOpts), opts);
    }
    text(text, opts) {
        if (!text)
            return;
        this.current.push(new docx_1.TextRun(Object.assign(Object.assign({ text }, this.nextRunOpts), opts)));
        delete this.nextRunOpts;
    }
    math(latex, opts = { inline: true }) {
        var _a;
        if (opts.inline || !opts.numbered) {
            this.current.push(new docx_1.Math({ children: [new docx_1.MathRun(latex)] }));
            return;
        }
        const id = (_a = opts.id) !== null && _a !== void 0 ? _a : (0, utils_1.createShortId)();
        this.current = [
            new docx_1.TextRun('\t'),
            new docx_1.Math({
                children: [new docx_1.MathRun(latex)],
            }),
            new docx_1.TextRun('\t('),
            new docx_1.Bookmark({
                id,
                children: [new docx_1.SequentialIdentifier('Equation')],
            }),
            new docx_1.TextRun(')'),
        ];
        this.addParagraphOptions({
            tabStops: [
                {
                    type: docx_1.TabStopType.CENTER,
                    position: docx_1.TabStopPosition.MAX / 2,
                },
                {
                    type: docx_1.TabStopType.RIGHT,
                    position: docx_1.TabStopPosition.MAX,
                },
            ],
        });
    }
    defaultGetImageBuffer(src) {
        return Buffer.from(src);
    }
    image(src, widthPercent = 70, align = 'center') {
        var _a;
        let getImageBuffer = this.defaultGetImageBuffer;
        if (typeof ((_a = this === null || this === void 0 ? void 0 : this.options) === null || _a === void 0 ? void 0 : _a.getImageBuffer) === 'function') {
            getImageBuffer = this.options.getImageBuffer;
        }
        const buffer = getImageBuffer(src);
        const dimensions = (0, buffer_image_size_1.default)(buffer);
        const aspect = dimensions.height / dimensions.width;
        const width = this.maxImageWidth * (widthPercent / 100);
        this.current.push(new docx_1.ImageRun({
            data: buffer,
            transformation: {
                width,
                height: width * aspect,
            },
        }));
        let alignment;
        switch (align) {
            case 'right':
                alignment = docx_1.AlignmentType.RIGHT;
                break;
            case 'left':
                alignment = docx_1.AlignmentType.LEFT;
                break;
            default:
                alignment = docx_1.AlignmentType.CENTER;
        }
        this.addParagraphOptions({
            alignment,
        });
    }
    table(node) {
        const actualChildren = this.children;
        const rows = [];
        // don't carry over any past formatting
        delete this.nextRunOpts;
        node.content.forEach(({ content: rowContent }) => {
            const cells = [];
            // Check if all cells are headers in this row
            let tableHeader = true;
            rowContent.forEach((cell) => {
                if (cell.type.name !== 'table_header') {
                    tableHeader = false;
                }
            });
            // This scales images inside of tables
            this.maxImageWidth = MAX_IMAGE_WIDTH / rowContent.childCount;
            rowContent.forEach((cell) => {
                var _a, _b;
                this.children = [];
                this.renderContent(cell);
                const tableCellOpts = { children: this.children };
                const colspan = (_a = cell.attrs.colspan) !== null && _a !== void 0 ? _a : 1;
                const rowspan = (_b = cell.attrs.rowspan) !== null && _b !== void 0 ? _b : 1;
                if (colspan > 1)
                    tableCellOpts.columnSpan = colspan;
                if (rowspan > 1)
                    tableCellOpts.rowSpan = rowspan;
                cells.push(new docx_1.TableCell(tableCellOpts));
            });
            rows.push(new docx_1.TableRow({ children: cells, tableHeader }));
        });
        this.maxImageWidth = MAX_IMAGE_WIDTH;
        const table = new docx_1.Table({ rows });
        actualChildren.push(table);
        // If there are multiple tables, this seperates them
        actualChildren.push(new docx_1.Paragraph(''));
        this.children = actualChildren;
    }
    captionLabel(id, kind) {
        this.current.push(new docx_1.Bookmark({
            id,
            children: [new docx_1.TextRun(`${kind} `), new docx_1.SequentialIdentifier(kind)],
        }));
    }
    footnote(node) {
        const { current, nextRunOpts } = this;
        // Delete everything and work with the footnote inline on the current
        this.current = [];
        delete this.nextRunOpts;
        this.$footnoteCounter += 1;
        this.renderInline(node);
        this.footnotes[this.$footnoteCounter] = {
            children: [new docx_1.Paragraph({ children: this.current })],
        };
        this.current = current;
        this.nextRunOpts = nextRunOpts;
        this.current.push(new docx_1.FootnoteReferenceRun(this.$footnoteCounter));
    }
    setStyle(node) {
        var _a;
        if (!((_a = node === null || node === void 0 ? void 0 : node.attrs) === null || _a === void 0 ? void 0 : _a.class)) {
            return;
        }
        let alignment;
        switch (node.attrs.class) {
            case 'text-right':
                alignment = docx_1.AlignmentType.RIGHT;
                break;
            case 'text-left':
                alignment = docx_1.AlignmentType.LEFT;
                break;
            default:
                alignment = docx_1.AlignmentType.CENTER;
        }
        this.addParagraphOptions({
            alignment,
        });
    }
    closeBlock(node, props) {
        const paragraph = new docx_1.Paragraph(Object.assign(Object.assign({ children: this.current }, this.nextParentParagraphOpts), props));
        this.current = [];
        delete this.nextParentParagraphOpts;
        delete this.nextRunOpts;
        this.children.push(paragraph);
    }
    createReference(id, before, after) {
        const children = [];
        if (before)
            children.push(new docx_1.TextRun(before));
        children.push(new docx_1.SimpleField(`REF ${id} \\h`));
        if (after)
            children.push(new docx_1.TextRun(after));
        const ref = new docx_1.InternalHyperlink({ anchor: id, children });
        this.current.push(ref);
    }
}
exports.DocxSerializerState = DocxSerializerState;
class DocxSerializer {
    constructor(nodes, marks) {
        this.nodes = nodes;
        this.marks = marks;
    }
    serialize(content, options) {
        const state = new DocxSerializerState(this.nodes, this.marks, options);
        state.renderContent(content);
        return (0, utils_1.createDocFromState)(state);
    }
}
exports.DocxSerializer = DocxSerializer;
//# sourceMappingURL=serializer.js.map