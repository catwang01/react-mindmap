import { OpType as StandardOpType, getAllSubTopicKeys } from "@blink-mind/core";
import { Map as ImmutableMap } from "immutable";
import { getEnv } from "../../utils";
import { FOCUS_MODE_SEARCH_NOTE_TO_ATTACH } from "../EvernoteSearchPlugin";

export const OperationMap = {
  ADD_NOTE_RELATION: (props) => {
    const { topicKey, note, model } = props;
    let newModel = model;
    if (!model.getIn(['extData', 'evernote'])) {
      newModel = model.setIn(['extData', 'evernote'], new ImmutableMap());
    }
    newModel = newModel.updateIn(['extData', 'evernote'], m => m.set(topicKey, note));
    return newModel;
  },
  DELETE_NOTE_RELATION: (props) => {
    const { topicKey, model } = props;
    let newModel = model;
    const allDeleteKeys = getAllSubTopicKeys(newModel, topicKey);
    for (let key of [...allDeleteKeys, topicKey]) {
      newModel = newModel.deleteIn(['extData', 'evernote', key]);
    }
    return newModel;
  },
  ASSOCIATE_A_NOTE: (props) => {
    let { controller } = props;
    controller.run('operation', { ...props, focusMode: FOCUS_MODE_SEARCH_NOTE_TO_ATTACH, opType: StandardOpType.FOCUS_TOPIC });
    return controller.currentModel;
  },
  OPEN_EVERNOTE_LINK: (props) => {
    const { topicKey, controller } = props;
    const note = controller.currentModel.getIn(["extData", "evernote", topicKey]);
    if (note !== undefined) {
      const shardId = getEnv("REACT_APP_EVERNOTE_SHARD_ID");
      const userId = getEnv("REACT_APP_EVERNOTE_USER_ID");
      const url = `evernote:///view/${userId}/${shardId}/${note.guid}/${note.guid}/`;
      window.open(url, '_blank', 'noreferrer');
    } else {
      alert(`Topic doesn't have an associated note`);
    }
    return controller.currentModel;
  }
};
