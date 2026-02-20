export type ToolName =
  | "undo"
  | "redo"
  | "heading"
  | "bold"
  | "italic"
  | "underline"
  | "strikethrough"
  | "superscript"
  | "subscript"
  | "fontColor"
  | "highlight"
  | "table"
  | "link"
  | "horizontalRule"
  | "bulletList"
  | "numberedList"
  | "taskList"
  | "alignLeft"
  | "alignCenter"
  | "alignRight"
  | "alignJustify"
  | "codeView";

export interface EditorProps {
  modelValue?: string;
  placeholder?: string;
  tools?: ToolName[];
  disabled?: boolean;
  readonly?: boolean;
}

export interface EditorState {
  content: string;
  isFocused: boolean;
  isCodeView: boolean;
  canUndo: boolean;
  canRedo: boolean;
  wordCount: number;
  characterCount: number;
  showContextMenu: boolean;
  contextMenuStyle: Record<string, string>;
}

export interface ToolbarState {
  currentHeading: string;
  currentTextColor: string;
  currentHighlightColor: string;
  dropdowns: Record<string, boolean>;
}

export interface TableState {
  isInTableCell: boolean;
  currentHeaderColor: string;
  maxGridRows: number;
  maxGridCols: number;
  hoveredRows: number;
  hoveredCols: number;
}

export interface ColorPalette {
  colors: string[];
  highlightColors: string[];
  headerColors: string[];
}
