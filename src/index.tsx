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
  className?: string;
};

type Props = {
  children: React.ComponentType<ChildrenProps>;
  autoScrollWhenDistanceLessThan?: number;
  autoScrollSpeed?: number;
  draggingElementClassName?: string;
  draggingElementStyle?: CSSProperties;
  dropElement?: any;
  onSortOrderChanged(params: { originalIndex: number; newIndex: number }): void;
} & Omit<FixedSizeListProps, "children">;

interface State {
  dragging: null | ListChildComponentProps;
}

type AutoScrollKeyword = "up" | "down" | "none";

export class SortableList extends React.Component<Props, State> {
  dragRef: RefObject<HTMLElement> = createRef();
  dropZoneRef: RefObject<HTMLDivElement> = createRef();
  listRef: RefObject<FixedSizeList> = createRef();

  startClientY: number = 0;
  startDragObjOffsetY: number = 0;
  hoverIndex: number | null = null;

  autoScroll: AutoScrollKeyword = "none";
  autoScrollTimer: NodeJS.Timeout | null = null;

  constructor(props: any) {
    super(props);

    this.state = {
      dragging: null
    };

    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
  }

  getAutoScrollWhenDistanceLessThan() {
    return this.props.autoScrollWhenDistanceLessThan || 50;
  }

  getAutoScrollSpeed() {
    return this.props.autoScrollSpeed || 50;
  }

  componentWillUnmount(): void {
    document.body.removeEventListener("mouseup", this.onMouseUp);
    document.body.removeEventListener("mousemove", this.onMouseMove);
    this.setAutoScroll("none", 0);
  }

  mouseDown(e: MouseEvent, params: ListChildComponentProps) {
    console.log("mouse down", params.index);

    const list = this.listRef.current;
    if (list === null) return;

    this.startClientY = e.clientY;

    const top = parseInt((params.style.top || "0").toString(), 10);

    this.startDragObjOffsetY = top - this.getScrollOffsetTop(list);

    document.body.addEventListener("mouseup", this.onMouseUp);
    document.body.addEventListener("mousemove", this.onMouseMove);

    this.setState({
      dragging: params
    });
  }

  onMouseMove(event: MouseEvent) {
    this.updateDragElementPositioning(event.clientY);
    this.checkAutoScroll(event.clientY);
  }

  updateDragElementPositioning(mouseY: number) {
    const dragRef = this.dragRef.current;
    if (dragRef === null) return;
    if (this.listRef.current === null) return;

    const scrollOffsetTop = this.getScrollOffsetTop(this.listRef.current);

    const dY = mouseY - this.startClientY;
    const newY = this.startDragObjOffsetY + dY + scrollOffsetTop;
    dragRef.style.top = newY + "px";

    const dropRef = this.dropZoneRef.current;
    if (dropRef === null) return;

    this.hoverIndex = Math.floor(newY / this.props.itemSize);
    dropRef.style.top = this.hoverIndex * this.props.itemSize + "px";
  }

  getScrollOffsetTop(list: FixedSizeList): number {
    return this.getScrollRef(list).scrollTop;
  }

  getScrollRef(list: FixedSizeList) {
    // @ts-ignore dangerously reach into list internals, so we can get a ref on the scroll element
    return list._outerRef as HTMLDivElement;
  }

  checkAutoScroll(mouseY: number) {
    if (this.listRef.current === null) return;

    const list = this.listRef.current as FixedSizeList;
    const scrollRef = this.getScrollRef(list);

    const rect = scrollRef.getBoundingClientRect();
    const listTop = rect.y;
    const listBottom = rect.y + rect.height;

    const buffer = this.getAutoScrollWhenDistanceLessThan();

    if (mouseY - listTop < buffer) {
      this.setAutoScroll("up", mouseY);
    } else if (listBottom - mouseY < this.getAutoScrollWhenDistanceLessThan()) {
      this.setAutoScroll("down", mouseY);
    } else {
      this.setAutoScroll("none", mouseY);
    }
  }

  setAutoScroll(scroll: AutoScrollKeyword, mouseY: number) {
    if (this.autoScrollTimer !== null) {
      clearInterval(this.autoScrollTimer);
      this.autoScrollTimer = null;
    }

    this.autoScroll = scroll;

    if (scroll === "none") return;

    if (this.dragRef.current === null) return;
    if (this.listRef.current === null) return;

    let delta = this.getAutoScrollSpeed();
    if (scroll === "up") {
      delta = delta * -1;
    }

    this.autoScrollTimer = setInterval((e: any) => {
      if (this.listRef.current === null) return;

      const offsetTop = this.getScrollOffsetTop(this.listRef.current);
      const newOffsetTop = offsetTop + delta;
      this.listRef.current.scrollTo(newOffsetTop);

      this.updateDragElementPositioning(mouseY);
    }, 100);
  }

  onMouseUp() {
    document.body.removeEventListener("mouseup", this.onMouseUp);
    document.body.removeEventListener("mousemove", this.onMouseMove);

    this.setAutoScroll("none", 0);

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

    const dropElement = this.props.dropElement || (
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
      <div ref={this.dropZoneRef} style={style}>
        {dropElement}
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

    style = Object.assign(
      {},
      style,
      {
        boxShadow: "1px 1px 5px 0px hsla(0, 0%, 0%, 0.31)",
        zIndex: 3
      },
      this.props.draggingElementStyle || {}
    );

    if (!style.backgroundColor) style.backgroundColor = "white";

    return (
      <Child
        ref={this.dragRef}
        {...rest}
        className={this.props.draggingElementClassName}
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
      <FixedSizeList
        ref={this.listRef}
        innerElementType={this.renderInnerElement()}
        {...props}
      >
        {params => this.renderChild(children, params)}
      </FixedSizeList>
    );
  }
}
