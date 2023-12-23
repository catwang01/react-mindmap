import { FocusMode, getKeyPath, getRelationship, OpType as StandardOpType, TopicRelationship } from "@blink-mind/core";
import { expand } from "../../utils";


export const OpType = {
  FOCUS_TOPIC_AND_MOVE_TO_CENTER: "FOCUS_TOPIC_AND_MOVE_TO_CENTER",
  SET_EDITOR_ROOT_AND_MOVE_TO_CENTER: "SET_EDITOR_ROOT_AND_MOVE_TO_CENTER",
  ENHANCED_EXPAND_TO: "ENHANCED_EXPAND_TO",
  EXPAND: "EXPAND",
};

export const OpTypeMapping = [
  [
    OpType.FOCUS_TOPIC_AND_MOVE_TO_CENTER,
    (props) => {
      const {
        controller, topicKey, focusMode: focusMode = FocusMode.NORMAL, allowUndo, includeInHistory
      } = props;
      delete props['opType'];
      controller.run('operation', {
        ...props,
        opArray: [
          {
            opType: StandardOpType.FOCUS_TOPIC,
            topicKey,
            focusMode,
            allowUndo,
            includeInHistory
          },
          {
            opType: OpType.ENHANCED_EXPAND_TO,
            topicKey
          }
        ],
        callback: () => {
          controller.run('moveTopicToCenter', { ...props, model: controller.currentModel, topicKey });
        }
      });
      return controller.currentModel;
    }
  ],
  [
    OpType.SET_EDITOR_ROOT_AND_MOVE_TO_CENTER,
    (props) => {
      const {
        controller, topicKey, focusMode: focusMode = FocusMode.NORMAL, allowUndo, includeInHistory,
      } = props;
      delete props['opType'];
      controller.run('operation', {
        ...props,
        opArray: [
          {
            opType: StandardOpType.SET_EDITOR_ROOT,
            topicKey,
            focusMode,
            allowUndo,
            includeInHistory,
          },
        ],
        callback: () => {
          controller.run('moveTopicToCenter', { ...props, model: controller.currentModel, topicKey });
        }
      });
      return controller.currentModel;
    }
  ],
  [
    OpType.ENHANCED_EXPAND_TO,
    (props) => {
      let { model, topicKey } = props;
      const keys = getKeyPath(model, topicKey).filter(t => t !== topicKey);
      model = model.withMutations(m => {
        keys.forEach(topicKey => {
          m.setIn(['topics', topicKey, 'collapse'], false);
        });
      });
      // 要让这个节点在视口中可见
      if (topicKey !== model.editorRootTopicKey &&
        getRelationship(model, topicKey, model.editorRootTopicKey) !==
        TopicRelationship.DESCENDANT) {
        model = model.set('editorRootTopicKey', model.rootTopicKey);
      }
      return model;
    }
  ],
  [
    OpType.EXPAND, expand
  ]
];
