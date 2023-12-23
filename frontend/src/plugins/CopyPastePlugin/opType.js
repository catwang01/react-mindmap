import { MindMapToaster } from "../../component/toaster";
import { log } from "./log";
import { getChildrenCount } from "../../utils";

export const OpType = {
    SET_COPIED_ROOT: "SET_COPIED_ROOT",
    PASTE_NOTE: "PASTE_NOTE",
};

export const OpTypeMapping = {
    SET_COPIED_ROOT: (props) => {
        const { model, topicKey } = props;
        const newModel = model.setIn(["extData", "copyAndPastePlugin", "CopiedTopicRoot"], topicKey);
        const message = `${getChildrenCount(model, topicKey) + 1} notes has been copied!`
        MindMapToaster.show({ message });
        return newModel;
    },
    PASTE_NOTE: (props) => {
        log("paste note started")
        const { model, topicKey: dstTopicKey } = props;
        const copiedTopicKey = model.getIn(["extData", "copyAndPastePlugin", "CopiedTopicRoot"])
        let copiedTopic = model.getTopic(copiedTopicKey)
        const noteToCopyCount = getChildrenCount(model, copiedTopicKey) + 1;

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

        const message = `${noteToCopyCount} notes has been pasted!`
        MindMapToaster.show({ message });
        log("paste note finished!")
        return newModel;
    }
}