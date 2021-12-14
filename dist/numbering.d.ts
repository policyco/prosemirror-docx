import { AlignmentType, LevelFormat } from 'docx';
import { INumbering } from './types';
declare const styles: {
    numbered: {
        style?: {
            readonly run?: import("docx").IRunStylePropertiesOptions | undefined;
            readonly paragraph?: import("docx").ILevelParagraphStylePropertiesOptions | undefined;
        } | undefined;
        alignment?: AlignmentType | undefined;
        level: number;
        format: any;
        text: string;
    }[];
    bullets: {
        style?: {
            readonly run?: import("docx").IRunStylePropertiesOptions | undefined;
            readonly paragraph?: import("docx").ILevelParagraphStylePropertiesOptions | undefined;
        } | undefined;
        alignment?: AlignmentType | undefined;
        level: number;
        format: LevelFormat;
        text: any;
    }[];
};
export declare type NumberingStyles = keyof typeof styles;
export declare function createNumbering(reference: string, style: NumberingStyles): INumbering;
export {};
