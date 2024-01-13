import { jupyterClient } from './jupyterClient';

import { FocusMode as StandardFocusMode, OpType as StandardOpType } from '@blink-mind/core';
import { Button, MenuDivider, MenuItem } from '@blueprintjs/core';
import "@blueprintjs/core/lib/css/blueprint.css";
import { Map as ImmutableMap, fromJS } from 'immutable';
import React from 'react';
import { SearchPanel } from '../../component/searchPanel';
import { MindMapToaster } from '../../component/toaster';
import '../../icon/index.css';
import { retrieveResultFromNextNode } from "../../utils/retrieveResultFromNextNode";
import { FocusMode } from './constant';
import { getDialog } from './dialog';
import { log } from './logger';
import { OpType, OpTypeMapping } from './opTypes';
import { generateRandomPath, getAttachedJupyterNotebooks, getJupyterNotebookPath, getOrphanJupyterNotes, hasJupyterNotebookAttached } from './utils';
import { nonEmpty } from '../../utils';
import { JupyterPopover } from './components/JupyterPopover';
import { getNotesWithCache } from './jupyterClient';

const JupyterIcon = React.memo(() => {
    return <div className="icon-jupyter" />
})

export const openJupyterNotebookLink = (path) => {
    const url = jupyterClient.getActualUrl(path)
    log(`Opening ${url}`)
    window.open(url, '_blank', 'noreferrer');
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
            MindMapToaster.show({ "message": "Note is created!" });
        }
        ).catch(error => {
            MindMapToaster.show({ "message": `Failed to create note! Error message: ${error.message}` });
        });
}

export const createJupyterNoteWithPrecheck = (props) => {
    const { controller, topicKey } = props;
    const model = controller.currentModel;
    MindMapToaster.show({ "message": "Creating jupyter notebook..." });
    if (model.getIn(["extData", "jupyter", topicKey])) {
        MindMapToaster.show({ "message": "Can't create jupyter note on a topic which already associates a jupyter note!" });
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
    const getPopOver = (controller, model) => {
        const popoverProps = {
            key: "jupyter-popover",
            controller,
            model,
            maxItemToShow: 10,
        }
        return <JupyterPopover {...popoverProps} />;
    }

    let searchWord;
    const setSearchWorld = s => {
        searchWord = s;
    };
    return {
        getOpMap: function (props, next) {
            const opMap = retrieveResultFromNextNode(next);
            OpTypeMapping.forEach(item => {
                const [opKey, opFunc] = item;
                opMap.set(opKey, opFunc);
            });
            return opMap;
        },
        renderTopicContentOthers: function (props, next) {
            const { topicKey, model } = props;
            const attached_jupyter_notebooks = getAttachedJupyterNotebooks({ model });
            const res = next();
            return <>
                {res}
                {attached_jupyter_notebooks.get(topicKey) && <div onClick={() => openJupyterNotebookFromTopic(props)} > <JupyterIcon /></div>}
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
                const associateJupyterNote = (item, e) => {
                    const jupyter_notebook_path = item.path;
                    controller.run("operation", {
                        ...props,
                        topicKey: model.topicKey,
                        jupyter_notebook_path,
                        model: controller.currentModel,
                        opType: OpType.ASSOCIATE_JUPYTER_NOTE
                    })
                }

                const searchPanelProps = {
                    key: 'jupyter-search-panel',
                    ...props,
                    setSearchWorld,
                    getAllSections: (setItems) => setItems(getOrphanJupyterNotes({ model }).toJS()),
                    onItemSelect: associateJupyterNote,
                    matchKey: 'title'
                };
                res.push(<SearchPanel {...searchPanelProps} />);
            }
            return res;
        },

        renderLeftBottomCorner: (props, next) => {
            const { controller, model } = props;
            const res = retrieveResultFromNextNode(next);
            if (model && model?.extData?.has('jupyter')) {
                res.push(getPopOver(controller, model))
            }
            return res;
        },

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
            newExtData = newExtData.setIn(
                ['jupyter'],
                nonEmpty(jupyterData) ? fromJS(jupyterData) : ImmutableMap()
            );
            return newExtData;
        },

        startRegularJob: (props, next) => {
            const res = retrieveResultFromNextNode(next);
            const { controller, model } = props;
            const task = {
                funcName: "Sync JupyterNotebooks Regularly",
                func: () => {
                    const cb = async () => {
                        const allJupyterNotebooks = await getNotesWithCache();
                        console.log("get jupyter notebooks")
                        console.log({ allJupyterNotebooks })
                        const opType = OpType.SET_ALL_JUPYTER_NOTEBOOKS;
                        controller.run("operation", {
                            opType,
                            allJupyterNotebooks,
                            controller,
                            model: controller.currentModel ?? model
                        })
                    }
                    setInterval(cb, 60_000);
                }
            }
            return res.concat(task);
        }
    }
}