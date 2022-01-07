/// <reference types="node" />
import { IParagraphOptions, IRunOptions, Paragraph, ParagraphChild, Table } from "docx";
import { Mark, Node as ProsemirrorNode, Schema } from "prosemirror-model";
import { NumberingStyles } from "./numbering";
import { IFootnotes, INumbering } from "./types";
export declare type AlignOptions = 'left' | 'center' | 'right';
export declare type NodeSerializer<S extends Schema = any> = Record<string, (state: DocxSerializerState<S>, node: ProsemirrorNode<S>, parent: ProsemirrorNode<S>, index: number) => void>;
export declare type MarkSerializer<S extends Schema = any> = Record<string, (state: DocxSerializerState<S>, node: ProsemirrorNode<S>, mark: Mark<S>) => IRunOptions>;
export declare type Options = {
    fontSize?: number;
    getImageBuffer?: (src: string) => any;
    footer?: boolean;
    title?: string;
    subTitle?: string;
    internalUseText?: null | string;
};
export declare type IMathOpts = {
    inline?: boolean;
    id?: string | null;
    numbered?: boolean;
};
export declare class DocxSerializerState<S extends Schema = any> {
    nodes: NodeSerializer<S>;
    options: Options;
    marks: MarkSerializer<S>;
    children: (Paragraph | Table)[];
    numbering: INumbering[];
    footnotes: IFootnotes;
    nextRunOpts?: IRunOptions;
    current: ParagraphChild[];
    currentLink?: {
        link: string;
        children: IRunOptions[];
    };
    nextParentParagraphOpts?: IParagraphOptions;
    currentNumbering?: {
        reference: string;
        level: number;
    };
    constructor(nodes: NodeSerializer<S>, marks: MarkSerializer<S>, options: Options);
    renderContent(parent: ProsemirrorNode<S>, opts?: IParagraphOptions): void;
    render(node: ProsemirrorNode<S>, parent: ProsemirrorNode<S>, index: number): void;
    renderMarks(node: ProsemirrorNode<S>, marks: Mark[]): IRunOptions;
    renderCodeBlock(parent: ProsemirrorNode<S>, opts?: IParagraphOptions): void;
    renderInline(parent: ProsemirrorNode<S>): void;
    renderList(node: ProsemirrorNode<S>, style: NumberingStyles): void;
    renderListItem(node: ProsemirrorNode<S>): void;
    addParagraphOptions(opts: IParagraphOptions): void;
    addRunOptions(opts: IRunOptions): void;
    text(text: string | null | undefined, opts?: IRunOptions): void;
    math(latex: string, opts?: IMathOpts): void;
    defaultGetImageBuffer(src: string): Buffer;
    maxImageWidth: number;
    image(src: string, widthPercent?: number, align?: AlignOptions): void;
    table(node: ProsemirrorNode<S>): void;
    captionLabel(id: string, kind: 'Figure' | 'Table'): void;
    $footnoteCounter: number;
    footnote(node: ProsemirrorNode<S>): void;
    setParagraphAlignmentFromClass(node: ProsemirrorNode<S>): void;
    closeBlock(node: ProsemirrorNode<S>, props?: IParagraphOptions): void;
    createReference(id: string, before?: string, after?: string): void;
}
export declare class DocxSerializer<S extends Schema = any> {
    nodes: NodeSerializer<S>;
    marks: MarkSerializer<S>;
    constructor(nodes: NodeSerializer<S>, marks: MarkSerializer<S>);
    serialize(content: ProsemirrorNode<S>, options: Options): import("docx").Document;
}
