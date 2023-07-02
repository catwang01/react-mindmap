import { nonEmpty } from "../../utils";

export const ensureSuffix = (path, suffix) => {
    let normalizedSuffix = suffix;
    if (!suffix.startsWith('.'))
        normalizedSuffix = '.' + normalizedSuffix
    if (!path.endsWith(normalizedSuffix))
        return `${path}${normalizedSuffix}`;
    return path;
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
