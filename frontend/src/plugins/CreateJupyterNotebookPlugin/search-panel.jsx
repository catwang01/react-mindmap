import { FocusMode as StandardFocusMode, OpType as StandardOpType } from '@blink-mind/core';
import { OpType } from './constant';
import {
    Popover
} from '@blueprintjs/core';
import { Omnibar } from '@blueprintjs/select';
import cx from 'classnames';
import fuzzysort from 'fuzzysort';
import * as React from 'react';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import '../../icon/index.css';
import './search-panel.css';

const StyledNavOmniBar = styled(Omnibar)`
  top: 20%;
  left: 25% !important;
  width: 50% !important;
`;

const TopicTitle = styled.div`
  margin: 0 5px;
  padding: 10px 5px;
  width: 100%;
  font-size: 16px;
  cursor: pointer;
  .highlight {
    color: red;
  };
  &:hover {
    background: #e3e8ec;
  }
`;

const StyledPopover = styled(Popover)`
  display: block;
`;

const Tip = styled.div`
  padding: 10px;
  font-size: 16px;
  //max-width: 800px;
  //max-height: 600px;
  overflow: auto;
`;

const TipContent = styled.div`
  white-space: break-spaces;
`;

const INPUT_PROPS = {
  placeholder: 'Search'
};

export function SearchPanel(props) {
  const [items, setItems] = useState([]);
  const { model, setSearchWord, controller, getAllSections } = props;

  useEffect(() => {
    getAllSections(setItems);
  }, [])

  const onClose = () => {
    controller.run('operation', {
      ...props,
      opType: StandardOpType.SET_FOCUS_MODE,
      focusMode: StandardFocusMode.NORMAL
    });
  };

  const associateJupyterNote = (item, e) => {
    const jupyter_notebook_path = item.path;
    controller.run("operation", {
      ...props,
      topicKey: model.topicKey,
      jupyter_notebook_path,
      model: controller.currentModel,
      opType: OpType.ASSOCIATE_JUPYTER_NOTE
    })
  }

  const renderItem = (item, itemProps) => {
    const { highlighted: noteTitle } = item;
    const { modifiers } = itemProps;
    const maxLength = 10000;
    const needTip = noteTitle.length > maxLength;
    const title = needTip
      ? noteTitle.substr(0, maxLength) + '...'
      : noteTitle;
    const children = <div>
      <span dangerouslySetInnerHTML={{ __html: title }} />
    </div>
    const titleProps = {
      // dangerouslySetInnerHTML: {__html: title + "  " + note.notebookGuid },
      children: children,
      onClick: e => associateJupyterNote(item, e),
      style: {
        background: modifiers.active ? "#e3e8ec" : "#fff"
      }
    };
    const titleEl = <TopicTitle {...titleProps}></TopicTitle>;
    const tip = (
      <Tip>
        <TipContent dangerouslySetInnerHTML={{ __html: noteTitle }}></TipContent>
      </Tip>
    );
    const popoverProps = {
      target: titleEl,
      content: tip,
      fill: true,
      interactionKind: 'HOVER_TARGET_ONLY',
      hoverOpenDelay: 1000,
    };
    return needTip ? <StyledPopover {...popoverProps} /> : titleEl;
  };

  const filterMatches = (
    query,
    items
  ) => {
    return fuzzysort.go(query.toLowerCase(),
      items,
      { threshold: -10000, key: 'title' }).map(res => {
        return {
          ...res['obj'],
          fuzzySearchResult: res,
          highlighted: fuzzysort.highlight(res, '<b class="highlight">')
        };
      })
  };


  return (
    <StyledNavOmniBar
      inputProps={INPUT_PROPS}
      itemListPredicate={filterMatches}
      isOpen={true}
      items={items}
      itemRenderer={renderItem}
      onClose={onClose}
      onItemSelect={associateJupyterNote}
    />
  );
}