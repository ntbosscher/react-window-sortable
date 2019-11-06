
# React Window Sortable

This library provides sort functionality for very large lists.

This library wraps Brian Vaughn's excellent library [react-window](https://github.com/bvaughn/react-window)
to hand off list virtualization.

## Features
- Drag and drop to re-order list items
- Start drag with customized element or button
- Auto-scrolls when you drag something near the start or end of scroll view
- Can handle giant lists (+100 elements)
- Handles vertical lists only
- Very customizable

## Install

```
# yarn
yarn add react-window-sortable

# npm
npm install --save react-window-sortable 
```

## Usage

Fixed Size List (for rows of equal height) [full example](./example-fixed-sized-list.tsx)

```tsx
<SortableFixedSizeList
    height={height}
    width={width}
    itemCount={n}
    itemSize={30}
    itemData={this.state.data}
    onSortOrderChanged={({originalIndex, newIndex}) => {
        move(this.state.data, originalIndex, newIndex);
        this.setState({
            data: this.state.data.slice(0),
        })
    }}
>
    {React.forwardRef(({data, index, style, onSortMouseDown}: ChildrenProps, ref: Ref<any>) => (
        <div ref={ref} style={style}>
            <button onMouseDown={onSortMouseDown}>drag handle</button>
            {data[index]}
        </div>
    ))}
</SortableFixedSizeList>
```

Variable Size List (for rows of variable height) [full example](./example-variable-sized-list.tsx)

```tsx
<SortableVariableSizeList
    height={height}
    width={width}
    itemCount={n}
    itemSize={index => index % 2 === 0 ? 30 : 50}
    itemData={this.state.data}
    onSortOrderChanged={({originalIndex, newIndex}: {originalIndex: number, newIndex: number}) => {
        move(this.state.data, originalIndex, newIndex);
        this.setState({
            data: this.state.data.slice(0),
        })
    }}
>
    {React.forwardRef(({data, index, style, onSortMouseDown}: ChildrenProps, ref: Ref<any>) => (
        <div ref={ref} style={style}>
            <button onMouseDown={onSortMouseDown}>drag handle</button>
            {data[index]}
        </div>
    ))}
</SortableVariableSizeList>
```

## API

```ts
interface Props {
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
    
    // the height of the scroll window (px) 
    // you may want to use https://github.com/bvaughn/react-virtualized-auto-sizer
    // for this.
    height: number;
    
    // the width of the scroll window (px) 
    // you may want to use https://github.com/bvaughn/react-virtualized-auto-sizer
    // for this.
    width: number;
    
    // number of rows in data set
    itemCount: number;
    
    // height of the list item in px
    // for FixedSizedLists, this will be a constant.
    // for VariableSizedLists, this will be a lookup function
    itemSize: number | (index) => number;
    
    // the data to pass to the render function
    itemData: any[];
}
```