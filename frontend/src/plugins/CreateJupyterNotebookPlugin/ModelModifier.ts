import { ModelModifier, 
    FocusMode as StandardFocusMode, 
    getAllSubTopicKeys } from "@blink-mind/core";
import { fromJS } from "immutable";
import { trimWordStart } from "../../utils/stringUtils";
import { JUPYTER_ROOT_FOLDER } from "./constant";
import { generateRandomPath, 
    getAttachedJupyterNotebooks,
     setAttachedJupyterNotebooks } from "./utils";

export const setAllJupyterNotebooks = ({ model, allJupyterNotebooks }) => {
    const newModel = model.setIn(
        ['extData', 'jupyter', 'allnotes'],
        fromJS(allJupyterNotebooks.toSorted())
    );
    return newModel;
}

export const deleteAssociatedJupyterNote = ({ model, topicKey }) => {
    return deleteAssociatedJupyterNotes({ model, topicKeys: [topicKey ?? model.focusKey] })
}

export const deleteAssociatedJupyterNoteRecursive = ({ model, topicKey }) => {
    const subTopicKeys = getAllSubTopicKeys( model, topicKey ?? model.focusKey)
    const topicKeys = [topicKey ?? model.focusKey, ...subTopicKeys]
    return deleteAssociatedJupyterNotes({ model, topicKeys })
}

export const deleteAssociatedJupyterNotes = ({ model, topicKeys }) => {
    const attachedNotebooks = getAttachedJupyterNotebooks({ model })
    const newAttachedNotebooks = attachedNotebooks.withMutations(notebooks => {
        topicKeys.forEach(topicKey => {
            if (notebooks.has(topicKey))
            {
                notebooks = notebooks.delete(topicKey)
            }
        })
        return notebooks
    });
    const newModel = setAttachedJupyterNotebooks({ model, attached: newAttachedNotebooks });
    return newModel;
}

export const associateJupyterNotebook = ({ model, topicKey, jupyter_notebook_path }) => {
    const final_jupyter_notebook_path = trimWordStart(jupyter_notebook_path, JUPYTER_ROOT_FOLDER + '/') ?? generateRandomPath();
    const modelWithJupyterNotebookPath = model.setIn(
        ["extData", "jupyter", "attached", topicKey ?? model.focusKey, "path"],
        final_jupyter_notebook_path
    )
    const newModel = ModelModifier.setFocusMode({
        model: modelWithJupyterNotebookPath,
        focusMode: StandardFocusMode.NORMAL
    });
    return newModel;
}