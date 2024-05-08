import debug from 'debug';
import * as React from 'react';
import { MyEditor, EditorProps } from './Editor';
// import styled from 'styled-components';
const log = debug('node:text-editor');

export type KeyType = string;

interface ContentProps {
  readOnly?: boolean;
}

// Not sure why using styled-components causes incorrect styles. Disable `styled.div`

// const Content = styled.div<ContentProps>``;
// const Content = ({ children }) => {
//   return <div> { children } </div>
// }

// const Content = styled.div<ContentProps>`
//   padding: 6px;
//   background-color: ${props => (props.readOnly ? null : 'white')};
//   cursor: ${props => (props.readOnly ? 'pointer' : 'text')};
//   min-width: 50px;
// `;

interface Props {
  controller: any;
  model: any;
  readOnly: boolean;
  topicKey: KeyType;
  saveRef?: Function;
}

interface State {
  content: any;
}

export class SimpleTextEditor extends React.Component<Props, State> {
  state = {
    content: null
  };

  onMouseDown = e => {
    e.stopPropagation();
  };

  onMouseMove = e => {
    // log('onMouseMove');
    // e.stopPropagation();
  };
  onChange({ value }) {
    log('onChange', value);
    this.setState({ content: value });
  }

  onKeyDown = e => {};

  componentDidMount() {
    const { readOnly } = this.props;
    if (readOnly) return;
    document.addEventListener('click', this._handleClick);
  }

  componentWillUnmount() {
    const { readOnly } = this.props;
    if (readOnly) return;
    document.removeEventListener('click', this._handleClick);
  }

  _handleClick = event => {
    const wasOutside = !this.root.contains(event.target);
    wasOutside && this.onClickOutSide(event);
  };

  onClickOutSide(e) {}

  getCustomizeProps(): any {
    return null;
  }

  constructor(props) {
    super(props);
    this.initState();
  }

  getContent() {
    const { block } = this.getCustomizeProps();
    let content = block.data;
    if (content == null) return null;
    if (typeof content === 'string') {
      // content = plainSerializer.deserialize(content);
    }
    return content;
  }

  initState() {
    const content = this.getContent();
    this.state = {
      content
    };
  }

  root;

  rootRef = saveRef => ref => {
    saveRef(ref);
    this.root = ref;
  };

  render() {
    const { topicKey, saveRef } = this.props;
    const {
      readOnly,
      getRefKeyFunc,
      placeholder,
      style
    } = this.getCustomizeProps();
    log(readOnly);
    const key = getRefKeyFunc(topicKey);
    const content = readOnly ? this.getContent() : this.state.content;
    const { onMouseDown, onMouseMove, onKeyDown } = this;
    const editorProps: EditorProps = {
      value: content,
      readOnly,
      onChange: this.onChange.bind(this),
      placeholder,
      style,
      autoFocus: true
    };

    const contentProps = {
      key,
      readOnly,
      // @ts-ignore
      ref: this.rootRef(saveRef(key)),
      onMouseDown,
      onMouseMove,
      onKeyDown
    };

    const divStyle = {
      padding: '6px',
      backgroundColor: readOnly ? '' : 'white',
      cursor: readOnly ? 'pointer' : 'text',
      minWidth: '50px'
    };
    log({ contentProps, editorProps })
    return (
      // <Content {...contentProps}>
      //   <Editor {...editorProps} autoFocus />
      // </Content>
      <div {...contentProps} style={ divStyle }>
        <MyEditor {...editorProps} />
      </div>
    );
  }
}
