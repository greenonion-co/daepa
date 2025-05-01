export type FORM_STEP = {
  title: string;
  fields: {
    name: string;
    type: string;
    required?: boolean;
    validation?: (value: string) => boolean;
  }[];
};
