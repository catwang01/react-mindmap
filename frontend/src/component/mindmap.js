import React from "react";
import { Map as ImmutableMap } from "immutable";
import { Diagram, Icon } from "@blink-mind/renderer-react";
import { MenuItem } from "@blueprintjs/core";
import { OpType, getAllSubTopicKeys } from "@blink-mind/core";
import localforage from 'localforage';
import RichTextEditorPlugin from "@blink-mind/plugin-rich-text-editor";
import { JsonSerializerPlugin } from "@blink-mind/plugin-json-serializer";
import { ThemeSelectorPlugin } from "@blink-mind/plugin-theme-selector";
import TopologyDiagramPlugin from "@blink-mind/plugin-topology-diagram";
import { TopicReferencePlugin, SearchPlugin } from "@blink-mind/plugins";
import { Toolbar } from "./toolbar/toolbar";
import { generateSimpleModel, throttled } from "../utils";
import "@blink-mind/renderer-react/lib/main.css";
import debug from "debug";
import { KeyboardHotKeyWidget } from './keyboardHotKeyWidget'
import { mySearchPlugin } from "./search/search-plugin";
import { FOCUS_MODE_SEARCH_NOTE_TO_ATTACH, HOT_KEY_NAME_SEARCH } from './search/utils';
import { MyTopicWidget } from "./MyTopicWidget/index"

const log = debug("app");

const ViewModeMindMap = 'MindMap'

let HotKeyName = {
    ASSOCIATE_NOTE: 'ASSOCIATE_NOTE',
};

function op(opType, props) {
  const { topicKey, controller } = props;
  if (topicKey === undefined) {
    props = { ...props, topicKey: controller.model.focusKey };
  }
  controller.run('operation', { ...props, opType });
}


const newOptions = {
    ADD_NOTE_RELATION: (props) => {
        const { topicKey, note, model } = props;
        let newModel = model;
        if (!model.getIn(['extData', 'evernote'])) {
            newModel = model.setIn(['extData', 'evernote'], new ImmutableMap());
        }
        newModel = newModel.updateIn(['extData', 'evernote'], m => m.set(topicKey, note));
        return newModel;
    }, 
    DELETE_NOTE_RELATION: (props) => {
        const { topicKey, model } = props;
        let newModel = model;
        const allDeleteKeys = getAllSubTopicKeys(newModel, topicKey);
        for (let key of [...allDeleteKeys, topicKey]) {
            newModel = newModel.deleteIn(['extData', 'evernote', key]);
        }
        return newModel;
    },
    ASSOCIATE_A_NOTE: (props) => {
        let { model } = props;
        model = model.set('focusMode', FOCUS_MODE_SEARCH_NOTE_TO_ATTACH);
        return model;
    },
    OPEN_EVERNOTE_LINK: (props) => {
        const { topicKey, controller } = props;
        const note = controller.currentModel.getIn(["extData", "evernote", topicKey]);
        if (note !== undefined) {
            // const url = `https://app.yinxiang.com/shard/s54/nl/22483756/${note.guid}/`
            const url = `evernote:///view/22483756/s54/${note.guid}/${note.guid}/`
            window.open(url, '_blank').focus();
        } else {
            alert(`Topic doesn't have an associated note`);
        }
        return controller.currentModel;
    }
}

const items = [
  {
    icon: 'edit',
    label: 'Associate a note',
    shortcut: ['Space'],
    rootCanUse: false,
    opType: 'ASSOCIATE_A_NOTE',
    opOperation: newOptions.ASSOCIATE_A_NOTE
  },
  {
    icon: 'edit',
    label: 'Open evernote link',
    shortcut: ['Space'],
    rootCanUse: false,
    opType: 'OPEN_EVERNOTE_LINK',
    opOperation: newOptions.OPEN_EVERNOTE_LINK
  }
]

function HotKeyPlugin() {
    return {
        customizeHotKeys: function (ctx, next) {
            const { controller } = ctx;
            const handleHotKeyDown = (opType, opArg) => e => {
                  // log('HotKeyPlugin', opType);
                  op(opType, { ...ctx, ...opArg });
                  e.stopImmediatePropagation();
                  e.preventDefault();
            };
            const res = next();
            const {topicHotKeys, globalHotKeys}  = res;
            const newTopicHotKeys = new Map([
              [
                HotKeyName.ASSOCIATE_NOTE, 
                {
                    label: 'associate notes',
                    combo: 'mod + up',
                    allowInInput: true,
                    onKeyDown: () => { alert("haha")}
                }
              ]
            ])
            return {
                  topicHotKeys: new Map([...topicHotKeys, ...newTopicHotKeys]),
                  globalHotKeys,
                };
            // const {topicHotKeys, globalHotKeys, viewModeTopicHotKeys }  = res;
            // const newViewModeTopicHotKeys = new Map([
            //     HotKeyName.ASSOCIATE_NOTE, 
            //     {
            //         label: 'associate notes',
            //         combo: 'mod + up',
            //         allowInInput: true,
            //         preventDefault: true,
            //         stopPropagation: true,
            //     }
            // ])
            // viewModeTopicHotKeys.set(
            //     ViewModeMindMap,
            //     new Map([...viewModeTopicHotKeys[ViewModeMindMap], ...newViewModeTopicHotKeys])
            // )
            // return {
            //       topicHotKeys,
            //       globalHotKeys,
            //       viewModeTopicHotKeys
            //     };
        }, 
        customizeTopicContextMenu: function(ctx, next) {
            const { topicKey, model, controller, topic } = ctx;
            const viewMode = model.config.viewMode;
            const isRoot = topicKey === model.editorRootTopicKey;

            function onClickItem(item) {
              return function(e) {
                item.opType &&
                  controller.run('operation', {
                    ...ctx,
                    opType: item.opType,
                    ...item.opArg
                  });
              };
            } 
            const res = items.map(item => {
              if (item.enabledFunc && !item.enabledFunc({ topic, model }))
                return null;
              if (isRoot && !item.rootCanUse) return null;
              if (item.viewMode && !item.viewMode.includes(viewMode)) return null;
              return (
                <MenuItem
                  icon={Icon(item.icon)}
                  key={item.label}
                  text={item.label}
                  labelElement={<KeyboardHotKeyWidget hotkeys={item.shortcut} />}
                  onClick={onClickItem(item)}
                  // onClick={ click }
                />
              );
          })
          return <>
              { next() }
              { res }
          </>;
      },
      renderTopicWidget(props, next) {
          return <MyTopicWidget {...props} />
      },
      getAllowUndo: (props, next) => {
          const { model } = props;
          const res = next();
          console.log({allow: res && model.focusMode !== FOCUS_MODE_SEARCH_NOTE_TO_ATTACH, props})
          return res && model.focusMode !== FOCUS_MODE_SEARCH_NOTE_TO_ATTACH;
      },
      beforeOpFunction: (props) => {
          const { controller, opType, model, topicKey } = props;
          console.log({ opType, focusModel: model.focusMode, props})
          if (
            opType === OpType.DELETE_TOPIC &&
            topicKey !== model.editorRootTopicKey
          ) {
              controller.run(
                'operation',
                { ...props, 
                  opType: 'DELETE_NOTE_RELATION',
                });
              return controller.currentModel;
          } else {
              return model;
          }
      },
      getOpMap: function(ctx, next) {
          let opMap = next();
          return new Map([...opMap, ...Object.keys(newOptions).map(key => [key, newOptions[key]])]);
      },
      renderTopicContentOthers: function(ctx, next) {
          const { topicKey, model }  = ctx;
          const evernoteData = model.getIn(['extData', 'evernote'], new ImmutableMap());
          const res = next();
          return <>
              { res }
              { evernoteData.get(topicKey) && <img key="image1" 
                  src="data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2220px%22%20height%3D%2220px%22%20viewBox%3D%220%200%2020%2020%22%20version%3D%221.1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%3E%0A%20%20%20%20%3Cg%20id%3D%22Mac_Note_Normal_1%22%20stroke%3D%22none%22%20stroke-width%3D%221%22%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%0A%20%20%20%20%20%20%20%20%3Cg%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Cpolygon%20id%3D%22footprint%22%20fill-opacity%3D%220%22%20fill%3D%22%23FFCF57%22%20points%3D%220%200%2020%200%2020%2020%200%2020%22%3E%3C%2Fpolygon%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Cg%20id%3D%22Web_Note_16%22%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cpolygon%20id%3D%22footprint%22%20fill-opacity%3D%220%22%20fill%3D%22%23FFCF57%22%20points%3D%222%202%2018%202%2018%2018%202%2018%22%3E%3C%2Fpolygon%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cpath%20d%3D%22M12.7272727%2C17%20L6.18181818%2C17%20C4.97636364%2C17%204%2C16.105%204%2C15%20L4%2C5%20C4%2C3.895%204.97636364%2C3%206.18181818%2C3%20L13.8181818%2C3%20C15.0236364%2C3%2016%2C3.895%2016%2C5%20L16%2C14%20L12.7272727%2C17%20L12.7272727%2C17%20Z%20M13%2C15.543%20L14.543%2C14%20L13%2C14%20L13%2C15.543%20L13%2C15.543%20Z%20M6.11111111%2C4%20C5.49777778%2C4%205%2C4.448%205%2C5%20L5%2C15%20C5%2C15.552%205.49777778%2C16%206.11111111%2C16%20L11.9955114%2C16%20L11.9955114%2C13%20L15%2C13%20L15%2C5%20C15%2C4.448%2014.5022222%2C4%2013.8888889%2C4%20L6.11111111%2C4%20Z%20M7%2C9%20L13%2C9%20L13%2C10%20L7%2C10%20L7%2C9%20L7%2C9%20Z%20M7%2C6%20L13%2C6%20L13%2C7%20L7%2C7%20L7%2C6%20L7%2C6%20Z%20M10%2C13%20L7%2C13%20L7%2C12%20L10%2C12%20L10%2C13%20L10%2C13%20Z%22%20id%3D%22icon%22%20fill%3D%22%23424242%22%3E%3C%2Fpath%3E%0A%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fg%3E%0A%20%20%20%20%20%20%20%20%3C%2Fg%3E%0A%20%20%20%20%3C%2Fg%3E%0A%3C%2Fsvg%3E" 
                  alt="" 
                  width="20" 
                  height="20" 
                  /> 
                  }
            </>
      }
  }
}


const plugins = [
  // RichTextEditorPlugin(),
  HotKeyPlugin(),
  ThemeSelectorPlugin(),
  TopicReferencePlugin(),
  SearchPlugin(),
  mySearchPlugin(),
  TopologyDiagramPlugin(),
  JsonSerializerPlugin()
];

export class Mindmap extends React.Component {
  constructor(props) {
    super(props);
    this.initModel();
  }

  diagram;
  diagramRef = ref => {
    this.diagram = ref;
    this.setState({});
  };

  initModel() {
    const model = generateSimpleModel();
    this.state = { model };
  }

  onClickUndo = e => {
    const props = this.diagram.getDiagramProps();
    const { controller } = props;
    controller.run("undo", props);
  };

  onClickRedo = e => {
    const props = this.diagram.getDiagramProps();
    const { controller } = props;
    controller.run("redo", props);
  };

  renderDiagram() {
    return (
      <Diagram
        ref={this.diagramRef}
        model={this.state.model}
        onChange={this.onChange}
        plugins={plugins}
      />
    );
  }

  renderToolbar() {
    const props = this.diagram.getDiagramProps();
    const { controller } = props;
    const canUndo = controller.run("canUndo", props);
    const canRedo = controller.run("canRedo", props);
    const toolbarProps = {
      diagram: this.diagram,
      onClickUndo: this.onClickUndo,
      onClickRedo: this.onClickRedo,
      canUndo,
      canRedo
    };
    return <Toolbar {...toolbarProps} />;
  }

  // autoSave per 60s
  autoSaveModel = () => setInterval(() => {
      if (this.state && this.state.model) {
          const props = this.diagram.getDiagramProps();
          const { controller } = props;
          const serializedModel = controller.run('serializeModel', { controller, model: this.state.model });
          localforage.setItem('react-mindmap-evernote-mind', JSON.stringify(serializedModel));
          console.log(`Auto-Save at ${new Date()}`)
      }
    }, 60000)

  componentDidMount() {
      console.log('componentDidMount')
      let model = null;
      localforage.getItem('react-mindmap-evernote-mind', (err, value) => {
        if (err == null && value) {
            const props = this.diagram.getDiagramProps();
            const { controller } = props;
            let obj = JSON.parse(value);
            if (obj && obj.extData && obj.extData.hasOwnProperty('evernote')) {
                obj.extData.evernote = new ImmutableMap(obj.extData.evernote);
            }
            model = controller.run("deserializeModel", { controller, obj });
        }
        if (model) { 
            this.setState({ model }) 
        };
      })
      this.autoSaveModel()
  }

  // debug
  componentDidUpdate() {
      console.log('componentDidUpdate')
      const props = this.diagram.getDiagramProps();
      const { controller } = props;
      if (controller) {
          // console.log((controller.run('getUndoRedoStack')))
          console.log({ 
              redo: (controller.run('getUndoRedoStack')).redoStack.size, 
              undo: (controller.run('getUndoRedoStack')).undoStack.size
        })
      }
  }

  onChange = (model, callback) => {
    this.setState(
      {
        model
      },
      callback
    );
  };

  render() {
    return (
      <div className="mindmap">
        {this.diagram && this.renderToolbar()}
        {this.renderDiagram()}
      </div>
    );
  }
}

Mindmap.whyDidYouRender = true;
export default Mindmap;