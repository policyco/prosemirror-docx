import { INumberingOptions } from 'docx';
import { IPropertiesOptions } from 'docx/build/file/core-properties';
export declare type Mutable<T> = {
    -readonly [k in keyof T]: T[k];
};
export declare type IFootnotes = Mutable<Required<IPropertiesOptions>['footnotes']>;
export declare type INumbering = INumberingOptions['config'][0];
