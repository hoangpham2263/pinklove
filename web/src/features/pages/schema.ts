type BaseFieldSchema = {
  label: string;
  description?: string;
  width?: 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
};

export type TextFieldSchema = BaseFieldSchema & {
  name: string;
  type: "text" | "textarea" | "media" | "wysiwyg";
};

export type SectionFieldSchema = BaseFieldSchema & {
  type: "section";
  fields: FieldSchema[];
};

export type RepeaterFieldSchema = BaseFieldSchema & {
  name: string;
  type: "repeater";
  addLabel?: string;
  fields: TextFieldSchema[];
};

export type FieldSchema =
  | TextFieldSchema
  | SectionFieldSchema
  | RepeaterFieldSchema;
