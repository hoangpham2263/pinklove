type BaseFieldSchema = {
  label: string;
  description?: string;
  column?: "left" | "right";
  width?: 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
};

export type TextFieldSchema = BaseFieldSchema & {
  name: string;
  type: "text" | "textarea" | "media" | "wysiwyg" | "switch";
  multiple?: boolean;
  rows?: number;
};

export type ProductSelectFieldSchema = BaseFieldSchema & {
  name: string;
  type: "product-select";
  multiple?: boolean;
};

export type LeafFieldSchema =
  | TextFieldSchema
  | ProductSelectFieldSchema;

export type SectionFieldSchema = BaseFieldSchema & {
  type: "section";
  layout?: "two-columns";
  fields: FieldSchema[];
};

export type RepeaterFieldSchema = BaseFieldSchema & {
  name: string;
  type: "repeater";
  addLabel?: string;
  fields: LeafFieldSchema[];
};

export type FieldSchema =
  | LeafFieldSchema
  | SectionFieldSchema
  | RepeaterFieldSchema;
