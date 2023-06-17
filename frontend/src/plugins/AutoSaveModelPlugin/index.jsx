import { Button } from "@blueprintjs/core";
import debug from "debug";
import localforage from "localforage";
import React from "react";

const log = debug("plugin:AutoSaveModelPlugin");

function saveCache(props, callback = () => { }) {
    const { controller, model } = props;
    log(`Auto-Save at ${new Date()}`, { controller, model });
    if (model) {
        const serializedModel = controller.run('serializeModel', { controller, model });
        localforage.setItem('react-mindmap-evernote-mind', JSON.stringify(serializedModel));
        callback();
    }
}

const CacheButton = () => {
    const buttonProps = {
        style: { height: "40px" },
        onClick: () => saveCache(() => { alert(`Auto-Save at ${new Date()}`) })
    }
    return <div>
        <Button {...buttonProps}> Save Cache </Button>
    </div>;
}

export function AutoSaveModelPlugin() {
    return {
        startRegularJob(props, next) {
            const res = next ? next() ?? [] : []
            // autoSave per 60s
            const autoSaveModel = () => setInterval(() => saveCache(props), 60000);
            res.push({
                funcName: "autoSaveModel",
                func: autoSaveModel
            });
            return res;
        },
        renderLeftBottomCorner(props, next) {
            const res = next ? next() ?? [] : []
            res.push(<CacheButton {...props} />)
            return res;
        }
    }
}
