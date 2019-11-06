import * as React from "react";
import {
  FixedSizeList,
  FixedSizeListProps,
  ListChildComponentProps
} from "react-window";
import { createRef, CSSProperties, Ref, RefObject } from "react";

interface MouseEvent {
  clientY: number;
}

export type ChildrenProps = ListChildComponentProps & {
  onSortMouseDown(e: MouseEvent): void;
  ref?: Ref<any>;
};

type Props = {
  children: React.ComponentType<ChildrenProps>;
  onSortOrderChanged(params: { originalIndex: number; newIndex: number }): void;
} & Omit<FixedSizeListProps, "children">;

interface State {
  dragging: null | ListChildComponentProps;
}

export class SortableList extends React.Component<Props, State> {
  dragRef: RefObject<HTMLElement> = createRef();
  dropZoneRef: RefObject<HTMLDivElement> = createRef();
  startClientY: number = 0;
  startDragObjOffsetY: number = 0;
  hoverIndex: number | null = null;

  constructor(props: any) {
    super(props);

    this.state = {
      dragging: null
    };

    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
  }

  componentWillUnmount(): void {
    document.body.removeEventListener("mouseup", this.onMouseUp);
    document.body.removeEventListener("mousemove", this.onMouseMove);
  }

  mouseDown(e: MouseEvent, params: ListChildComponentProps) {
    console.log("mouse down", params.index);

    this.startClientY = e.clientY;

    if (params.style.top) {
      this.startDragObjOffsetY = parseInt(
        params.style.top.toString() || "0",
        10
      );
    }

    document.body.addEventListener("mouseup", this.onMouseUp);
    document.body.addEventListener("mousemove", this.onMouseMove);

    this.setState({
      dragging: params
    });
  }

  onMouseMove(event: MouseEvent) {
    const dragRef = this.dragRef.current;
    if (dragRef === null) return;

    const dY = event.clientY - this.startClientY;
    const newY = this.startDragObjOffsetY + dY;
    dragRef.style.top = newY + "px";

    const dropRef = this.dropZoneRef.current;
    if (dropRef === null) return;

    this.hoverIndex = Math.floor(newY / this.props.itemSize);
    dropRef.style.top = this.hoverIndex * this.props.itemSize + "px";
  }

  onMouseUp() {
    document.body.removeEventListener("mouseup", this.onMouseUp);
    document.body.removeEventListener("mousemove", this.onMouseMove);

    if (this.state.dragging === null) return;

    const startIndex = this.state.dragging.index;

    this.setState({
      dragging: null
    });

    if (this.hoverIndex !== null) {
      this.props.onSortOrderChanged({
        originalIndex: startIndex,
        newIndex: this.hoverIndex
      });
    }

    this.hoverIndex = null;
  }

  renderDropZoneElement() {
    if (this.state.dragging === null) return;

    const style = Object.assign({}, this.state.dragging.style, {
      display: "flex",
      flexDirection: "row",
      alignItems: "stretch",
      zIndex: 2,
      background: "white"
    });

    return (
      <div ref={this.dropZoneRef} style={style}>
        <div
          style={{
            border: "2px dashed #0087F7",
            borderRadius: "3px",
            margin: "2px",
            flex: 1,
            boxSizing: "border-box"
          }}
        />
      </div>
    );
  }

  renderChild(
    Child: React.ComponentType<ChildrenProps>,
    params: ListChildComponentProps
  ) {
    let { style, index, ...rest } = params;

    if (this.state.dragging !== null && index === this.state.dragging.index) {
      return null;
    }

    return (
      <Child
        {...rest}
        style={style}
        index={index}
        onSortMouseDown={(e: MouseEvent) => this.mouseDown(e, params)}
      />
    );
  }

  renderDraggingElement() {
    if (this.state.dragging === null) return null;

    let { style, ...rest } = this.state.dragging;
    const Child = this.props.children;

    style = Object.assign({}, style, {
      boxShadow: "1px 1px 5px 0px hsla(0, 0%, 0%, 0.31)",
      zIndex: 3
    });

    if (!style.backgroundColor) style.backgroundColor = "white";

    return (
      <Child
        ref={this.dragRef}
        {...rest}
        style={style}
        onSortMouseDown={(e: MouseEvent) => {}}
      />
    );
  }

  renderInnerElement() {
    return React.forwardRef(({ children, ...rest }, ref: Ref<any>) => {
      return (
        <div {...rest} ref={ref}>
          {children}
          {this.renderDraggingElement()}
          {this.renderDropZoneElement()}
        </div>
      );
    });
  }

  render() {
    const { children, innerElementType, ...props } = this.props;

    return (
      <FixedSizeList innerElementType={this.renderInnerElement()} {...props}>
        {params => this.renderChild(children, params)}
      </FixedSizeList>
    );
  }
}
