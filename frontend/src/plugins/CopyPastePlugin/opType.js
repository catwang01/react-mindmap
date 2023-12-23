import { getAllSubTopicKeys } from "@blink-mind/core";
import { log } from "./log";

export const OpType = {
    SET_COPIED_ROOT: "SET_COPIED_ROOT",
    PASTE_NOTE: "PASTE_NOTE",
};

export const OpTypeMapping = {
    SET_COPIED_ROOT: (props) => {
        const { model, topicKey } = props;
        const newModel = model.setIn(["extData", "copyAndPastePlugin", "CopiedTopicRoot"], topicKey);
        console.log(`${getAllSubTopicKeys(model, topicKey).length} notes has been copied!`);
        return newModel;
    },
    PASTE_NOTE: (props) => {
        log("paste note started")
        const { model, topicKey: dstTopicKey } = props;
        log(model.topics.toJS())
        const copiedTopicKey = model.getIn(["extData", "copyAndPastePlugin", "CopiedTopicRoot"])
        let copiedTopic = model.getTopic(copiedTopicKey)

        log({ dstTopicKey, copiedTopicKey })
        if (!dstTopicKey
            || !copiedTopicKey
            || dstTopicKey === copiedTopicKey
            || dstTopicKey === copiedTopic.parentKey)
            return model;
        const newModel = model.withMutations(m => {
            m.deleteIn(["extData", "copyAndPastePlugin", "CopiedTopicRoot"])
                .updateIn(['topics', copiedTopic.parentKey, 'subKeys'],
                    subKeys => subKeys.delete(subKeys.indexOf(copiedTopicKey))
                )
                .setIn(['topics', copiedTopicKey, 'parentKey'], dstTopicKey)
                .updateIn(['topics', dstTopicKey, 'subKeys'],
                    subKeys => subKeys.push(copiedTopicKey)
                )
        })
        log(newModel.topics.toJS())
        log("paste note finished!")
        return newModel;
    }
}