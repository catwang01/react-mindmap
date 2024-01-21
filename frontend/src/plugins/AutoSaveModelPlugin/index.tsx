// @ts-check
import { Controller } from '@blink-mind/core';
import { Button } from "@blueprintjs/core";
import debug from "debug";
import localforage from "localforage";
import { memo } from "react";
import { DEFAULT_INTERVAL_60S } from "../../constants";
import { retrieveResultFromNextNode } from "../../utils/retrieveResultFromNextNode";

const log = debug("plugin:AutoSaveModelPlugin");

interface SaveCacheArgs {
    controller: Controller;
    callback?: () => void;
}

function saveCache({ controller, callback }: SaveCacheArgs) {
    const model = controller.currentModel;
    log(`Auto-Saved at ${new Date()}`, { controller, model });
    if (model) {
        const serializedModel = controller.run('serializeModel', {
            controller,
            model
        });
        const modelStr: string = JSON.stringify(serializedModel);
        localforage.setItem('react-mindmap-evernote-mind', modelStr);
        callback && callback();
    }
}

interface CacheButtonProps
{
    controller: Controller;
}

export const CacheButton = memo((props: CacheButtonProps) => {
    const { controller } = props;
    const buttonProps = {
        style: { height: "40px" },
        onClick: () => saveCache({
            controller,
            callback: () => alert(`Saved at ${new Date()}`)
        })
    }
    return <div>
        <Button {...buttonProps}> Save Cache </Button>
    </div>;
})

export function AutoSaveModelPlugin() {
    return {
        startRegularJob(props, next) {
            const res = retrieveResultFromNextNode(next)
            // autoSave per 60s
            const autoSaveModel = () => setInterval(
                () => saveCache(props), 
                DEFAULT_INTERVAL_60S
            );
            res.push({
                funcName: "autoSaveModel",
                func: autoSaveModel
            });
            return res;
        },
        renderLeftBottomCorner(props, next) {
            const res = retrieveResultFromNextNode(next);
            res.push(<CacheButton {...props} />);
            return res;
        }
    }
}
