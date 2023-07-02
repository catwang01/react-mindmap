import '../../icon/index.css';
import { FOCUS_MODE_SEARCH } from '../NewSearchPlugin/utils';

import { FocusMode, OpType, } from "@blink-mind/core";
import { isTopicVisible } from '../../utils';
import { NEW_OPERATION_OPTIONS } from '../AddNewOperationsPlugin';
import { openJupyterNotebookFromTopic } from '../CreateJupyterNotebookPlugin';
import { hasJupyterNotebookAttached } from '../CreateJupyterNotebookPlugin/utils';
import { OpType as EvernoteRelatedOpType } from '../EvernotePlugin';
import { hasEvernoteAttached } from '../EvernotePlugin/utils';

let HotKeyName = {
  ASSOCIATE_NOTE: 'ASSOCIATE_NOTE',
};

function op(opType, props) {
  const { topicKey, controller } = props;
  if (topicKey === undefined) {
    props = { ...props, topicKey: controller.currentModel.focusKey };
  }
  controller.run('operation', { ...props, opType });
}

const getSiblingTopicKey = (topicKey, model, offset) => {
  const parentTopic = model.getParentTopic(topicKey);
  const siblingTopicKeys = parentTopic.subKeys
  const siblingKeyCount = siblingTopicKeys.size
  if (siblingKeyCount === 0) return null;
  if (siblingKeyCount === 1) return topicKey;

  const index = siblingTopicKeys.findIndex(key => key == topicKey);
  const siblingIndex = (index + offset + siblingKeyCount) % siblingKeyCount;
  return siblingTopicKeys.get(siblingIndex);
}

const getParentTopicKey = ({ controller }) => {
  const model = controller.currentModel;
  const topicKey = model.focusKey;
  const parentKey = model.getParentTopic(topicKey)?.key;
  return parentKey;
}

const getNextSiblingOrParentTopicKey = (topicKey, model, offset) => {
  const nextSiblingTopicKey = getSiblingTopicKey(topicKey, model, offset);
  if (!nextSiblingTopicKey || nextSiblingTopicKey === topicKey)
    return model.getParentTopic(topicKey)?.key;
  return nextSiblingTopicKey;
}

const items = [
  {
    icon: 'edit',
    label: 'Associate a note',
    // shortcut: ['Space'],
    rootCanUse: false,
    opType: 'ASSOCIATE_A_NOTE',
    opOperation: NEW_OPERATION_OPTIONS.ASSOCIATE_A_NOTE
  },
]

export function HotKeyPlugin() {
  let all_collapsed = false;
  return {
    customizeHotKeys: function (props, next) {
      const handleHotKeyDown = (opType, opArg) => e => {
        // log('HotKeyPlugin', opType);
        op(opType, { ...props, ...opArg });
        e.stopImmediatePropagation();
        e.preventDefault();
      };
      const res = next();
      const { topicHotKeys, globalHotKeys } = res;
      const newTopicHotKeys = new Map([
        [
          'ToggleCollapse',
          {
            label: 'toggle collapse',
            combo: 'o',
            allowInInput: true,
            onKeyDown: handleHotKeyDown('TOGGLE_COLLAPSE', { allowUndo: false })
          }
        ],
        [
          'GoToParent',
          {
            label: 'associate notes',
            combo: 'h',
            rootCanUse: false,
            allowInInput: true,
            onKeyDown: (e) => {
              const { controller } = props;
              const model = controller.currentModel;
              if (model.focusKey === model.rootTopicKey)
                return;
              // a non-root topic key must have a parentKey
              const parentKey = getParentTopicKey(props);
              // if not visible
              if (isTopicVisible(model, parentKey)) {
                controller.run('operation', {
                  ...props,
                  topicKey: parentKey,
                  opType: OpType.SET_EDITOR_ROOT,
                  allowUndo: false,
                })
              }
              const opArg = {
                topicKey: parentKey,
                focusMode: FocusMode.NORMAL,
                model: controller.currentModel,
                allowUndo: false
              }
              handleHotKeyDown(OpType.FOCUS_TOPIC, opArg)(e);
            }
          }
        ],
        [
          'GoToChild',
          {
            label: 'associate notes',
            combo: 'l',
            allowInInput: true,
            onKeyDown: (e) => {
              const { controller } = props;
              const model = controller.currentModel;
              const currentKey = model.focusKey;
              const currentTopic = model.getTopic(currentKey)
              const firstSubKey = currentTopic.subKeys.get(0);
              if (firstSubKey === undefined) return;
              if (currentTopic.collapse) {
                controller.run('operation', {
                  opType: OpType.TOGGLE_COLLAPSE, topicKey: currentKey, ...props
                });
              }
              const opArg = {
                topicKey: firstSubKey,
                focusMode: FocusMode.NORMAL,
                model: controller.currentModel,
                allowUndo: false
              }
              handleHotKeyDown(OpType.FOCUS_TOPIC, opArg)(e);
            }
          }
        ],
        [
          'GoToNextSibing',
          {
            label: 'associate notes',
            combo: 'j',
            allowInInput: true, onKeyDown: (e) => {
              const { controller } = props;
              const model = controller.currentModel;
              const currentKey = model.focusKey;

              const nextSiblingKey = getSiblingTopicKey(currentKey, model, 1);
              const opArg = {
                topicKey: nextSiblingKey,
                focusMode: FocusMode.NORMAL,
                model: controller.currentModel,
                allowUndo: false
              }
              handleHotKeyDown(OpType.FOCUS_TOPIC, opArg)(e);
            }
          }
        ],
        [
          'GoToPrevSibing',
          {
            label: 'associate notes',
            combo: 'k',
            allowInInput: true,
            onKeyDown: (e) => {
              const { controller } = props;
              const model = controller.currentModel;
              const currentKey = model.focusKey;

              const prevSiblingKey = getSiblingTopicKey(currentKey, model, -1);
              const opArg = {
                topicKey: prevSiblingKey,
                focusMode: FocusMode.NORMAL,
                model: controller.currentModel,
                allowUndo: false
              }
              handleHotKeyDown(OpType.FOCUS_TOPIC, opArg)(e);
            }
          }
        ],
        [
          'Delete note',
          {
            label: 'associate notes',
            combo: 'd',
            allowInInput: true,
            onKeyDown: (e) => {
              const { controller } = props;
              const model = controller.currentModel;
              const nextFocusTopicKey = getNextSiblingOrParentTopicKey(model.focusKey, model, 1);
              handleHotKeyDown(OpType.DELETE_TOPIC)(e);
              const opArg = {
                opType: OpType.FOCUS_TOPIC,
                topicKey: nextFocusTopicKey,
                focusMode: FocusMode.NORMAL,
                model: controller.currentModel
              }
              controller.run('operation', { ...props, ...opArg })
            }
          }
        ],
        [
          'EDIT_CONTENT',
          {
            label: 'edit the note content',
            combo: 'e',
            allowInInput: true,
            onKeyDown: handleHotKeyDown(OpType.START_EDITING_CONTENT)
          }
        ],
        [
          'SET_AS_EIDTOR_ROOT',
          {
            label: 'set as editor root',
            combo: 'r',
            allowInInput: true,
            onKeyDown: handleHotKeyDown(OpType.SET_EDITOR_ROOT)
          }
        ],
        [
          'UNDO',
          {
            label: 'undo',
            combo: 'u',
            allowInInput: true,
            onKeyDown: (e) => {
              const { controller } = props;
              controller.run('undo', { ...props })
              e.stopImmediatePropagation();
              e.preventDefault();
            }
          }
        ],
        [
          'REDO',
          {
            label: 'redo',
            combo: 'shift + u',
            allowInInput: true,
            onKeyDown: (e) => {
              const { controller } = props;
              controller.run('redo', { ...props })
              e.stopImmediatePropagation();
              e.preventDefault();
            }
          }
        ],
        [
          'TOGGLE_COLLAPSE_ALL',
          {
            label: 'collapse all',
            combo: 'shift + o',
            allowInInput: true,
            onKeyDown: (e) => {
              const { controller } = props;
              const model = controller.currentModel;
              const opType = all_collapsed ? OpType.EXPAND_ALL : OpType.COLLAPSE_ALL;
              controller.run('operation', { ...props, model, opType, allowUndo: false });
              all_collapsed = !all_collapsed;
              e.stopImmediatePropagation();
              e.preventDefault();
            },
          }
        ],
        [
          'CENTER_TO_TOPIC',
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
          'SEARCH_TOPICS',
          {
            label: 'search topics',
            combo: '/',
            allowInInput: true,
            onKeyDown: handleHotKeyDown(OpType.SET_FOCUS_MODE, {
              ...props, focusMode: FOCUS_MODE_SEARCH
            })
          }
        ],
        [
          'Open Evernote Note or Jupyter Notebook',
          {
            label: 'open evernote and jupyter',
            combo: '.',
            allowInInput: true,
            onKeyDown: (e) => {
              const { controller } = props;
              const model = controller.currentModel;
              if (hasJupyterNotebookAttached({ model })) {
                openJupyterNotebookFromTopic({ model });
                e.stopImmediatePropagation();
                e.preventDefault();
              }
              else if (hasEvernoteAttached({ model })) {
                handleHotKeyDown(EvernoteRelatedOpType.OPEN_EVERNOTE_LINK)(e);
              }
            }
          }
        ]
      ]);
      const newGlobalHotKeys = new Map([
        [
          'ESCAPE_esc',
          {
            label: 'Escape',
            combo: 'esc',
            allowInInput: true,
            onKeyDown: handleHotKeyDown(OpType.FOCUS_TOPIC, { focusMode: FocusMode.NORMAL, allowUndo: false })
          }
        ],
        [
          'ESCAPE_ctrl+]',
          {
            label: 'Escape',
            combo: 'ctrl + ]',
            allowInInput: true,
            onKeyDown: handleHotKeyDown(OpType.FOCUS_TOPIC, { focusMode: FocusMode.NORMAL, allowUndo: false })
          }
        ],
      ]);
      return {
        topicHotKeys: new Map([...topicHotKeys, ...newTopicHotKeys]),
        globalHotKeys: new Map([...globalHotKeys, ...newGlobalHotKeys])
      };
    }
  }
}