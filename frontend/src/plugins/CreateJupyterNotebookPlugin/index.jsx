import { ModelModifier, FocusMode as StandardFocusMode, OpType as StandardOpType } from '@blink-mind/core';
import { Button, MenuDivider, MenuItem } from '@blueprintjs/core';
import { Map as ImmutableMap, fromJS } from 'immutable';
import React from 'react';
import '../../icon/index.css';
import { FocusMode, JUPYTER_BASE_URL, JUPYTER_CLIENT_ENDPOINT, JUPYTER_CLIENT_TYPE, JUPYTER_ROOT_FOLDER, OpType } from './constant';
import { getDialog } from './dialog';
import { JupyterClient } from './jupyter';
import { log } from './logger';
import { SearchPanel } from './search-panel';
import { trimWordStart } from './stringUtils';
import { generateRandomPath, getAllJupyterNotebooks, getJupyterNotebookPath, hasJupyterNotebookAttached } from './utils';

let jupyterClient = new JupyterClient(JUPYTER_CLIENT_ENDPOINT, {
    jupyterBaseUrl: JUPYTER_BASE_URL,
    rootFolder: JUPYTER_ROOT_FOLDER,
    clientType: JUPYTER_CLIENT_TYPE
});

const JupyterIcon = () => {
    return <div className="icon-jupyter" />
}

export const openJupyterNotebookLink = (path) => {
    const url = jupyterClient.getActualUrl(path)
    log(`Opening ${url}`)
    window.open(url, '_blank').focus()
}

export const openJupyterNotebookFromTopic = (props) => {
    const jupyter_notebook_path = getJupyterNotebookPath(props)
    if (jupyter_notebook_path) {
        openJupyterNotebookLink(jupyter_notebook_path)
    }
    else {
        alert("No jupyter notebook is attachd");
    }
}

const renderModalRemovingJuyterNotebook = (props) => {
    const { controller } = props;
    const onClickYes = () => {
        controller.run("operation", {
            ...props,
            opArray: [
                {
                    opType: OpType.DELETE_ASSOCIATED_JUPYTER_NOTE
                },
                {
                    opType: StandardOpType.SET_FOCUS_MODE,
                    focusMode: FocusMode.NOTIFY_REMOVED_JUPYTER_NOTEBOOK
                }
            ]
        })
    }

    const onClickNo = () => {
        controller.run('operation', {
            ...props,
            opType: StandardOpType.SET_FOCUS_MODE,
            focusMode: StandardFocusMode.NORMAL
        })
    }

    return getDialog(
        {
            key: "renderModalRemovingJuyterNotebook",
            title: "Do you want to remove the attached jupyter note?",
            buttons: [
                <Button onClick={onClickYes}>Yes</Button>,
                <Button onClick={onClickNo}>No</Button>
            ]
        }
    );
}

const renderModalFailedToCreateJupyterNotebook = (props) => {
    const { controller, errorMessage } = props;

    const onClickConfirm = () => {
        controller.run('operation', {
            ...props,
            opType: StandardOpType.SET_FOCUS_MODE,
            focusMode: StandardFocusMode.NORMAL
        })
    }

    return getDialog(
        {
            key: "renderModalFailedToCreateJupyterNotebook",
            title: "Failed to create jupyter notebook!",
            content: `Failed to create jupyter notebook due to error: ${errorMessage}`,
            buttons: [
                <Button onClick={onClickConfirm}>Confirm</Button>,
            ]
        }
    );
}


const renderModalNotifyRemovedJupyterNoteBook = (props) => {
    const { controller } = props;
    const onClickYes = () => {
        controller.run("operation", {
            ...props,
            opArray: [
                {
                    opType: OpType.DELETE_ASSOCIATED_JUPYTER_NOTE
                },
                {
                    opType: StandardOpType.SET_FOCUS_MODE,
                    focusMode: StandardFocusMode.NORMAL
                }
            ]
        })
    }
    return getDialog(
        {
            key: "renderModalNotifyRemovedJupyterNote",
            title: "The jupyter note has been remove!",
            buttons: [<Button onClick={onClickYes}>Yes</Button>]
        }
    )
}

const renderModalConfirmCreateJupyterNotebook = (props) => {
    const { controller } = props;
    const onClickYes = () => createJupyterNote(props);
    const onClickNo = () => {
        controller.run('operation', {
            ...props,
            opType: StandardOpType.SET_FOCUS_MODE,
            focusMode: StandardFocusMode.NORMAL
        })
    }

    return getDialog({
        key: "renderModalConfirmCreateJupyterNotebook",
        title: "Associated note is detected",
        content: "An evernote note is detected to be associated with the topic. Do you want to create it?",
        buttons: [
            <Button onClick={onClickYes}>Yes</Button>,
            <Button onClick={onClickNo}>No</Button>
        ]
    });
}

const focusModeCallbacks = new Map([
    [FocusMode.REMOVING_JUPYTER_NOTEBOOK, renderModalRemovingJuyterNotebook],
    [FocusMode.NOTIFY_REMOVED_JUPYTER_NOTEBOOK, renderModalNotifyRemovedJupyterNoteBook],
    [FocusMode.CONFIRM_CREATE_JUPYTER_NOTEBOOK, renderModalConfirmCreateJupyterNotebook],
    [FocusMode.FAILED_TO_CREATE_JUPYTER_NOTEBOOK, renderModalFailedToCreateJupyterNotebook],
])

export const createJupyterNote = (props) => {
    const { controller, topicKey } = props;
    const title = controller.run('getTopicTitle', props)
    log("Creating jupyter notebook with title: ", title)
    const jupyter_notebook_path = generateRandomPath();
    jupyterClient.createNote(jupyter_notebook_path, title)
        .then(response => {
            controller.run("operation", {
                ...props,
                topicKey,
                jupyter_notebook_path: jupyter_notebook_path,
                // hack: if no use controller.currentModel, the topic may not correctly be focused
                model: controller.currentModel,
                opType: OpType.ASSOCIATE_JUPYTER_NOTE,
                callback: () => openJupyterNotebookLink(jupyter_notebook_path)
            })
            if (controller.currentModel.focusMode === FocusMode.CONFIRM_CREATE_JUPYTER_NOTEBOOK) {
                controller.run("operation", {
                    ...props,
                    model: controller.currentModel,
                    opType: StandardOpType.SET_FOCUS_MODE,
                    focusMode: StandardFocusMode.NORMAL
                });
            }
        }
        ).catch(error => {
            controller.run("operation", {
                ...props,
                model: controller.currentModel,
                opType: StandardOpType.SET_FOCUS_MODE,
                errorMessage: error,
                focusMode: FocusMode.FAILED_TO_CREATE_JUPYTER_NOTEBOOK
            });
        });
}

export const createJupyterNoteWithPrecheck = (props) => {
    const { controller, topicKey } = props;
    const model = controller.currentModel;
    log("create note is invoked")
    if (model.getIn(["extData", "jupyter", topicKey])) {
        alert("Can't associate jupyter note on a topic which already associates a jupyter note!")
        return
    }
    if (model.getIn(["extData", "evernote", topicKey])) {
        controller.run('operation', {
            ...props,
            opType: StandardOpType.SET_FOCUS_MODE,
            focusMode: FocusMode.CONFIRM_CREATE_JUPYTER_NOTEBOOK
        })
        return
    }
    createJupyterNote(props)
}

export const associateJupyterNote = (props) => {
    const { controller, topicKey } = props;
    const model = controller.currentModel;
    log("associate note is invoked");
    if (model.getIn(["extData", "jupyter", topicKey])) {
        alert("Can't associate jupyter note on a topic which already associates a jupyter note!");
        return;
    }
    controller.run('operation', {
        ...props,
        model,
        opType: StandardOpType.SET_FOCUS_MODE,
        focusMode: FocusMode.ASSOCIATE_JUPYTER_NOTEBOOK
    });
}

export function CreateJupyterNotebookPlugin() {
    let searchWord;
    const setSearchWorld = s => {
        searchWord = s;
    };
    return {
        getOpMap: function (props, next) {
            const opMap = next();
            opMap.set(OpType.ASSOCIATE_JUPYTER_NOTE, ({ model, topicKey, jupyter_notebook_path }) => {
                const final_jupyter_notebook_path = trimWordStart(jupyter_notebook_path, JUPYTER_ROOT_FOLDER + '/') ?? generateRandomPath();
                const modelWithJupyterNotebookPath = model.setIn(
                    ["extData", "jupyter", topicKey ?? model.focusKey, "path"],
                    final_jupyter_notebook_path
                )
                const newModel = ModelModifier.setFocusMode({
                    model: modelWithJupyterNotebookPath,
                    focusMode: StandardFocusMode.NORMAL
                });
                return newModel;
            });
            opMap.set(OpType.DELETE_ASSOCIATED_JUPYTER_NOTE, ({ model, topicKey }) => {
                const newModel = model.deleteIn(['extData', 'jupyter', topicKey ?? model.focusKey]);
                return newModel;
            });

            return opMap;
        },
        renderTopicContentOthers: function (props, next) {
            const { topicKey, model } = props;
            const jupyterData = model.getIn(['extData', 'jupyter'], new ImmutableMap());
            const res = next();
            return <>
                {res}
                {jupyterData.get(topicKey) && <div onClick={() => openJupyterNotebookFromTopic(props)} > <JupyterIcon /></div>}
            </>
        },
        customizeTopicContextMenu: function (props, next) {
            log("customizeTopicContextMenu")
            log("parameters: ", props)

            const { topicKey, model } = props;

            const onClickCreateNoteItem = () => createJupyterNoteWithPrecheck(props)

            const onClickAssociateNoteItem = () => associateJupyterNote(props)

            const onClickOpenJupyterNoteItem = () => openJupyterNotebookFromTopic(props)

            const onClickRemoveJupyterNoteItem = () => {
                const { controller } = props;
                controller.run('operation', {
                    ...props,
                    opType: StandardOpType.SET_FOCUS_MODE,
                    // hack: if no use controller.currentModel, the topic may not correctly be focused
                    model: controller.currentModel,
                    focusMode: FocusMode.REMOVING_JUPYTER_NOTEBOOK,
                })
            }

            const createJupyterNoteItem = <MenuItem
                icon={<JupyterIcon />}
                key={"create note"}
                text={"Create jupyter note"}
                // labelElement={<kbd>{ "Ctrl + a" }</kbd>}
                onClick={onClickCreateNoteItem}
            />
            const associateJupyterNoteItem = <MenuItem
                icon={<JupyterIcon />}
                key={"associate note"}
                text={"Associate jupyter note"}
                // labelElement={<kbd>{ "Ctrl + a" }</kbd>}
                onClick={onClickAssociateNoteItem}
            />

            const openJupyterNoteItem = <MenuItem
                icon={<JupyterIcon />}
                key={"open jupyter note"}
                text={"Open jupyter note"}
                // labelElement={<kbd>{ "Ctrl + a" }</kbd>}
                onClick={onClickOpenJupyterNoteItem}
            />

            const removeJupyterNoteItem = <MenuItem
                icon={<JupyterIcon />}
                key={"remove jupyter note"}
                text={"Remove jupyter note"}
                // labelElement={<kbd>{ "Ctrl + a" }</kbd>}
                onClick={onClickRemoveJupyterNoteItem}
            />

            const associatedWithJupyterNote = hasJupyterNotebookAttached({ model, topicKey });

            return <>
                {next()}
                {<MenuDivider />}
                {!associatedWithJupyterNote && createJupyterNoteItem}
                {!associatedWithJupyterNote && associateJupyterNoteItem}
                {associatedWithJupyterNote && openJupyterNoteItem}
                {associatedWithJupyterNote && removeJupyterNoteItem}
            </>;
        },

        renderDiagramCustomize(props, next) {
            const res = next();
            const { model, controller } = props;
            if (model.focusMode === FocusMode.ASSOCIATE_JUPYTER_NOTEBOOK) {

                const getAllSections = async (setItems) => {
                    const notes = await jupyterClient.getNotes()
                    const existingAttachedNotePaths = getAllJupyterNotebooks(props);
                    const nonAttachedNotes = notes.filter(note => existingAttachedNotePaths.filter(x => x !== undefined).filter(x => x.includes(note.id)).length === 0);
                    setItems(nonAttachedNotes)
                }

                const searchPanelProps = {
                    key: 'search-panel',
                    ...props,
                    setSearchWorld,
                    getAllSections
                };
                res.push(<SearchPanel {...searchPanelProps} />);
            }
            return res;
        },
        // register new operations

        renderModal: (props, next) => {
            const { model: { focusMode } } = props;
            const res = next();
            if (!focusModeCallbacks.has(focusMode))
                return res;

            const newRes = focusModeCallbacks.get(focusMode)(props)

            return res === null ? [newRes] : [...res, newRes]
        },

        getAllowUndo(props, next) {
            const res = next();
            if (!res)
                return false;
            const { model } = props;
            if (FocusMode.hasOwnProperty(model.focusMode))
                return false;
            return res;
        },

        deserializeExtData: (props, next) => {
            const extData = next();
            let newExtData = extData;
            const jupyterData = extData.get('jupyter')
            if (jupyterData)
                newExtData = extData.set('jupyter', fromJS(jupyterData));
            return newExtData;
        }
    }
}