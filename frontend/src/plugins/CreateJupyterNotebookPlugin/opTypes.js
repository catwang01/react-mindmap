import { ModelModifier } from "@blink-mind/core";
import { FocusMode as StandardFocusMode } from "@blink-mind/core";
import { generateRandomPath } from "./utils";
import { trimWordStart } from "../../utils/stringUtils";
import { JUPYTER_ROOT_FOLDER } from "./constant";
import { fromJS } from "immutable";

export const OpType = {
    ASSOCIATE_JUPYTER_NOTE: "ASSOCIATE_JUPYTER_NOTE",
    DELETE_ASSOCIATED_JUPYTER_NOTE: "DELETE_ASSOCIATED_JUPYTER_NOTE",
    SET_ALL_JUPYTER_NOTEBOOKS: "SET_ALL_JUPYTER_NOTEBOOKS",
}

export const OpTypeMapping = [
    [
        OpType.ASSOCIATE_JUPYTER_NOTE,
        ({ model, topicKey, jupyter_notebook_path }) => {
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
    ],
    [
        OpType.DELETE_ASSOCIATED_JUPYTER_NOTE,
        ({ model, topicKey }) => {
            const newModel = model.deleteIn(['extData', 'jupyter', "attached", topicKey ?? model.focusKey]);
            return newModel;
        }
    ],
    [
        OpType.SET_ALL_JUPYTER_NOTEBOOKS,
        ({ model, allJupyterNotebooks }) => {
            console.log(OpType.SET_ALL_JUPYTER_NOTEBOOKS)
            const newModel = model.setIn(
                ['extData', 'jupyter', 'allnotes'],
                fromJS(allJupyterNotebooks.toSorted())
            );
            return newModel;
        }
    ]
];