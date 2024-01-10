import { nonEmpty } from "../../utils";
import { v4 as uuidv4 } from 'uuid';
import { Map as ImmutableMap } from 'immutable';
import { List } from "immutable";

export const ensureSuffix = (path, suffix) => {
    let normalizedSuffix = suffix;
    if (!suffix.startsWith('.'))
        normalizedSuffix = '.' + normalizedSuffix
    if (!path.endsWith(normalizedSuffix))
        return `${path}${normalizedSuffix}`;
    return path;
}

export const getJupyterData = ({ model }) => {
    return model?.getIn(["extData", "jupyter"], null) ?? ImmutableMap();
}

export const getAllJupyterNotebooks = ({ model }) => {
    return getJupyterData({ model }).getIn(["allnotes"], List());
}

export const getAttachedJupyterNotebooks = ({ model }) => {
    return getJupyterData({ model }).getIn(["attached"], ImmutableMap());
}

export const getAttachedJupyterNotebookPaths = ({ model }) => {
    const jupyterData = getAttachedJupyterNotebooks({ model });
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