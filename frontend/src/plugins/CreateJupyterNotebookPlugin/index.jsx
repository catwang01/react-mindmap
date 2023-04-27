import React from 'react';
import { ensureSuffix } from './utils';
import { MenuItem } from '@blueprintjs/core';
import { JupyterClient } from './jupyter';
import { v4 as uuidv4 } from 'uuid';
import { Map as ImmutableMap } from 'immutable';
import '../../icon/index.css';
import { log } from './logger';
import { JUPYTER_BASE_URL, JUPYTER_CLIENT_ENDPOINT, JUPYTER_CLIENT_TYPE, JUPYTER_ROOT_FOLDER } from './constant';

export function CreateJupyterNotebookPlugin()
{
  let jupyterClient = new JupyterClient(JUPYTER_CLIENT_ENDPOINT, {
        jupyterBaseUrl: JUPYTER_BASE_URL,
        rootFolder: JUPYTER_ROOT_FOLDER,
        clientType: JUPYTER_CLIENT_TYPE
    });
  return {
    getOpMap: function(props, next) {
        const opMap = next();
        const { jupyter_notebook_path, topicKey } = props;
        opMap.set("CREATE_NOTE", ({ model }) => { 
            const newModel = model.setIn(["extData", "jupyter", topicKey, "path"], jupyter_notebook_path)
            return newModel; 
        });
        return opMap;
    },
    renderTopicContentOthers: function(props, next) {
        const { topicKey, model }  = props;
        const jupyterData = model.getIn(['extData', 'jupyter'], new ImmutableMap());
        const res = next();
        return <>
            { res }
            { jupyterData.get(topicKey) &&  <div className="icon-jupyter"></div> }
        </>
    },
    customizeTopicContextMenu: function(props, next) {
        log("customizeTopicContextMenu")
        log("parameters: ")
        log({ props })

        const { topicKey, model, controller } = props;

        const onClickCreateNoteItem = () => {
            log("create note is invoked")
            if (model.getIn(["extData", "jupyter", model.focusKey]))
            {
                alert("Can't associate jupyter note on a topic which already associates a jupyter note!")
                return 
            }
            const jupyter_notebook_path = ensureSuffix(uuidv4(), ".ipynb")
            jupyterClient.createNote(jupyter_notebook_path)
                .then(isSuccess => {
                    if (isSuccess)
                    {
                        controller.run("operation", {
                            ...props,
                            topicKey,
                            jupyter_notebook_path: jupyter_notebook_path,
                            model: controller.currentModel,
                            opType: 'CREATE_NOTE'
                        })
                    }
                });
        }

        const onClickJupyterNoteItem = () => {
            const { model } = props;
            const jupyter_notebook_path = model.getIn(['extData', 'jupyter', model.focusKey, "path"])
            if (jupyter_notebook_path)
            {
                const url = jupyterClient.getActualUrl(jupyter_notebook_path)
                log(`Opening ${url}`)
                window.open(url, '_blank').focus()
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
    },
    deserializeExtData: (props, next) => {
      const extData = next();
      let newExtData = extData;
      const jupyterData = extData.get('jupyter')
      if (jupyterData)
          newExtData = extData.set('jupyter', new ImmutableMap(jupyterData));
      return newExtData;
    }
  }
}