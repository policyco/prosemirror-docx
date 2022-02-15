import { AlignmentType, LevelFormat } from 'docx';
import { INumbering } from './types';
declare const styles: {
    numbered: {
        alignment?: AlignmentType | undefined;
        style?: {
            readonly run?: import("docx").IRunStylePropertiesOptions | undefined;
            readonly paragraph?: import("docx").ILevelParagraphStylePropertiesOptions | undefined;
        } | undefined;
        level: number;
        format: any;
        text: string;
    }[];
    bullets: {
        alignment?: AlignmentType | undefined;
        style?: {
            readonly run?: import("docx").IRunStylePropertiesOptions | undefined;
            readonly paragraph?: import("docx").ILevelParagraphStylePropertiesOptions | undefined;
        } | undefined;
        level: number;
        format: LevelFormat;
        text: any;
    }[];
};
export declare type NumberingStyles = keyof typeof styles;
export declare function createNumbering(reference: string, style: NumberingStyles): INumbering;
export {};
