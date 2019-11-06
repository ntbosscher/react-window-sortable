import React, { Ref } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import "./App.css";
import {
  ChildrenProps,
  SortableFixedSizeList,
  SortableVariableSizeList
} from "./src";

const data: any[] = [];
const n = 1000;

for (var i = 0; i < n; i++) data.push(i.toString());

interface State {
  data: any[];
}

function move<T>(array: T[], from: number, to: number) {
  array.splice(to, 0, array.splice(from, 1)[0]);
}

class App extends React.Component<{}, State> {
  constructor(props: any) {
    super(props);

    this.state = {
      data: data
    };
  }

  render() {
    return (
      <div style={{ width: "100%", height: "100%" }}>
        <AutoSizer>
          {({ height, width }: { height: number; width: number }) => (
            <SortableFixedSizeList
              height={height}
              width={width}
              itemCount={n}
              itemSize={30}
              itemData={this.state.data}
              onSortOrderChanged={({ originalIndex, newIndex }) => {
                move(this.state.data, originalIndex, newIndex);
                this.setState({
                  data: this.state.data.slice(0)
                });
              }}
            >
              {React.forwardRef(
                (
                  { data, index, style, onSortMouseDown }: ChildrenProps,
                  ref: Ref<any>
                ) => (
                  <div ref={ref} style={style}>
                    <button onMouseDown={onSortMouseDown}>drag handle</button>
                    {data[index]}
                  </div>
                )
              )}
            </SortableFixedSizeList>
          )}
        </AutoSizer>
      </div>
    );
  }
}

export default App;
