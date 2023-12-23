import { empty } from "../../utils";

export const OpType = {
    SET_ALLOW_CROSS_LEVEL_SEARCH_MODE: "SET_ALLOW_CROSS_LEVEL_SEARCH_MODE"
}

export const OpTypeMapping = new Map([
    [
        OpType.SET_ALLOW_CROSS_LEVEL_SEARCH_MODE,
        (props) => {
            const { model, allowCrossLevelSearch, allowCrossLevelSearchUpdater } = props;
            let newModel;
            const hasValue = !empty(allowCrossLevelSearchUpdater);
            const hasFunc = !empty(allowCrossLevelSearch);
            if (hasValue == hasFunc) {
                console.error();
                newModel = model;
            }
            else if (hasValue) {
                newModel = model.updateIn(["extData", "allowCrossLevelSearch"], allowCrossLevelSearchUpdater);
            }
            else
            {
                newModel = model.setIn(["extData", "allowCrossLevelSearch"], allowCrossLevelSearch);
            }
            return newModel;
        }
    ]
])
