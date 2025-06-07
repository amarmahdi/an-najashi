import * as React from "react";
import { Dimensions } from "react-native";
import Svg, { SvgProps, G, Path, Rect } from "react-native-svg";

const SvgComponent = (props: SvgProps) => {
  return (
    <Svg
      width={props.width}
      height={props.height}
      fill="none"
      viewBox="0 0 1920 1080"
      {...props}
    >
      {/* Background */}
      <Rect width="100%" height="100%" fill="#EBF5FF" />
      
      {/* Top border pattern */}
      <G>
        <Path
          fill="#76A9FA"
          d="M0 0h1920v60H0z"
        />
        <Path
          fill="#EBF5FF"
          d="M60 15h30v30H60zM120 15h30v30h-30zM180 15h30v30h-30zM240 15h30v30h-30zM300 15h30v30h-30zM360 15h30v30h-30zM420 15h30v30h-30zM480 15h30v30h-30zM540 15h30v30h-30zM600 15h30v30h-30zM660 15h30v30h-30zM720 15h30v30h-30zM780 15h30v30h-30zM840 15h30v30h-30zM900 15h30v30h-30zM960 15h30v30h-30zM1020 15h30v30h-30zM1080 15h30v30h-30zM1140 15h30v30h-30zM1200 15h30v30h-30zM1260 15h30v30h-30zM1320 15h30v30h-30zM1380 15h30v30h-30zM1440 15h30v30h-30zM1500 15h30v30h-30zM1560 15h30v30h-30zM1620 15h30v30h-30zM1680 15h30v30h-30zM1740 15h30v30h-30zM1800 15h30v30h-30zM1860 15h30v30h-30z"
        />
      </G>
      
      {/* Bottom border pattern */}
      <G>
        <Path
          fill="#76A9FA"
          d="M0 1020h1920v60H0z"
        />
        <Path
          fill="#EBF5FF"
          d="M60 1035h30v30H60zM120 1035h30v30h-30zM180 1035h30v30h-30zM240 1035h30v30h-30zM300 1035h30v30h-30zM360 1035h30v30h-30zM420 1035h30v30h-30zM480 1035h30v30h-30zM540 1035h30v30h-30zM600 1035h30v30h-30zM660 1035h30v30h-30zM720 1035h30v30h-30zM780 1035h30v30h-30zM840 1035h30v30h-30zM900 1035h30v30h-30zM960 1035h30v30h-30zM1020 1035h30v30h-30zM1080 1035h30v30h-30zM1140 1035h30v30h-30zM1200 1035h30v30h-30zM1260 1035h30v30h-30zM1320 1035h30v30h-30zM1380 1035h30v30h-30zM1440 1035h30v30h-30zM1500 1035h30v30h-30zM1560 1035h30v30h-30zM1620 1035h30v30h-30zM1680 1035h30v30h-30zM1740 1035h30v30h-30zM1800 1035h30v30h-30zM1860 1035h30v30h-30z"
        />
      </G>
    </Svg>
  );
};

export default SvgComponent;
