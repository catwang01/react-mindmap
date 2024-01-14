import classNames from "classnames";
import * as React from "react";

import { DISPLAYNAME_PREFIX, InputGroup, Overlay } from "@blueprintjs/core";
// import { Search } from "@blueprintjs/icons";
import { OmnibarProps, QueryList } from "@blueprintjs/select";
import * as Classes from "./Classes";

/**
 * Omnibar component.
 *
 * @see https://blueprintjs.com/docs/#select/omnibar
 */
export class EnhancedOmniBar<T> extends React.PureComponent<OmnibarProps<T>> {

    queryListRef: React.RefObject<QueryList<T>>;

    constructor(props: OmnibarProps<T>) {
        super(props);
        // @ts-ignore
        this.queryListRef = React.createRef();
    }

    render() {
        // omit props specific to this component, spread the rest.
        const { isOpen, inputProps, overlayProps, ...restProps } = this.props;
        const initialContent = "initialContent" in this.props ? this.props.initialContent : null;

        return (
            <QueryList<T>
                {...restProps}
                // Omnibar typically does not keep track of and/or show its selection state like other
                // select components, so it's more of a menu than a listbox. This means that users should return
                // MenuItems with roleStructure="menuitem" (the default value) in `props.itemRenderer`.
                ref={this.queryListRef}
                // @ts-ignore
                menuProps={{ role: "menu" }}
                initialContent={initialContent}
                renderer={this.renderQueryList}
            />
        );
    }

    private renderQueryList = (listProps) => {
        const { inputProps = {}, isOpen, overlayProps = {} } = this.props;
        const { handleKeyDown, handleKeyUp } = listProps;
        const handlers = isOpen ? { onKeyDown: handleKeyDown, onKeyUp: handleKeyUp } : {};

        return (
            <Overlay
                hasBackdrop={true}
                {...overlayProps}
                isOpen={isOpen}
                className={classNames(Classes.OMNIBAR_OVERLAY, overlayProps.className)}
                onClose={this.handleOverlayClose}
            >
                <div className={classNames(Classes.OMNIBAR, listProps.className)} {...handlers}>
                    <InputGroup
                        autoFocus={true}
                        large={true}
                        // leftIcon={<Search />}
                        placeholder="Search..."
                        {...inputProps}
                        onChange={listProps.handleQueryChange}
                        value={listProps.query}
                    />
                    {listProps.itemList}
                </div>
            </Overlay>
        );
    };

    private handleOverlayClose = (event: React.SyntheticEvent<HTMLElement>) => {
        this.props.overlayProps?.onClose?.(event);
        this.props.onClose?.(event);
    };
}