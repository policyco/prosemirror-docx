/// <reference types="node" />
import { Document, INumberingOptions, ISectionOptions } from 'docx';
import { Node as ProsemirrorNode } from 'prosemirror-model';
import { IFootnotes } from './types';
import { Options } from './serializer';
export declare function createShortId(): string;
export declare function createDocFromState(state: {
    numbering: INumberingOptions['config'];
    children: ISectionOptions['children'];
    footnotes?: IFootnotes;
    options: Options;
}): Document;
export declare function writeDocx(doc: Document, write: ((buffer: Buffer) => void) | ((buffer: Buffer) => Promise<void>)): Promise<void>;
export declare function writeToBuffer(doc: Document): Promise<Buffer>;
export declare function getLatexFromNode(node: ProsemirrorNode): string;
