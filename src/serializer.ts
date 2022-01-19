import sizeOf from "buffer-image-size";
import {
  AlignmentType,
  Bookmark,
  ExternalHyperlink,
  FootnoteReferenceRun,
  ImageRun,
  InternalHyperlink,
  IParagraphOptions,
  IRunOptions,
  ITableCellOptions,
  Math,
  MathRun,
  Paragraph,
  ParagraphChild,
  SequentialIdentifier,
  SimpleField,
  Table,
  TableCell,
  TableRow,
  TabStopPosition,
  TabStopType,
  TextRun
} from "docx";
import { Fragment, Mark, Node as ProsemirrorNode, Schema } from "prosemirror-model";
import * as cssToDocxStyle from "./cssToDocxStyle";
import { createNumbering, NumberingStyles } from "./numbering";
import { IFootnotes, INumbering, Mutable } from "./types";
import { createDocFromState, createShortId } from "./utils";

// This is duplicated from @curvenote/schema
export type AlignOptions = 'left' | 'center' | 'right';

export type NodeSerializer<S extends Schema = any> = Record<
  string,
  (
    state: DocxSerializerState<S>,
    node: ProsemirrorNode<S>,
    parent: ProsemirrorNode<S>,
    index: number,
  ) => void
>;

export type MarkSerializer<S extends Schema = any> = Record<
  string,
  (state: DocxSerializerState<S>, node: ProsemirrorNode<S>, mark: Mark<S>) => IRunOptions
>;

export type Options = {
  fontSize?: number;
  getImageBuffer?: (src: string) => any;
  footer?: boolean;
  title?: string;
  subTitle?: string;
  internalUseText?: null | string;
};

export type IMathOpts = {
  inline?: boolean;
  id?: string | null;
  numbered?: boolean;
};

const MAX_IMAGE_WIDTH = 600;

export class DocxSerializerState<S extends Schema = any> {
  nodes: NodeSerializer<S>;

  options: Options;

  marks: MarkSerializer<S>;

  children: (Paragraph | Table)[];

  numbering: INumbering[];

  footnotes: IFootnotes = {};

  nextRunOpts?: IRunOptions;

  current: ParagraphChild[] = [];

  currentLink?: { link: string; children: IRunOptions[] };

  // Optionally add options
  nextParentParagraphOpts?: IParagraphOptions;

  currentNumbering?: { reference: string; level: number };

  constructor(nodes: NodeSerializer<S>, marks: MarkSerializer<S>, options: Options) {
    this.nodes = nodes;
    this.marks = marks;
    this.options = options ?? {};
    this.children = [];
    this.numbering = [];

    this.options.fontSize = 17;
  }

  renderContent(parent: ProsemirrorNode<S>, opts?: IParagraphOptions) {
    parent.forEach((node, _, i) => {
      if (opts) this.addParagraphOptions(opts);
      this.render(node, parent, i);
    });
  }

  render(node: ProsemirrorNode<S>, parent: ProsemirrorNode<S>, index: number) {
    if (typeof parent === 'number') throw new Error('!');
    if (!this.nodes[node.type.name])
      throw new Error(`Token type \`${node.type.name}\` not supported by Word renderer`);
    this.nodes[node.type.name](this, node, parent, index);
  }

  renderMarks(node: ProsemirrorNode<S>, marks: Mark[]): IRunOptions {
    return marks
      .map((mark) => {
        return this.marks[mark.type.name]?.(this, node, mark);
      })
      .reduce((a, b) => ({ ...a, ...b }), {});
  }

  renderCodeBlock(parent: ProsemirrorNode<S>, opts?: IParagraphOptions) {
    parent.forEach((node, _, i) => {
      if (opts) this.addParagraphOptions(opts);
      if(node?.type?.name === 'text' && node.text) {
        node.text.split(/\r?\n/)
          .map((text) => {
            this.current.push(
              new TextRun({text, font: 'Courier New', break: 1})
            );
          });
      } else {
        this.render(node, parent, i);
      }
    });
  }

  renderInline(parent: ProsemirrorNode<S>) {
    const style = cssToDocxStyle.convert(parent?.attrs?.style, this.options.fontSize, parent?.attrs?.class);
    if(style?.paragraphOptions) {
      this.addParagraphOptions(style.paragraphOptions);
    }
    // Pop the stack over to this object when we encounter a link, and closeLink restores it
    let currentLink: { link: string; stack: ParagraphChild[] } | undefined;
    const closeLink = () => {
      if (!currentLink) return;
      const hyperlink = new ExternalHyperlink({
        link: currentLink.link,
        // child: this.current[0],
        children: this.current,
      });
      this.current = [...currentLink.stack, hyperlink];
      currentLink = undefined;
    };
    const openLink = (href: string) => {
      const sameLink = href === currentLink?.link;
      this.addRunOptions({ style: 'Hyperlink' });
      // TODO: https://github.com/dolanmiu/docx/issues/1119
      // Remove the if statement here and oneLink!
      const oneLink = true;
      if (!oneLink) {
        closeLink();
      } else {
        if (currentLink && sameLink) return;
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
    const progress = (node: ProsemirrorNode<S>, offset: number, index: number) => {
      const links = node.marks.filter((m) => m.type.name === 'link');
      const hasLink = links.length > 0;
      if (hasLink) {
        openLink(links[0].attrs.href);
      } else if (!hasLink && currentLink) {
        closeLink();
      }
      if (node.isText) {
        const marks = this.renderMarks(node, node.marks);
        this.text(node.text, { ...marks, ...style.textRunOptions });
      } else {
        this.render(node, parent, index);
      }
    };
    parent.forEach(progress);
    // Must call close at the end of everything, just in case
    closeLink();
  }

  renderList(node: ProsemirrorNode<S>, style: NumberingStyles) {
    if (!this.currentNumbering) {
      const nextId = createShortId();
      this.numbering.push(createNumbering(nextId, style));
      this.currentNumbering = { reference: nextId, level: 0 };
    } else {
      const { reference, level } = this.currentNumbering;
      this.currentNumbering = { reference, level: level + 1 };
    }
    this.renderContent(node);
    if (this.currentNumbering.level === 0) {
      delete this.currentNumbering;
    } else {
      const { reference, level } = this.currentNumbering;
      this.currentNumbering = { reference, level: level - 1 };
    }
  }

  // This is a pass through to the paragraphs, etc. underneath they will close the block
  renderListItem(node: ProsemirrorNode<S>) {
    if (!this.currentNumbering) throw new Error('Trying to create a list item without a list?');
    this.addParagraphOptions({ numbering: this.currentNumbering });
    this.renderContent(node);
  }

  addParagraphOptions(opts: IParagraphOptions) {
    this.nextParentParagraphOpts = { ...this.nextParentParagraphOpts, ...opts };
  }

  addRunOptions(opts: IRunOptions) {
    this.nextRunOpts = { ...this.nextRunOpts, ...opts };
  }

  setParagraphDefaults() {
    let alignmentSet = false;

    Object.keys(this.nextParentParagraphOpts || {}).map(v => {
      if(v === 'alignment') {
        alignmentSet = true;
      }
    });

    if(!alignmentSet) {
      this.addParagraphOptions({
        alignment: AlignmentType.LEFT,
      });
    }
  }

  setTextDefault(opts ?: IRunOptions) {
    let sizeSet = false;
    const allOpts = {...this.nextRunOpts, ...opts} || {};
    Object.keys(allOpts).map(v => {
      if(v === 'size') {
        sizeSet = true;
      }
    });

    if(!sizeSet) {
      // 17px is about 25 half points
      this.addRunOptions({size: 32});
    }
  }

  text(text: string | null | undefined, opts?: IRunOptions) {
    if (!text) return;
    this.setTextDefault(opts);

    this.current.push(new TextRun({ text, ...this.nextRunOpts, ...opts }));
    delete this.nextRunOpts;
  }

  math(latex: string, opts: IMathOpts = { inline: true }) {
    if (opts.inline || !opts.numbered) {
      this.current.push(new Math({ children: [new MathRun(latex)] }));
      return;
    }
    const id = opts.id ?? createShortId();
    this.current = [
      new TextRun('\t'),
      new Math({
        children: [new MathRun(latex)],
      }),
      new TextRun('\t('),
      new Bookmark({
        id,
        children: [new SequentialIdentifier('Equation')],
      }),
      new TextRun(')'),
    ];
    this.addParagraphOptions({
      tabStops: [
        {
          type: TabStopType.CENTER,
          position: TabStopPosition.MAX / 2,
        },
        {
          type: TabStopType.RIGHT,
          position: TabStopPosition.MAX,
        },
      ],
    });
  }

  defaultGetImageBuffer(src: string) {
    return Buffer.from(src);
  }
  // not sure what this actually is, seems to be close for 8.5x11
  maxImageWidth = MAX_IMAGE_WIDTH;

  image(src: string, widthPercent = 70, align: AlignOptions = 'center') {
    let getImageBuffer = this.defaultGetImageBuffer;
    if (typeof this?.options?.getImageBuffer === 'function') {
      getImageBuffer = this.options.getImageBuffer;
    }
    const buffer = getImageBuffer(src);
    const dimensions = sizeOf(buffer);
    const aspect = dimensions.height / dimensions.width;
    const width = this.maxImageWidth * (widthPercent / 100);
    this.current.push(
      new ImageRun({
        data: buffer,
        transformation: {
          width,
          height: width * aspect,
        },
      }),
    );
    let alignment: AlignmentType;
    switch (align) {
      case 'right':
        alignment = AlignmentType.RIGHT;
        break;
      case 'left':
        alignment = AlignmentType.LEFT;
        break;
      default:
        alignment = AlignmentType.CENTER;
    }
    this.addParagraphOptions({
      alignment,
    });
  }

  table(node: ProsemirrorNode<S>) {
    const actualChildren = this.children;
    const rows: TableRow[] = [];
    // don't carry over any past formatting
    delete this.nextRunOpts;
    node.content.forEach(({ content: rowContent }) => {
      const cells: TableCell[] = [];
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
        this.children = [];
        this.renderContent(cell);
        const tableCellOpts: Mutable<ITableCellOptions> = { children: this.children };
        const colspan = cell.attrs.colspan ?? 1;
        const rowspan = cell.attrs.rowspan ?? 1;
        if (colspan > 1) tableCellOpts.columnSpan = colspan;
        if (rowspan > 1) tableCellOpts.rowSpan = rowspan;
        cells.push(new TableCell(tableCellOpts));
      });
      rows.push(new TableRow({ children: cells, tableHeader }));
    });
    this.maxImageWidth = MAX_IMAGE_WIDTH;
    const table = new Table({ rows });
    actualChildren.push(table);
    // If there are multiple tables, this seperates them
    actualChildren.push(new Paragraph(''));
    this.children = actualChildren;
  }

  captionLabel(id: string, kind: 'Figure' | 'Table') {
    this.current.push(
      new Bookmark({
        id,
        children: [new TextRun(`${kind} `), new SequentialIdentifier(kind)],
      }),
    );
  }

  $footnoteCounter = 0;

  footnote(node: ProsemirrorNode<S>) {
    const { current, nextRunOpts } = this;
    // Delete everything and work with the footnote inline on the current
    this.current = [];
    delete this.nextRunOpts;

    this.$footnoteCounter += 1;
    this.renderInline(node);
    this.footnotes[this.$footnoteCounter] = {
      children: [new Paragraph({ children: this.current })],
    };
    this.current = current;
    this.nextRunOpts = nextRunOpts;
    this.current.push(new FootnoteReferenceRun(this.$footnoteCounter));
  }

  setParagraphAlignmentFromClass(node: ProsemirrorNode<S>) {
    if(!node?.attrs?.class) {
      return;
    }
    let alignment: AlignmentType;
    switch (node.attrs.class) {
      case 'text-right':
        alignment = AlignmentType.RIGHT;
        break;
      case 'text-left':
        alignment = AlignmentType.LEFT;
        break;
      case 'text-center':
        alignment = AlignmentType.CENTER;
        break;
      default:
        alignment = AlignmentType.LEFT;
    }
    this.addParagraphOptions({
      alignment,
    });
  }

  closeBlock(node: ProsemirrorNode<S>, props?: IParagraphOptions) {
    this.setParagraphDefaults();
    const paragraph = new Paragraph({
      children: this.current,
      ...this.nextParentParagraphOpts,
      ...props,
    });
    this.current = [];
    delete this.nextParentParagraphOpts;
    delete this.nextRunOpts;
    this.children.push(paragraph);
  }

  createReference(id: string, before?: string, after?: string) {
    const children: ParagraphChild[] = [];
    if (before) children.push(new TextRun(before));
    children.push(new SimpleField(`REF ${id} \\h`));
    if (after) children.push(new TextRun(after));
    const ref = new InternalHyperlink({ anchor: id, children });
    this.current.push(ref);
  }
}

export class DocxSerializer<S extends Schema = any> {
  nodes: NodeSerializer<S>;

  marks: MarkSerializer<S>;

  constructor(nodes: NodeSerializer<S>, marks: MarkSerializer<S>) {
    this.nodes = nodes;
    this.marks = marks;
  }

  serialize(content: ProsemirrorNode<S>, options: Options) {
    const state = new DocxSerializerState<S>(this.nodes, this.marks, options);
    state.renderContent(content);
    return createDocFromState(state);
  }
}
