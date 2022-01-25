import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  ImageRun,
  INumberingOptions,
  ISectionOptions,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  SectionType,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  TextWrappingSide,
  TextWrappingType,
  WidthType,
} from 'docx';
import { Node as ProsemirrorNode } from 'prosemirror-model';
import { Options } from './serializer';
import { IFootnotes } from './types';

export function createShortId() {
  return Math.random().toString(36).substr(2, 9);
}
const footerStyleDefinition = { style: BorderStyle.NONE, size: undefined, color: 'FFFFFF' };
const footerBorders = {
  top: footerStyleDefinition,
  left: footerStyleDefinition,
  right: footerStyleDefinition,
  bottom: footerStyleDefinition,
};

export function createDocFromState(state: {
  numbering: INumberingOptions['config'];
  children: ISectionOptions['children'];
  footnotes?: IFootnotes;
  options: Options;
}) {
  const logoBuffer =
    typeof state?.options?.getLogoBuffer === 'function' ? state.options.getLogoBuffer() : null;
  const titleTOC = state?.options?.title || '';
  const subTitleTOC = state?.options?.subTitle || '';
  let footerLeftText = '';
  if (titleTOC && subTitleTOC) {
    footerLeftText = `${subTitleTOC} • ${titleTOC}`;
  } else if (titleTOC && !subTitleTOC) {
    footerLeftText = titleTOC;
  } else if (!titleTOC && subTitleTOC) {
    footerLeftText = subTitleTOC;
  }
  if (state.options.internalUseText) {
    footerLeftText += ` • ${state.options.internalUseText}`;
  }
  const footerTable = new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: {
              size: 70,
              type: WidthType.AUTO,
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                text: footerLeftText,
              }),
            ],
            columnSpan: 1,
            borders: footerBorders,
          }),
          new TableCell({
            width: {
              size: 30,
              type: WidthType.AUTO,
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    children: ['Page ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES],
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

  const footer = state?.options?.footer ? footerTable : new TextRun({});

  // One inch equates to 914400 EMUs
  function positionFromInches(inches: number): number {
    return Math.round(inches * 914400);
  }

  const titlePageChildren = [];

  titlePageChildren.push(
    new TextRun({
      text: state.options.title,
      size: 60,
      bold: true,
      break: 1,
    }),
  );
  if (logoBuffer) {
    titlePageChildren.push(
      new ImageRun({
        data: logoBuffer,
        transformation: {
          height: 30,
          width: 30,
        },
        floating: {
          horizontalPosition: {
            offset: positionFromInches(1.0),
          },
          verticalPosition: {
            offset: positionFromInches(2.0),
          },
          wrap: {
            type: TextWrappingType.SQUARE,
            side: TextWrappingSide.RIGHT,
          },
          margins: {
            right: positionFromInches(1 / 8),
          },
        },
      }),
    );
  }
  titlePageChildren.push(
    new TextRun({
      text: state?.options?.subTitle || '',
      size: 50,
      italics: true,
      break: 1,
    }),
  );

  titlePageChildren.push(new PageBreak());

  const pageTitleTOC = new Paragraph({
    children: titlePageChildren,
  });
  const toc = new TableOfContents('Summary', {
    hyperlink: true,
  });
  const pageBreak = new Paragraph({
    pageBreakBefore: true,
  });
  const children = [pageTitleTOC, toc, pageBreak].concat(state.children);

  const doc = new Document({
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
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [footer],
              }),
            ],
          }),
        },
        properties: {
          type: SectionType.CONTINUOUS,
        },
        children,
      },
    ],
  });
  return doc;
}

export async function writeDocx(
  doc: Document,
  write: ((buffer: Buffer) => void) | ((buffer: Buffer) => Promise<void>),
) {
  const buffer = await Packer.toBuffer(doc);
  return write(buffer);
}

export function writeToBuffer(doc: Document) {
  return Packer.toBuffer(doc);
}

export function getLatexFromNode(node: ProsemirrorNode): string {
  let math = '';
  node.forEach((child) => {
    if (child.isText) math += child.text;
    // TODO: improve this as we may have other things in the future
  });
  return math;
}
