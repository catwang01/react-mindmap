
import '../../icon/index.css';

import { FocusMode, OpType as StandardOpType } from "@blink-mind/core";
import { empty, getChildrenCount, getNextSiblingOrParentTopicKey, getParentTopicKeyFromController, getSiblingTopicKey, getSiblingTopicKeyCrossParent, isTopicVisible } from '../../utils';
import { handleHotKeyDown } from '../../utils/keybinding';
import { OpType as CopyPasteRelatedOpType } from '../CopyPastePlugin/opType';
import { createJupyterNoteWithPrecheck, openJupyterNotebookFromTopic } from '../CreateJupyterNotebookPlugin';
import { hasJupyterNotebookAttached } from '../CreateJupyterNotebookPlugin/utils';
import { OpType as EvernoteRelatedOpType } from '../EvernotePlugin';
import { hasEvernoteAttached } from '../EvernotePlugin/utils';
import { FOCUS_MODE_SEARCH } from '../NewSearchPlugin/utils';
import { log } from './log';
import { OpType, OpTypeMapping } from './opType';
import { HOTKEYS } from './vimHotKeys';


export function VimHotKeyPlugin() {
  let all_collapsed = false;
  return {
    getOpMap: function (props, next) {
      const opMap = next();
      OpTypeMapping.forEach(item => {
        const [opKey, opFunc] = item;
        opMap.set(opKey, opFunc);
      });
      return opMap;
    },
    customizeHotKeys: function (props, next) {
      const handleFocusTopic = (topicKey) => e => {
        const { controller } = props;
        const opArg = {
          topicKey: topicKey,
          focusMode: FocusMode.NORMAL,
          model: controller.currentModel,
          allowUndo: false
        };
        handleHotKeyDown(OpType.FOCUS_TOPIC_AND_MOVE_TO_CENTER, { ...props, ...opArg })(e);
      };

      const handleGoToSibling = offset => e => {
        const { controller } = props;
        const model = controller.currentModel;
        const currentKey = model.focusKey;

        let nextSiblingKey;
        nextSiblingKey = getSiblingTopicKeyCrossParent(currentKey, model, offset);
        if (empty(nextSiblingKey) || !isTopicVisible(model, nextSiblingKey)) {
          log(`nextSiblingKey of ${currentKey} is empty`);
          nextSiblingKey = getSiblingTopicKey(currentKey, model, offset);
          if (empty(nextSiblingKey)) {
            log(`nextSiblingKey of ${currentKey} is empty`);
            return;
          }
        }
        handleFocusTopic(nextSiblingKey)(e);
      };

      const res = next();
      const { topicHotKeys, globalHotKeys } = res;
      const newTopicHotKeys = new Map([
        [
          HOTKEYS.VIM_TOGGLE_COLLAPSE,
          {
            label: 'toggle collapse',
            combo: 'o',
            allowInInput: true,
            onKeyDown: handleHotKeyDown('TOGGLE_COLLAPSE', { ...props, allowUndo: false })
          }
        ],
        [
          HOTKEYS.VIM_GO_TO_PARENT,
          {
            label: 'Go to parent',
            combo: 'h',
            // @ts-ignore
            rootCanUse: false,
            allowInInput: true,
            onKeyDown: (e) => {
              const { controller } = props;
              const model = controller.currentModel;
              if (model.focusKey === model.rootTopicKey)
                return;
              // a non-root topic key must have a parentKey
              const parentKey = getParentTopicKeyFromController(props);
              if (!isTopicVisible(model, parentKey)) {
                controller.run('operation', {
                  ...props,
                  topicKey: parentKey,
                  opType: StandardOpType.SET_EDITOR_ROOT,
                  allowUndo: false,
                });
              }
              handleFocusTopic(parentKey)(e);
            }
          }
        ],
        [
          HOTKEYS.VIM_GO_TO_CHILD,
          {
            label: 'Go to child',
            combo: 'l',
            allowInInput: true,
            onKeyDown: (e) => {
              const { controller } = props;
              const model = controller.currentModel;
              const currentKey = model.focusKey;
              const currentTopic = model.getTopic(currentKey);
              const subKeyCount = currentTopic.subKeys.size;
              const midPoint = Math.trunc(subKeyCount / 2);
              const firstSubKey = currentTopic.subKeys.get(midPoint);
              if (firstSubKey === undefined) return;
              if (currentTopic.collapse) {
                controller.run('operation', {
                  opType: StandardOpType.TOGGLE_COLLAPSE, topicKey: currentKey, ...props
                });
              }
              handleFocusTopic(firstSubKey)(e);
            }
          }
        ],
        [
          HOTKEYS.VIM_GO_TO_NEXT_SIBING,
          {
            label: 'Go to next sibling',
            combo: 'j',
            allowInInput: true,
            onKeyDown: handleGoToSibling(1)
          }
        ],
        [
          HOTKEYS.VIM_GO_TO_PREV_SIBING,
          {
            label: 'Go to previous sibling',
            combo: 'k',
            allowInInput: true,
            onKeyDown: handleGoToSibling(-1)
          }
        ],
        [
          HOTKEYS.VIM_GO_TO_FIRST_SIBLING,
          {
            label: 'go to first sibling',
            combo: 'g',
            allowInInput: true,
            onKeyDown: (e) => {
              const { controller } = props;
              const model = controller.currentModel;
              const currentKey = model.focusKey;
              const siblingTopicKeys = model.getParentTopic(currentKey).subKeys;
              const firstSiblingTopicKey = siblingTopicKeys.get(0);
              handleFocusTopic(firstSiblingTopicKey)(e);
            }
          }
        ],
        [
          HOTKEYS.VIM_GO_TO_LAST_SIBLING,
          {
            label: 'go to last sibling',
            combo: 'shift + g',
            allowInInput: true,
            onKeyDown: (e) => {
              const { controller } = props;
              const model = controller.currentModel;
              const currentKey = model.focusKey;
              const siblingTopicKeys = model.getParentTopic(currentKey).subKeys;
              const lastSiblingTopicKey = siblingTopicKeys.get(siblingTopicKeys.size - 1);
              handleFocusTopic(lastSiblingTopicKey)(e);
            }
          }
        ],
        [
          HOTKEYS.VIM_DELETE_NOTE,
          {
            label: 'delete notes',
            combo: 'd',
            allowInInput: true,
            onKeyDown: (e) => {
              const { controller } = props;
              const model = controller.currentModel;
              const nextFocusTopicKey = getNextSiblingOrParentTopicKey(model.focusKey, model, 1);
              handleHotKeyDown(StandardOpType.DELETE_TOPIC)(e);
              const opArg = {
                opType: OpType.FOCUS_TOPIC_AND_MOVE_TO_CENTER,
                topicKey: nextFocusTopicKey,
                focusMode: FocusMode.NORMAL,
                model: controller.currentModel
              };
              controller.run('operation', { ...props, ...opArg });
            }
          }
        ],
        [
          HOTKEYS.VIM_EDIT_CONTENT,
          {
            label: 'edit the note content',
            combo: 'e',
            allowInInput: true,
            onKeyDown: handleHotKeyDown(StandardOpType.START_EDITING_CONTENT, props)
          }
        ],
        [
          HOTKEYS.VIM_SET_AS_EIDTOR_ROOT,
          {
            label: 'set as editor root',
            combo: 'r',
            allowInInput: true,
            onKeyDown: handleHotKeyDown(OpType.SET_EDITOR_ROOT_AND_MOVE_TO_CENTER, props)
          }
        ],
        [
          HOTKEYS.VIM_UNDO,
          {
            label: 'undo',
            combo: 'u',
            allowInInput: true,
            onKeyDown: handleHotKeyDown('undo', props)
          }
        ],
        [
          HOTKEYS.VIM_REDO,
          {
            label: 'redo',
            combo: 'shift + u',
            allowInInput: true,
            onKeyDown: handleHotKeyDown('redo', props)
          }
        ],
        [
          HOTKEYS.VIM_TOGGLE_COLLAPSE_ALL,
          {
            label: 'collapse all',
            combo: 'shift + o',
            allowInInput: true,
            onKeyDown: (e) => {
              const { controller } = props;
              const model = controller.currentModel;
              const opType = all_collapsed && getChildrenCount(model, model.focusKey) < 100 ? StandardOpType.EXPAND_ALL : StandardOpType.COLLAPSE_ALL;
              controller.run('operation', { ...props, model, opType, allowUndo: false });
              all_collapsed = !all_collapsed;
              // do not support expand all as of now because the expand all may make the page stuck when there are too many nodes.
              e.stopImmediatePropagation();
              e.preventDefault();
            },
          }
        ],
        [
          HOTKEYS.VIM_CENTER_TO_TOPIC,
          {
            label: 'center to topic',
            combo: 'c',
            allowInInput: true,
            onKeyDown: (e) => {
              const { controller } = props;
              const model = controller.currentModel;
              controller.run('moveTopicToCenter', {
                ...props,
                model,
                topicKey: model.focusKey,
                allowUndo: false
              });
              e.stopImmediatePropagation();
              e.preventDefault();
            },
          }
        ],
        [
          HOTKEYS.VIM_SEARCH_TOPICS,
          {
            label: 'search topics',
            combo: '/',
            allowInInput: true,
            onKeyDown: handleHotKeyDown(StandardOpType.SET_FOCUS_MODE, {
              ...props, focusMode: FOCUS_MODE_SEARCH
            })
          }
        ],
        [
          HOTKEYS.VIM_OPEN_EVERNOTE_NOTE_OR_JUPYTER_NOTEBOOK,
          {
            label: 'open evernote and jupyter',
            combo: '.',
            allowInInput: true,
            onKeyDown: (e) => {
              const { controller } = props;
              const model = controller.currentModel;
              // @ts-ignore
              if (hasJupyterNotebookAttached({ model })) {
                openJupyterNotebookFromTopic({ model });
                e.stopImmediatePropagation();
                e.preventDefault();
              }

              // @ts-ignore
              else if (hasEvernoteAttached({ model })) {
                handleHotKeyDown(EvernoteRelatedOpType.OPEN_EVERNOTE_LINK)(e);
              }
            }
          }
        ],
        [
          HOTKEYS.VIM_NEW_JUPYTER_NOTEBOOK,
          {
            label: 'create a new jupyter notebook',
            combo: 'n',
            allowInInput: true,
            onKeyDown: (e) => {
              const { controller } = props;
              const model = controller.currentModel;
              createJupyterNoteWithPrecheck({ controller, model, topicKey: model.focusKey });
              e.stopImmediatePropagation();
              e.preventDefault();
            }
          }
        ],
      ]);
      newTopicHotKeys.set(
        HOTKEYS.VIM_CUT,
        {
          label: 'Cut the current note',
          combo: 'x',
          allowInInput: false,
          onKeyDown: handleHotKeyDown(CopyPasteRelatedOpType.SET_COPIED_ROOT, props)
        }
      );

      newTopicHotKeys.set(
        HOTKEYS.VIM_PASTE,
        {
          label: 'Patest the copied notes',
          combo: 'v',
          allowInInput: false,
          onKeyDown: handleHotKeyDown([CopyPasteRelatedOpType.PASTE_NOTE, OpType.EXPAND], props)
        }
      );

      const newGlobalHotKeys = new Map([
        [
          HOTKEYS.VIM_ESCAPE_ESC,
          {
            label: 'Escape',
            combo: 'esc',
            allowInInput: true,
            onKeyDown: handleHotKeyDown(OpType.FOCUS_TOPIC_AND_MOVE_TO_CENTER, { focusMode: FocusMode.NORMAL, allowUndo: false })
          }
        ],
        [
          HOTKEYS.VIM_ESCAPE_CTRL_PLUS_RIGHT_SQUARE_BRACKET,
          {
            label: 'Escape',
            combo: 'ctrl + ]',
            allowInInput: true,
            onKeyDown: handleHotKeyDown(OpType.FOCUS_TOPIC_AND_MOVE_TO_CENTER, { focusMode: FocusMode.NORMAL, allowUndo: false })
          }
        ],
        [
          HOTKEYS.VIM_GO_TO_PREVIOUS_TOPIC,
          {
            label: 'Escape',
            combo: 'ctrl + o',
            allowInInput: true,
            onKeyDown: (e) => {
              const { controller } = props;
              controller.run("goToPreviousTopic", { ...props, allowUndo: false });
              e.stopImmediatePropagation();
              e.preventDefault();
            }
          }
        ],
        [
          HOTKEYS.VIM_GO_TO_NEXT_TOPIC,
          {
            label: 'Escape',
            combo: 'ctrl + i',
            allowInInput: true,
            onKeyDown: (e) => {
              const { controller } = props;
              controller.run("goToNextTopic", { ...props, allowUndo: false });
              e.stopImmediatePropagation();
              e.preventDefault();
            }
          }
        ]
      ]);
      return {
        topicHotKeys: new Map([...topicHotKeys, ...newTopicHotKeys]),
        globalHotKeys: new Map([...globalHotKeys, ...newGlobalHotKeys])
      };
    }
  };
}
