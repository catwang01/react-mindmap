import React, { useState } from 'react'
import { createEditor, Descendant, Node } from 'slate'
// Import the Slate components and React plugin.
import { Slate, Editable, withReact } from 'slate-react'
// import { BaseEditor, Descendant } from 'slate_102'
// import { ReactEditor } from 'slate-react_102'

type CustomText = { text: string }

const serialize = (value: Descendant[]) => {
  const serialized = value
      // Return the string content of each paragraph in the value's children.
      .map(n => Node.string(n))
      // Join them all with line breaks denoting paragraphs.
      .join('\n');
  console.log({ s: serialized });
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

export function Editor(props) {
  const [editor] = useState(() => withReact(createEditor()))
  const onChange = (descendants: Descendant[]) => {
    console.log(descendants)
    props.onChange({ value: serialize(descendants) })
  }
  // Render the Slate context.
  return <Slate editor={editor} initialValue={deserialize(props.value)} onChange={onChange}>
    <Editable {...props} />
  </Slate>
}