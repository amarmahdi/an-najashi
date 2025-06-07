import React from "react";
import Svg, { SvgProps, Path } from "react-native-svg";

interface ResponsiveSvgProps extends SvgProps {
  width?: number | string;
  height?: number | string;
}

const ResponsiveSvgComponent: React.FC<ResponsiveSvgProps> = ({ width = 96, height = 96, ...props }) => (
  <Svg
    width={width}
    height={height}
    fill="none"
    viewBox="0 0 96 96"
    {...props}
  >
    <Path
      fill="#1C64F2"
      fillRule="evenodd"
      d="M17.72 34.048a3 3 0 0 1 4.232-.324L48 56.048l26.048-22.324a3 3 0 0 1 3.904 4.552l-28 24a3 3 0 0 1-3.904 0l-28-24a3 3 0 0 1-.324-4.228"
      clipRule="evenodd"
    />
  </Svg>
);

export default ResponsiveSvgComponent;
