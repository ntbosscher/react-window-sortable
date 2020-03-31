import { default as React, useContext } from "react";
import { InnerElementContext } from "./index";
import { DraggingElement } from "./DraggingElement";
import { DropZoneElement } from "./DropZoneElement";

export function InnerElementType(props: { children: any }) {
  const { children, ...rest } = props;
  const InnerElement = useContext(InnerElementContext);

  const inner = (
    <React.Fragment>
      {children}
      <DraggingElement />
      <DropZoneElement />
    </React.Fragment>
  );

  if (InnerElement) {
    return <InnerElement {...rest}>{inner}</InnerElement>;
  }

  return <div {...rest}>{inner}</div>;
}
