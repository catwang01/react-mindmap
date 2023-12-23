import { empty } from "../../utils";

export function EnhancedOperationPlugin() {
    return {
        // enable adhoc allowUndo
        getAllowUndo(props, next) {
            const { allowUndo } = props;
            if (!empty(allowUndo)) {
                return allowUndo;
            }
            return next();
        },
    }
}