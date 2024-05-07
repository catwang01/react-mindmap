import { Controller, Model, OpType } from "@blink-mind/core";
import { Button, Classes, Dialog } from "@blueprintjs/core";
import localforage from 'localforage';
import React from "react";
// import RichTextEditorPlugin from "@blink-mind/plugin-rich-text-editor";
import { JsonSerializerPlugin } from "@blink-mind/plugin-json-serializer";
import { ThemeSelectorPlugin } from "@blink-mind/plugin-theme-selector";
import TopologyDiagramPlugin from "@blink-mind/plugin-topology-diagram";
import { TopicReferencePlugin } from "@blink-mind/plugins";
import { DefaultPlugin } from '@blink-mind/renderer-react';
import "@blink-mind/renderer-react/lib/main.css";
import debug from "debug";
import memoizeOne from 'memoize-one';
import {
  AutoSaveModelPlugin,
  AutoSyncPlugin,
  CopyPastePlugin,
  CounterPlugin,
  CreateJupyterNotebookPlugin,
  CustomizeJsonSerializerPlugin,
  DebugPlugin,
  EnhancedOperationPlugin,
  EvernotePlugin,
  EvernoteSearchPlugin,
  FixCollapseAllPlugin,
  FixGetTopicTitlePlugin,
  FixHotKeyPlugin,
  NewSearchPlugin,
  StandardDebugPlugin,
  TopicHistoryPlugin,
  VimHotKeyPlugin
} from '../plugins';
import { getJupyterData } from "../plugins/CreateJupyterNotebookPlugin/utils";
import { generateSimpleModel, getNotesFromModel } from "../utils";
import { Toolbar } from "./toolbar/toolbar";
import { MyController } from "./MyController";

const log = debug("app");

import * as _ from "@react-mindmap/plugin-simple-text-editor";
const x = _.SimpleTextEditorPlugin();

const plugins = [
  // RichTextEditorPlugin(),
  // SimpleTextEditorPlugin(),
  x,
  FixCollapseAllPlugin(),
  FixHotKeyPlugin(),
  FixGetTopicTitlePlugin(),

  EnhancedOperationPlugin(),
  VimHotKeyPlugin(),
  DebugPlugin(),
  StandardDebugPlugin(),
  CustomizeJsonSerializerPlugin(),
  CounterPlugin(),
  CreateJupyterNotebookPlugin(),
  EvernotePlugin(),
  ThemeSelectorPlugin(),
  TopicReferencePlugin(),
  NewSearchPlugin(),
  EvernoteSearchPlugin(),
  TopologyDiagramPlugin(),
  JsonSerializerPlugin(),
  CopyPastePlugin(),
  AutoSyncPlugin(),
  AutoSaveModelPlugin(),
  TopicHistoryPlugin()
];

export interface DialogProps
{
    isOpen?: boolean,
    children?: any,
    intent?: string;
    minimal?: boolean;
}


export interface MindmapProps
{
}

export interface MindmapState
{
  model: Model;
  initialized: boolean;
  loadFromCached: boolean;
  dialog: DialogProps;
}

export interface DiagramProps
{
  model: Model;
  controller: Controller;
  getRef?: any;
}

export class Mindmap extends React.Component<MindmapProps, MindmapState> {
  controller: Controller;

  constructor(props: MindmapProps) {
    super(props);
    this.state = {
      model: generateSimpleModel(),
      initialized: false,
      loadFromCached: false,
      dialog: {
        isOpen: false,
        children: "",
        intent: "primary",
        minimal: true
      }
    }
    this.controller = this.resolveController(plugins, DefaultPlugin);
  }

  openNewModel = (newModel) => {
    const props = this.controller.run('getDiagramProps');
    const { model, getRef } = props;
    this.controller.run('deleteRefKey', {
      ...props,
      topicKey: model.rootTopicKey
    });
    this.controller.run('operation', {
      ...props,
      opType: OpType.EXPAND_TO,
      topicKey: newModel.focusKey,
      model: newModel,
      callback: () => {
        this.controller.run('moveTopicToCenter', {
          getRef,
          model: newModel,
          topicKey: newModel.focusKey
        });
      }
    });
  }

  openDialog = (dialog) => {
    this.setDialog(dialog)
  }

  closeDialog = () => {
    this.setDialog({ isOpen: false })
  }

  setDialog = (dialog) => {
    this.setState({ dialog })
  }

  resolveController = memoizeOne((plugins = [], TheDefaultPlugin) => {
    const defaultPlugin = TheDefaultPlugin();
    // @ts-ignore
    return new MyController({
      plugins: [plugins, defaultPlugin],
      construct: false,
      onChange: this.onChange
    });
    // this.controller.currentModel = this.state.model;
    // this.controller.run('onConstruct');
  });

  onClickUndo = e => {
    const props = this.controller.run('getDiagramProps');
    this.controller.run("undo", props);
  };

  onClickRedo = e => {
    const props = this.controller.run('getDiagramProps')
    this.controller.run("redo", props);
  };

  getDiagramProps(): DiagramProps {
    const diagramProps = this.controller.run("getDiagramProps");
    return { ...diagramProps, 
              controller: this.controller,
              model: this.state.model };
  }

  renderToolbar() {
    const { controller } = this;
    const diagramProps = this.getDiagramProps();
    const canUndo = controller.run("canUndo", diagramProps);
    const canRedo = controller.run("canRedo", diagramProps);
    const toolbarProps = {
      diagramProps,
      openNewModel: this.openNewModel,
      openDialog: this.openDialog,
      closeDialog: this.closeDialog,
      onClickUndo: this.onClickUndo,
      onClickRedo: this.onClickRedo,
      canUndo,
      canRedo
    };
    log('redo & undo', { diagramProps, canRedo, canUndo })
    return <Toolbar {...toolbarProps} />;
  }

  async componentDidMount() {
    log('componentDidMount')
    await localforage.getItem('react-mindmap-evernote-mind', (err, value: string) => {
      if (err === null && value) {
        const { controller } = this;
        const obj = JSON.parse(value);
        const model = controller.run("deserializeModel", { controller, obj });
        const nTopics = controller.run("getAllTopicCount", { model })
        if (model && nTopics) {
          this.openDialog({
            isOpen: true,
            children: <>
              {`Detect previously cached graph containing ${nTopics} topics. Do you want to load your cached graph?`}
              <Button onClick={() => {
                this.controller.change(model) // model should be updated by controller
                this.setState({ loadFromCached: true, initialized: true, dialog: { isOpen: false } }, () => this.startRegularJob())
              }}>Yes</Button>
              <Button onClick={() => this.setState({ initialized: true, dialog: { isOpen: false } }, () => this.startRegularJob())}>No</Button>
            </>
          })
          return;
        };
      } else {
        this.setState({ initialized: true }, () => this.startRegularJob());
      }
    })
  }

  startRegularJob() {
    const tasks = this.controller.run(
      'startRegularJob',
      {
        controller: this.controller,
        model: this.state.model
      }
    );
    tasks.forEach(task => {
      const { funcName, func } = task;
      console.log(`start regular job: ${funcName}`);
      func();
    })
  }

  // update notes regularly
  onLoadFromCached = () => {
    const nTopics = this.controller.run("getAllTopicCount", { model: this.state.model });
    this.openDialog({
      isOpen: true,
      children: <>
        <div className={Classes.DIALOG_BODY}>
          {`Load ${nTopics} topics from cache!`}
        </div>
        <Button onClick={() => this.setState({ loadFromCached: null, dialog: { isOpen: false } })}>OK</Button>
      </>
    })
  }

  // debug
  componentDidUpdate() {
    if (this.state.loadFromCached && !this.state.dialog.isOpen) {
      this.onLoadFromCached();
    }
    const { controller } = this;
    if (controller) {
      log("componentDidUpdate:", {
        state: this.state,
        allnotes: getNotesFromModel(this.state.model, []),
        current_allnotes: getNotesFromModel(this.controller.currentModel, []),
        jupyter: getJupyterData({model: this.state.model}).toJS(),
      })
      // log((controller.run('getUndoRedoStack')))
      log({
        redo: (controller.run('getUndoRedoStack')).redoStack.size,
        undo: (controller.run('getUndoRedoStack')).undoStack.size
      })
    }
  }

  onChange = (model, callback) => {
    this.setState({ model }, callback);
  };

  render() {
    return <div> {
      <div className="mindmap" style={{ visibility: this.state.initialized ? 'visible' : 'hidden' }}>
        <Dialog {...this.state.dialog}></Dialog>
        {this.getDiagramProps() && this.renderToolbar()}
        {this.controller.run('renderDiagram', { model: this.state.model, controller: this.controller })}
        <div className="bm-left-bottom-conner">
          {this.controller.run('renderLeftBottomCorner', { model: this.state.model, controller: this.controller })}
        </div>
      </div>
    }
    </div>;
  }
}

export default Mindmap;