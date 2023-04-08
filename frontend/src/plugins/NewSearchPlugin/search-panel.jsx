import { FocusMode, OpType } from '@blink-mind/core';
import {
  IInputGroupProps,
  Popover,
  PopoverInteractionKind
} from '@blueprintjs/core';
import { ItemListPredicate, ItemRenderer, Omnibar } from '@blueprintjs/select';
import * as React from 'react';
import styled from 'styled-components';
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
  const { model, setSearchWord, controller } = props;
  const onClose = () => {
    controller.run('operation', {
      ...props,
      opType: OpType.SET_FOCUS_MODE,
      focusMode: FocusMode.NORMAL
    });
  };

  const getAllSections = () => {
    const res = [];
    model.topics.forEach((topic, topicKey) => {
      res.push({
        key: topicKey,
        title: controller.run('getTopicTitle', {
          ...props,
          topicKey
        })
      });
    });
    return res;
  };

  const focusAndMove = (controller, topicKey) => {
    controller.run(
      'focusTopicAndMoveToCenter', { 
        ...props, 
        model: controller.currentModel,
        topicKey,
      }, 
    );
  }

  const navigateToTopic = topicKey => e => {
    const { model, controller } = props;
    console.log({ root: model.editorRootTopicKey, topicKey })
    if (model.editorRootTopicKey !== topicKey) 
    {
      controller.run('operation', {
        ...props,
        opType: OpType.SET_EDITOR_ROOT,
        topicKey,
      });
      focusAndMove(controller, topicKey)
    }
    else
    {
      focusAndMove(controller, topicKey)
    }
  };

  const renderItem = (section, props) => {
    const { key, title: sectionTitle } = section;
    const maxLength = 100;
    const needTip = sectionTitle.length > maxLength;
    const title = needTip
      ? sectionTitle.substr(0, maxLength) + '...'
      : sectionTitle;
    const titleProps = {
      key,
      onClick: navigateToTopic(key)
    };
    const titleEl = <TopicTitle {...titleProps}>{title}</TopicTitle>;
    const tip = (
      <Tip>
        <TipContent>{sectionTitle}</TipContent>
      </Tip>
    );
    const popoverProps = {
      key,
      target: titleEl,
      content: tip,
      fill: true,
      interactionKind: PopoverInteractionKind.HOVER_TARGET_ONLY,
      hoverOpenDelay: 1000
    };
    return needTip ? <StyledPopover {...popoverProps} /> : titleEl;
  };

  const filterMatches = (
    query,
    items
  ) => {
    return items.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase())
    );
  };

  const sections = getAllSections();

  return (
    <StyledNavOmniBar
      inputProps={INPUT_PROPS}
      itemListPredicate={filterMatches}
      isOpen={true}
      items={sections}
      itemRenderer={renderItem}
      // onItemSelect={handleItemSelect}
      onClose={onClose}
      resetOnSelect={true}
    />
  );
}