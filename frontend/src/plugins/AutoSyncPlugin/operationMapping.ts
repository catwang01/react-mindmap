import { Model, Controller } from '@blink-mind/core';
import { OpType } from './opType';

export type SyncStatusType = "conflicted" | "synced" | "not synced";

export interface UpdateSyncStatusProps {
    syncTime: Date;
    model: Model;
    controller: Controller;
    status: SyncStatusType;
}

export const OpTypeMapping = [
    [
        OpType.UPDATE_SYNC_STATUS, (props: UpdateSyncStatusProps) => {
            const { controller, syncTime, status } = props;
            if (status !== "conflicted") {
                return controller.currentModel.setIn(
                    ['extData', 'syncStatus'],
                    { lastSyncTime: syncTime, status }
                );
            }
            return controller.currentModel;
        }
    ],
    [
        OpType.MOVE_VERSION_FORWARD,
        ({ controller, model }) => {
            const version = controller.run('getVersion', { controller, model });
            const workingTreeVersion = controller.run('getWorkingTreeVersion', { controller, model });
            const newModel = model.setIn(["extData", "versionInfo", 'parentVersion'], version)
                .setIn(["extData", "versionInfo", 'version'], workingTreeVersion);
            return newModel;
        }
    ]
]