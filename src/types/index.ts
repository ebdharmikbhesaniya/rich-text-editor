// Common types for tools and editor
export type ToolName =
  | "undo"
  | "redo"
  | "bold"
  | "italic"
  | "underline"
  | "strikeThrough"
  | "superscript"
  | "subscript"
  | "foreColor"
  | "highlight"
  | "heading"
  | "table"
  | "insertUnorderedList"
  | "insertOrderedList"
  | "justifyLeft"
  | "justifyCenter"
  | "justifyRight"
  | "justifyFull"
  | "insertLink"
  | "insertHorizontalRule"
  | "codeView";

export interface ToolConfig {
  name: ToolName;
  icon?: string;
  label?: string;
  shortcut?: string;
  group?: string;
}

export type ToolList = ToolName[];

export interface HeadingOption {
  label: string;
  tag: string; // e.g. 'p', 'h1', 'h2', 'h3'
  className?: string;
}

export interface ColorPalette {
  colors: string[];
  label?: string;
}

export interface EditorState {
  content: string;
  isFocused: boolean;
  isCodeView: boolean;
  canUndo: boolean;
  canRedo: boolean;
  currentHeading: string;
  currentTextColor: string;
  currentHighlightColor: string;
  currentTableHeaderColor: string;
  isInTableCell: boolean;
}

export interface DropdownState {
  heading: boolean;
  color: boolean;
  highlight: boolean;
  tableHeaderColor: boolean;
  tableGrid: boolean;
}

export interface GridConfig {
  minSize: { rows: number; cols: number };
  maxSize: { rows: number; cols: number };
  expandThreshold: number;
  shrinkThreshold: number;
  expandStep: number;
  shrinkStep: number;
}
