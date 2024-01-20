import * as React from "react";
import { Button } from "@blueprintjs/core";
import { DEFAULT_INTERVAL_5m, DEFAULT_INTERVAL_60S } from "../../constants";
import { md5 } from "../../utils/md5";
import { retrieveResultFromNextNode } from "../../utils/retrieveResultFromNextNode";
import { saveCache } from ".";
import { Controller } from '@blink-mind/core'

export interface SyncComponentArgs {
    lastSyncTime: Date | null;
}

export const SyncComponent = (props: SyncComponentArgs) => {
    const { lastSyncTime } = props;
    const text = lastSyncTime ? `last sync at: ${lastSyncTime}` : "not synced yet";
    return <div>
        <Button>
            {text}
        </Button>
    </div>
}

export type SyncStatus = "conflicted" | "synced" | "not synced";

export interface UpdateSyncStatusProps
{
    syncTime: Date;
    status: SyncStatus;
    controller: Controller;
}

export function AutoSyncPlugin() {
    let lastSyncTime: Date | null = null;
    return {
        getSyncStatus(props)
        {
            return { lastSyncTime };
        },

        updateSyncStatus(props: UpdateSyncStatusProps) {
            const { syncTime, status } = props;
            if (status !== "conflicted")
            {
                lastSyncTime = syncTime;
            }
        },

        renderLeftBottomCorner(props, next) {
            const res = retrieveResultFromNextNode(next);
            res.push(<SyncComponent lastSyncTime={lastSyncTime} />)
            return res;
        },

        getOpMap(props, next) {
            const opMap = next();
            opMap.set("moveVersionForward", ({ controller, model }) => {
                const version = controller.run('getVersion', { controller, model });
                const workingTreeVersion = controller.run('getWorkingTreeVersion', { controller, model });
                const newModel = model.setIn(["extData", "versionInfo", 'parentVersion'], version)
                    .setIn(["extData", "versionInfo", 'version'], workingTreeVersion);
                return newModel;
            });
            return opMap;
        },

        getParentVersion({ controller, model }) {
            const parentVersion = model.getIn(['extData', 'versionInfo', 'parentVersion'], null);
            return parentVersion;
        },

        getWorkingTreeVersion({ controller, model }) {
            const serializedModel = controller.run("serializeModel", { controller, model });
            delete serializedModel.extData.versionInfo;
            const jsonStr = JSON.stringify(serializedModel);
            const version = md5(jsonStr);
            return version;
        },

        getVersion({ controller, model }) {
            return model.getIn(['extData', 'versionInfo', 'version'], null)
                ?? controller.run('getWorkingTreeVersion', { controller, model });
        },

        startRegularJob(props, next) {
            const res = retrieveResultFromNextNode(next);

            // autoSave per 60s
            const autoSyncModel = () => setInterval(
                () => saveCache(props)
                    .then(res => {
                        lastSyncTime = new Date();
                    }), DEFAULT_INTERVAL_60S);
            res.push({
                funcName: autoSyncModel.name,
                func: autoSyncModel
            });
            return res;
        },

        deserializeExtData: (props, next) => {
            next();
            const { extData } = props;
            if (!extData?.versionInfo) {
                extData.versionInfo = {
                    version: '000000000',
                    parentVersion: '000000000',
                };
            }
            return null;
        }
    };
}