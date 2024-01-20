import { FocusMode as StandardFocusMode, OpType as StandardOpType } from '@blink-mind/core';
import {
  Popover, useHotkeys
} from '@blueprintjs/core';
// import { Omnibar } from '@blueprintjs/select';
import fuzzysort from 'fuzzysort';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import '../../icon/index.css';
import { ms } from '../../utils';
import { EnhancedOmniBar } from './EnhancedOmnibar';
import './index.css';

export const StyledNavOmniBar = styled(EnhancedOmniBar)`
  top: 20%;
  left: 25% !important;
  width: 50% !important;
`;

export const TopicTitle = styled.div`
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

export const StyledPopover = styled(Popover)`
  display: block;
`;

export const Tip = styled.div`
  padding: 10px;
  font-size: 16px;
  //max-width: 800px;
  //max-height: 600px;
  overflow: auto;
`;

export const TipContent = styled.div`
  white-space: break-spaces;
`;

const INPUT_PROPS = {
  placeholder: 'Search'
};

export interface SearchPanelProps<TItem = any> {
  setSearchWord: any;
  controller: any;
  model: any;
  getAllSections: ( func: (items: TItem[]) => void ) => void;
  onItemSelect: (item: TItem, e: any) => void;
  matchKey: any;
}

export type EnrichedItem<TItem> = TItem & { fuzzySearchResult: any; highlighted: string; };

export function SearchPanel<TItem>(props: SearchPanelProps<TItem>) {
  const [items, setItems] = useState<TItem[]>([]);
  const { controller, getAllSections, onItemSelect, matchKey } = props;
  const omnibarRef = useRef(null);

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

  const renderItem = (item: EnrichedItem<TItem>, itemProps) => {
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
      children: children,
      onClick: e => onItemSelect(item, e),
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
      hoverOpenDelay: ms("1 second"),
    };
    return needTip ? <StyledPopover {...popoverProps} /> : titleEl;
  };

  const filterMatches = (query: string, items: TItem[]): EnrichedItem<TItem>[] => {
    return fuzzysort.go(query.toLowerCase(),
      items,
      { threshold: -10000, key: matchKey }).map(res => {
        return {
          // @ts-ignore
          ...res['obj'],
          fuzzySearchResult: res,
          highlighted: fuzzysort.highlight(res, '<b class="highlight">')
        } as EnrichedItem<TItem>;
      })
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
      itemListPredicate={filterMatches}
      isOpen={true}
      items={items}
      itemRenderer={renderItem}
      onClose={onClose}
      onItemSelect={onItemSelect}
    />
  );
}