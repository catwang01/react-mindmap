import '../../icon/index.css';

import { FocusMode, OpType } from "@blink-mind/core";
import { NEW_OPERATION_OPTIONS } from '../AddNewOperationsPlugin';

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
  const siblingKeys = parentTopic.subKeys
  const siblingsKeyCount = siblingKeys.size
  if (siblingsKeyCount === 0) return null;
  if (siblingsKeyCount === 1 && offset !== 0) return null;

  const index = siblingKeys.findIndex(key => key == topicKey);
  const siblingIndex = (index + offset + siblingsKeyCount) % siblingsKeyCount;
  return siblingKeys.get(siblingIndex);
}

const getParentTopicKey = ({ controller }) => {
  const model = controller.currentModel;
  const topicKey = model.focusKey;
  const parentKey = model.getParentTopic(topicKey)?.key;
  return parentKey;
}

const getNextSiblingOrParentTopicKey = (topicKey, model, offset) => {
  const nextSiblingTopicKey = getSiblingTopicKey(topicKey, model, offset);
  if (nextSiblingTopicKey) return nextSiblingTopicKey;
  return model.getParentTopic(topicKey)?.key;
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
            onKeyDown: handleHotKeyDown('TOGGLE_COLLAPSE')
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
              const topicKey = getParentTopicKey(props);
              if (!topicKey) return;
              const opArg = {
                topicKey,
                focusMode: FocusMode.NORMAL
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
                model: controller.currentModel
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
                model: controller.currentModel
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
                model: controller.currentModel
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
        ]
      ]);
      const newGlobalHotKeys = new Map([
        [
          'ESCAPE_esc',
          {
            label: 'Escape',
            combo: 'esc',
            allowInInput: true,
            onKeyDown: handleHotKeyDown(OpType.FOCUS_TOPIC, { focusMode: FocusMode.NORMAL })
          }
        ],
        [
          'ESCAPE_ctrl+]',
          {
            label: 'Escape',
            combo: 'ctrl + ]',
            allowInInput: true,
            onKeyDown: handleHotKeyDown(OpType.FOCUS_TOPIC, { focusMode: FocusMode.NORMAL })
          }
        ]
      ]);
      return {
        topicHotKeys: new Map([...topicHotKeys, ...newTopicHotKeys]),
        globalHotKeys: new Map([...globalHotKeys, ...newGlobalHotKeys])
      };
    }
  }
}