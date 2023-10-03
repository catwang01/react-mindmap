import { nonEmpty } from "../../utils";
import { v4 as uuidv4 } from 'uuid';
import { Map as ImmutableMap } from 'immutable';

export const ensureSuffix = (path, suffix) => {
    let normalizedSuffix = suffix;
    if (!suffix.startsWith('.'))
        normalizedSuffix = '.' + normalizedSuffix
    if (!path.endsWith(normalizedSuffix))
        return `${path}${normalizedSuffix}`;
    return path;
}

export const getAllJupyterNotebooks = ({ model }) => {
    const jupyterData = model.getIn(["extData", "jupyter"], new ImmutableMap())
    const jupyter_notebook_paths = Array.from(jupyterData.values()).map(x => x.get("path"))
    return jupyter_notebook_paths
}

export const hasJupyterNotebookAttached = ({ model, topicKey }) => {
    if (!nonEmpty(topicKey))
        topicKey = model.focusKey;
    const jupyter_notebook_path = model.getIn(['extData', 'jupyter', topicKey, "path"])
    return nonEmpty(jupyter_notebook_path);
}

export const getJupyterNotebookPath = ({ model, topicKey }) => {
    if (!nonEmpty(topicKey))
        topicKey = model.focusKey;
    const jupyter_notebook_path = model.getIn(['extData', 'jupyter', topicKey, "path"])
    return jupyter_notebook_path;
}

export const generateRandomPath = () => {
    const jupyter_notebook_id = uuidv4();
    const jupyter_notebook_path = jupyter_notebook_id + '/' + ensureSuffix(jupyter_notebook_id, ".ipynb");
    return jupyter_notebook_path;
}

export const getOrphanJupyterNotes = ({ allNotes, model }) => {
    const existingAttachedNotePaths = getAllJupyterNotebooks({ model });
    const orphans = allNotes.filter(note => existingAttachedNotePaths.filter(x => x !== undefined).filter(x => x.includes(note.id)).length === 0);
    return orphans
}