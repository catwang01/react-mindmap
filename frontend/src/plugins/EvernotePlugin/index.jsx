import { OpType as StandardOpType } from "@blink-mind/core";
import { MenuItem } from "@blueprintjs/core";
import React from "react";
import { MyTopicWidget } from "../../component/MyTopicWidget";
import { KeyboardHotKeyWidget } from '../../component/keyboardHotKeyWidget';
import { Icon } from "../../icon";
import '../../icon/index.css';
import { FOCUS_MODE_SEARCH_NOTE_TO_ATTACH } from "../EvernoteSearchPlugin";
import { EvernoteIcon, hasEvernoteAttached } from "./utils";
import { OpType } from "./constants";
import { OperationMap } from "./operationMap";

const items = [
  {
    icon: 'edit',
    label: 'Associate a note',
    // shortcut: ['Space'],
    rootCanUse: false,
    opType: OpType.ASSOCIATE_A_NOTE,
    opOperation: OperationMap.ASSOCIATE_A_NOTE
  },
  {
    icon: 'edit',
    label: 'Open evernote link',
    // shortcut: ['Space'],
    rootCanUse: false,
    opType: OpType.OPEN_EVERNOTE_LINK,
    opOperation: OperationMap.OPEN_EVERNOTE_LINK
  }
]

export function EvernotePlugin() {
  return {
    beforeOpFunction: (props) => {
      const { opType, topicKey, model, controller } = props;
      if (
        opType === StandardOpType.DELETE_TOPIC &&
        topicKey !== model.editorRootTopicKey
      ) {
        controller.run(
          'operation',
          {
            ...props,
            opType: OpType.DELETE_NOTE_RELATION,
          });
        return controller.currentModel;
      } else {
        return model;
      }
    },
    getOpMap: function (props, next) {
      let opMap = next();
      return new Map([...opMap, ...Object.entries(OperationMap)]);
    },
    customizeTopicContextMenu: function (ctx, next) {
      const { topicKey, model, controller, topic } = ctx;
      const viewMode = model.config.viewMode;
      const isRoot = topicKey === model.editorRootTopicKey;

      function onClickItem(item) {
        return function (e) {
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
            icon={Icon("evernote")}
            key={item.label}
            text={item.label}
            labelElement={<KeyboardHotKeyWidget hotkeys={item.shortcut} />}
            onClick={onClickItem(item)}
          // onClick={ click }
          />
        );
      })
      return <>
        {next()}
        {res}
      </>;
    },
    renderTopicWidget(props, next) {
      return <MyTopicWidget {...props} />
    },
    getAllowUndo: (props, next) => {
      const { model } = props;
      const res = next();
      log({ allow: res && model.focusMode !== FOCUS_MODE_SEARCH_NOTE_TO_ATTACH, props })
      return res && model.focusMode !== FOCUS_MODE_SEARCH_NOTE_TO_ATTACH;
    },
    renderTopicContentOthers: (props, next) => {
      const res = next();
      const { controller, topicKey } = props;
      return <>
        {res}
        {hasEvernoteAttached(props) && <EvernoteIcon {...{ controller, topicKey }} />}
      </>
    }
  }
}