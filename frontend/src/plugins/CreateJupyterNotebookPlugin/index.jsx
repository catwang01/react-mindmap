import React from 'react';
import { MenuItem } from '@blueprintjs/core';
import debug from 'debug';
import { JupyterClient } from './jupyter';
import { v4 as uuidv4 } from 'uuid';

const log = debug("plugin:CreateJupyterNotebookPlugin")

export function CreateJupyterNotebookPlugin()
{
  let jupyterClient = new JupyterClient('http://catwang.top/jupyter');
  return {
    getOpMap(props, next) {
        const opMap = next();
        const { noteName, topicKey } = props;
        opMap.set("CREATE_NOTE", ({ model }) => { 
            model.getTopic(topicKey)
            model.setIn(["extData", "evernote", topicKey, "noteName"], noteName)
            return model; 
        });
        return opMap;
    },
    customizeTopicContextMenu: function(props, next) {
        log("customizeTopicContextMenu")
        log("parameters: ")
        log({ props })

        const { topicKey, controller } = props;

        const onClickCreateNoteItem = () => {
            log("create note is invoked")
            const noteName = uuidv4();
            jupyterClient
                .createNote(noteName)
                .then(isSuccess => {
                    if (isSuccess)
                    {
                        controller.run("operation", {
                            ...props,
                            topicKey,
                            noteName,
                            model: controller.currentModel,
                            opType: 'CREATE_NOTE'
                        })
                    }
                });
        }

        const onClickJupyterNoteItem = () => {
            const { model } = props;
            if (model.getTopic(model.focusKey).jupyterNoteName)
            {
                const url = model.getTopic(model.focusKey).jupyterNoteName
                window.open(url, '_blank').focus();
            }
            else 
            {
                alert("No jupyter notebook is attachd");
            }
        }
        const createNoteItem = <MenuItem
              // icon={ Icon("edit-cut") }
              key={"create note"}
              text={ "create jupyter note" }
              labelElement={<kbd>{ "Ctrl + a" }</kbd>}
              onClick={onClickCreateNoteItem}
            />

        const openJupyterNoteItem = <MenuItem
              // icon={ Icon("edit-cut") }
              key={"open jupyter note"}
              text={ "open jupyter note" }
              labelElement={<kbd>{ "Ctrl + a" }</kbd>}
              onClick={onClickJupyterNoteItem}
            />
    
      return <>
          { next() }
          { createNoteItem }
          { openJupyterNoteItem }
      </>;
    }
  }
}