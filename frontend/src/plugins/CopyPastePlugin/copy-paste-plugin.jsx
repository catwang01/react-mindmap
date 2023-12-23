import { OpType as StandardOpType } from "@blink-mind/core";
import { MenuItem } from "@blueprintjs/core";
import { Icon } from "../../icon";
import { handleHotKeyDown } from "../../utils/keybinding";
import { log } from "./log";
import { OpType as CopyPasteOpType, OpTypeMapping } from "./opType";

export function CopyPastePlugin() {
    return {
        getOpMap(props, next) {
            const opMap = next();
            var newOperationLists = Object.keys(OpTypeMapping).map(k => [k, OpTypeMapping[k]]);
            const newMap = new Map([...opMap, ...newOperationLists]);
            return newMap;
        },
        customizeHotKeys: function (props, next) {
            const res = next();
            const { topicHotKeys, globalHotKeys } = res;
            const newTopicHotKeys = new Map([
                [
                    CopyPasteOpType.SET_COPIED_ROOT,
                    {
                        label: 'cut notes',
                        combo: 'mod + x',
                        allowInInput: true,
                        onKeyDown: handleHotKeyDown(CopyPasteOpType.SET_COPIED_ROOT, props)
                    }
                ],
                [
                    CopyPasteOpType.PASTE_NOTE,
                    {
                        label: 'paste notes',
                        combo: 'mod + v',
                        allowInInput: true,
                        onKeyDown: handleHotKeyDown([CopyPasteOpType.PASTE_NOTE, StandardOpType.TOGGLE_COLLAPSE], { ...props, allowUndo: false })
                    }
                ]
            ]);
            return {
                topicHotKeys: new Map([...topicHotKeys, ...newTopicHotKeys]),
                globalHotKeys,
            };
        },
        customizeTopicContextMenu: function (props, next) {
            log("customizeTopicContextMenu");
            log("parameters: ");
            log({ props });

            const { topicKey, model, controller } = props;
            const isRoot = topicKey === model.rootTopicKey;
            const onClickCutItem = () => {
                log("Cut is invoked");
                controller.run("operation", {
                    ...props,
                    model: controller.currentModel,
                    opType: CopyPasteOpType.SET_COPIED_ROOT
                });
            };
            const onClickPasteItem = () => {
                log("Paste is invoked");
                controller.run("operation", {
                    ...props,
                    model: controller.currentModel,
                    opType: CopyPasteOpType.PASTE_NOTE
                });
            };
            const copyNodeItem = <MenuItem
                icon={Icon("edit-cut")}
                key={"cut nodes"}
                text={"cut notes"}
                labelElement={<kbd>{"Ctrl + x"}</kbd>}
                onClick={onClickCutItem} />;
            const pasteNodeItem = <MenuItem
                icon={Icon("paste")}
                key={"paste nodes"}
                text={"paste notes"}
                labelElement={<kbd>{"Ctrl + v"}</kbd>}
                onClick={onClickPasteItem} />;

            return <>
                {next()}
                {isRoot || copyNodeItem}
                {pasteNodeItem}
            </>;
        }
    };
}
