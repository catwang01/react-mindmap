import { useEffect, useState } from 'react';
import { Descendant, Editor, Node, Point, Transforms, createEditor } from 'slate';
// Import the Slate components and React plugin.
import { Editable, Slate, withReact } from 'slate-react';
// import { BaseEditor, Descendant } from 'slate_102'
// import { ReactEditor } from 'slate-react_102'
import debug from 'debug';

const log = debug('plugin:SimpleTextEditorPlugin');

const serialize = (value: Descendant[]) => {
  const serialized = value
    // Return the string content of each paragraph in the value's children.
    .map(n => Node.string(n))
    // Join them all with line breaks denoting paragraphs.
    .join('\n');
  log({ s: serialized });
  return serialized;
}

const deserialize = (s: string): Descendant[] => {
  const deserialized = (s ?? "").split('\n').map(x => {
    return {
      // @ts-ignore
      type: 'paragraph',
      children: [{ text: x }],
    }
  });
  return deserialized;
}

const resetNodes = (
  editor,
  options: {
    nodes?: Node | Node[],
    at?: Location
  } = {}
) => {
  const children = [...editor.children]
  log({ children })
  children.forEach((node) => editor.apply({ type: 'remove_node', path: [0], node }))
  if (options.nodes) {
    const nodes = Node.isNode(options.nodes) ? [options.nodes] : options.nodes
    nodes.forEach((node, i) => editor.apply({ type: 'insert_node', path: [i], node: node }))
  }
  const point = options.at && Point.isPoint(options.at)
    ? options.at
    : Editor.end(editor, [])
  if (point) {
    Transforms.select(editor, point)
  }
}


export interface EditorProps {
  value: any;
  readOnly: boolean;
  onChange: Function;
  placeholder: string;
  style: any;
  autoFocus: boolean;
}

export const MyEditor = (props: EditorProps) => {
  const [editor] = useState(() => withReact(createEditor()))
  const onChange = (descendants: Descendant[]) => {
    console.log(descendants);
    props.onChange({ value: serialize(descendants) })
  }

  const { value: contentValue, readOnly } = props;
  const initialValue = deserialize(contentValue);

  useEffect(
    () => {
      console.log('useEffect: ' + contentValue + ' initialized: ' + ' readOnly: ' + readOnly);
      if (contentValue !== serialize(editor.children))
      {
        console.log("Create a new editor")
        // remove old contents
        resetNodes(editor, { nodes: deserialize(contentValue) });
      }
    },
    [contentValue]
  );

  const slateProps = {
    editor,
    initialValue,
    onChange,
  }
  const editableProps = {
    readOnly,
    placeholder: props.placeholder,
    style: props.style,
    autoFocus: props.autoFocus
  }

  log('Editor is being rendered: ');
  log({ props, slateProps, editableProps, editor });

  // Render the Slate context.
  return <Slate {...slateProps}>
    <Editable {...editableProps} />
  </Slate>
}