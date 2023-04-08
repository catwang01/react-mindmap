import { OpType } from '@blink-mind/core';
import * as React from 'react';
import { SearchPanel } from './search-panel';
import { FOCUS_MODE_SEARCH, HOT_KEY_NAME_SEARCH } from './utils';

export function NewSearchPlugin() {
  let searchWord;
  const setSearchWorld = s => {
    searchWord = s;
  };
  return {
    customizeHotKeys(props, next) {
      const { controller, model } = props;
      const hotKeys = next();

      hotKeys.globalHotKeys.set(HOT_KEY_NAME_SEARCH, {
        label: 'search',
        combo: 'ctrl + f',
        onKeyDown: () => {
          controller.run('operation', {
            ...props,
            opType: OpType.FOCUS_TOPIC,
            topicKey: model.focusKey,
            focusMode: FOCUS_MODE_SEARCH
          });
        }
      });
      return hotKeys;
    },

    renderDiagramCustomize(props, next) {
      const res = next();
      const { model } = props;
      if (model.focusMode === FOCUS_MODE_SEARCH) {
        const searchPanelProps = {
          key: 'search-panel',
          ...props,
          setSearchWorld
        };
        res.push(<SearchPanel {...searchPanelProps} />);
      }
      return res;
    }
  };
}