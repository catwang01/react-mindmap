import { FocusMode, OpType, TopicRelationship, getAllSubTopicKeys, getKeyPath, getRelationship } from '@blink-mind/core';
import {
  PopoverInteractionKind,
  Popover, useHotkeys
} from '@blueprintjs/core';
import cx from 'classnames';
import fuzzysort from 'fuzzysort';
import { memo, useCallback, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { SearchPanelProps, StyledNavOmniBar } from '../../component/searchPanel';
import { iconClassName } from '../../icon';
import '../../icon/index.css';
import './search-panel.css';
import { ms } from '../../utils';

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

export const SearchPanel = memo(function (props: SearchPanelProps) {
  const { model, controller } = props;
  const omnibarRef = useRef(null);
  const onClose = useCallback(() => {
    controller.run('operation', {
      ...props,
      opType: OpType.SET_FOCUS_MODE,
      focusMode: FocusMode.NORMAL
    });
  }, [controller, props]);

  const allowCrossLevelSearch = useMemo(() => model.getIn(["extData", "allowCrossLevelSearch"], true), [model]);

  const selections = useMemo(() => {
    const avaiableTopicKeys = allowCrossLevelSearch ? Array.from(model.topics.keys())
      : getAllSubTopicKeys(model, model.editorRootTopicKey);
    const res = avaiableTopicKeys.map(
      topicKey => {
        const parentKeys = getKeyPath(model, topicKey, false);
        const parentTitles = parentKeys.map(key => controller.run('getTopicTitle', { ...props, topicKey: key }))
        return {
          key: topicKey,
          title: controller.run('getTopicTitle', { ...props, topicKey }),
          parents: parentTitles.join(" > ")
        }
      }
    )
    return res;
  }, [model, allowCrossLevelSearch]);

  const focusAndMove = (model, topicKey) => {
    controller.run(
      'focusTopicAndMoveToCenter', {
      ...props,
      model,
      topicKey,
    },
    );
  }

  const navigateToTopic = topicKey => e => {
    const { model, controller } = props;
    if (getRelationship(model, topicKey, model.editorRootTopicKey) !== TopicRelationship.DESCENDANT) {
      controller.run('operation', {
        ...props,
        opArray: [
          {
            opType: OpType.SET_FOCUS_MODE,
            focusMode: FocusMode.NORMAL
          },
          {
            opType: OpType.SET_EDITOR_ROOT,
            topicKey,
          },
        ],
      });
      focusAndMove(controller.currentModel, topicKey)
    }
    else {
      focusAndMove(model, topicKey)
    }
    e.stopPropagation();
    e.preventDefault();
  };

  const renderItem = (item, itemProps) => {
    const { key: topicKey, highlighted: noteTitle, parents } = item;
    const { modifiers } = itemProps;
    const maxLength = 10000;
    const needTip = noteTitle.length > maxLength;
    const title = needTip
      ? noteTitle.substr(0, maxLength) + '...'
      : noteTitle;
    const isEvernoteAttached = model.getIn(["extData", "evernote", topicKey]);
    const isJupyterNotebookAttached = model.getIn(["extData", "jupyter", topicKey]);
    const children = <div className={"clearfix"}>
      <span className={"left"} dangerouslySetInnerHTML={{ __html: title }} />
      <span className={"right noteAttr"} > {parents} </span>
      {isEvernoteAttached && <span className={cx("right", "noteAttr", iconClassName("evernote"))}></span>}
      {isJupyterNotebookAttached && <span className={cx("right", "noteAttr", iconClassName("jupyter"))}></span>}
      {/* <span className={ "right noteAttr" } > { notebooks.get(note.notebookGuid) ?? 'Unknown' } </span>  */}
    </div>
    const titleProps = {
      key: topicKey,
      // dangerouslySetInnerHTML: {__html: title + "  " + note.notebookGuid },
      children: children,
      onClick: (e) => navigateToTopic(item.key)(e),
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
      key: topicKey,
      target: titleEl,
      content: tip,
      fill: true,
      interactionKind: PopoverInteractionKind.HOVER_TARGET_ONLY,
      hoverOpenDelay: ms("1 second"),
    };
    return needTip ? <StyledPopover {...popoverProps} /> : titleEl;
  };

  const fuzzySort = (
    query,
    items
  ) => {
    const sorted = fuzzysort.go(query.toLowerCase(),
      items,
      { threshold: -10000, key: 'title' }).map(res => {
        return {
          // @ts-ignore
          ...res['obj'],
          fuzzySearchResult: res,
          highlighted: fuzzysort.highlight(res, '<b class="highlight">')
        };
      })
    sorted.sort((a, b) => {
      if (a['fuzzySearchResult']['score'] !== b['fuzzySearchResult']['score']) {
        return b['fuzzySearchResult']['score'] - a['fuzzySearchResult']['score'];
      }
      return a['parents'].length - b['parents'].length;
    });
    return sorted.slice(0, 100);
  };

  const moveActiveItem = useCallback((e, i: number) => {
    const queryList = omnibarRef.current.queryListRef.current;
    const nextActiveItem = queryList.getNextActiveItem(i);
    if (nextActiveItem != null) {
      queryList.setActiveItem(nextActiveItem);
    }
  }, [omnibarRef])

  // important: hotkeys array must be memoized to avoid infinitely re-binding hotkeys
  const hotkeys = useMemo(() => [
    {
      combo: "ctrl + k",
      global: true,
      label: "Refresh data",
      allowInInput: true,
      onKeyDown: (e) => {
        moveActiveItem(e, -1);
      }
    },
    {
      combo: "ctrl + j",
      global: true,
      allowInInput: true,
      label: "Focus text input",
      onKeyDown: (e) => {
        moveActiveItem(e, 1);
      }
      ,
    },
  ], []);

  const { handleKeyDown, handleKeyUp } = useHotkeys(hotkeys);

  return (
    <StyledNavOmniBar
      ref={omnibarRef}
      handleKeyDown={handleKeyDown}
      handleKeyUp={handleKeyUp}
      inputProps={INPUT_PROPS}
      itemListPredicate={fuzzySort}
      isOpen={true}
      items={selections}
      itemRenderer={renderItem}
      onClose={onClose}
      // @ts-ignore
      onItemSelect={(item, e) => navigateToTopic(item.key)(e)}
    />
  );
}
)