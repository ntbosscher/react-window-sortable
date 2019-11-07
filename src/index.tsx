import * as React from "react";
import {
  FixedSizeList,
  FixedSizeListProps,
  ListChildComponentProps,
  VariableSizeList,
  VariableSizeListProps
} from "react-window";
import { createRef, CSSProperties, Ref, RefObject } from "react";

export interface MouseEvent {
  clientY: number;
}

export type ChildrenProps = ListChildComponentProps & {
  onSortMouseDown(e: MouseEvent): void;
  ref?: Ref<any>;
  className?: string;
};

type Props<ListType> = {
  // a render function to render list items
  children: React.ComponentType<ChildrenProps>;

  // the distance from the top or bottom of the scroll
  // window where autoscroll should kick in
  autoScrollWhenDistanceLessThan?: number;

  // the speed at which the autoscroll should go
  autoScrollSpeed?: number;

  // set the class name for the element that is being
  // moved by the cursor
  draggingElementClassName?: string;

  // set override styles on the style prop for the element
  // being moved by the cursor
  draggingElementStyle?: CSSProperties;

  // a custom element to render as a spot where the dragged
  // element can be dropped.
  dropElement?: any;

  // a callback when a sort has completed
  onSortOrderChanged(params: { originalIndex: number; newIndex: number }): void;
} & Omit<ListType, "children">;

interface State {
  dragging: null | ListChildComponentProps;
}

type AutoScrollKeyword = "up" | "down" | "none";

interface ScrollCompatibleList {
  scrollTo(scrollOffset: number): void;
  scrollToItem(index: number): void;
}

export const SortableFixedSizeList = React.forwardRef(
  (props: Props<FixedSizeListProps>, ref: Ref<any>) => {
    const { itemSize, ...rest } = props;
    return (
      <SortableVariableSizeList ref={ref} itemSize={() => itemSize} {...rest} />
    );
  }
);

export class SortableVariableSizeList extends React.Component<
  Props<VariableSizeListProps>,
  State
> {
  dragRef: RefObject<HTMLElement> = createRef();
  dropZoneRef: RefObject<HTMLDivElement> = createRef();
  listRef: RefObject<ScrollCompatibleList> = createRef();

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

    const { offsetTop, index } = this.getHoverDetails(newY);
    this.hoverIndex = index;
    dropRef.style.top = offsetTop + "px";
  }

  getHoverDetails(offsetY: number): { offsetTop: number; index: number } {
    let posY = 0;

    for (let i = 0; i < this.props.itemCount; i++) {
      const height = this.props.itemSize(i);

      if (offsetY < posY + height) {
        return {
          offsetTop: posY,
          index: i
        };
      }

      posY += height;
    }

    return {
      offsetTop: posY,
      index: this.props.itemCount - 1
    };
  }

  getScrollOffsetTop(list: ScrollCompatibleList): number {
    return this.getScrollRef(list).scrollTop;
  }

  getScrollRef(list: ScrollCompatibleList) {
    // @ts-ignore dangerously reach into list internals, so we can get a ref on the scroll element
    return list._outerRef as HTMLDivElement;
  }

  checkAutoScroll(mouseY: number) {
    if (this.listRef.current === null) return;

    const list = this.listRef.current as ScrollCompatibleList;
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
    const InnerElement = this.props.innerElementType;

    return React.forwardRef(({ children, ...rest }, ref: Ref<any>) => {
      const inner = (
        <React.Fragment>
          {children}
          {this.renderDraggingElement()}
          {this.renderDropZoneElement()}
        </React.Fragment>
      );

      if (InnerElement) {
        return (
          <InnerElement {...rest} ref={ref}>
            {inner}
          </InnerElement>
        );
      }

      return (
        <div {...rest} ref={ref}>
          {inner}
        </div>
      );
    });
  }

  render() {
    const { children, innerElementType, ...props } = this.props;

    return (
      <VariableSizeList
        ref={this.listRef as any}
        innerElementType={this.renderInnerElement()}
        {...props}
      >
        {params => this.renderChild(children, params)}
      </VariableSizeList>
    );
  }
}
