import { default as React, useContext } from "react";
import { DragContext } from "./index";

export function DropZoneElement() {
  const drag = useContext(DragContext);
  if (drag === null) return null;

  const style = Object.assign({}, drag.dragging.style, {
    display: "flex",
    flexDirection: "row",
    alignItems: "stretch",
    zIndex: 2,
    background: "white"
  });

  const dropElement = drag.dropElement || (
    <div
      style={{
        border: "2px dashed #0087F7",
        borderRadius: "3px",
        margin: "2px",
        flex: 1,
        boxSizing: "border-box"
      }}
    />
  );

  return (
    <div ref={drag.dropZoneRef} style={style}>
      {dropElement}
    </div>
  );
}
