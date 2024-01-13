import { Map as ImmutableMap, Record, List } from 'immutable';
import { v4 as uuidv4 } from 'uuid';
import { nonEmpty } from "../../utils";
import { ensureSuffix } from "../../utils/stringUtils";

export const getJupyterData = ({ model }) => {
    return model?.getIn(["extData", "jupyter"], null) ?? ImmutableMap();
}

export const getAllJupyterNotebooks = ({ model }) => {
    return getJupyterData({ model }).getIn(["allnotes"], List());
}

export const getAttachedJupyterNotebooks = ({ model }) => {
    return getJupyterData({ model }).getIn(["attached"], ImmutableMap());
}

export const setAttachedJupyterNotebooks = ({ model, attached }) => {
    return model.setIn(["extData", "jupyter", "attached"], attached);
}

export const getAttachedJupyterNotebookPaths = ({ model }) => {
    const jupyterData = getAttachedJupyterNotebooks({ model });
    // @ts-ignore
    const jupyter_notebook_paths = Array.from(jupyterData.values()).map(x => x.get("path"))
    return jupyter_notebook_paths
}

export const hasJupyterNotebookAttached = ({ model, topicKey }) => {
    const jupyter_notebook_path = getJupyterNotebookPath({ model, topicKey })
    return nonEmpty(jupyter_notebook_path);
}

export const getJupyterNotebookPath = ({ model, topicKey }) => {
    if (!nonEmpty(topicKey))
        topicKey = model.focusKey;
    const jupyter_notebook_path = getAttachedJupyterNotebooks({ model }).getIn([topicKey, "path"])
    return jupyter_notebook_path;
}

export const generateRandomPath = () => {
    const jupyter_notebook_id = uuidv4();
    const jupyter_notebook_path = jupyter_notebook_id
        + '/'
        + ensureSuffix(jupyter_notebook_id, ".ipynb");
    return jupyter_notebook_path;
}

export const getOrphanJupyterNotes = ({ model, allNotes }) => {
    if (!nonEmpty(allNotes)) {
        allNotes = getAllJupyterNotebooks({ model });
    }
    const existingAttachedNotePaths = getAttachedJupyterNotebookPaths({ model }).filter(nonEmpty);
    const orphans = allNotes.filter(note => !existingAttachedNotePaths.some(x => x.includes(note.getIn(["id"], null))));
    return orphans
}