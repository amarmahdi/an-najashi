import * as React from "react"
import Svg, { SvgProps, Path } from "react-native-svg"
const SvgComponent = (props: SvgProps) => (
  <Svg
    fill="none"
    viewBox="0 0 500 800" // Adjust the viewBox to match the aspect ratio of your SVG
    {...props}
  >
    <Path
      fill="#1E429F"
      stroke="#1E429F"
      strokeWidth={9.885}
      d="M33.816 773.778 29.357 361.03c0-20.438 24.508-71.535 78.013-71.535v-62.449c0-20.439 13.376-66.426 84.715-91.974 46.37-24.527 60.207-67.563 60.207-67.563s12.168 43.036 58.538 67.563c71.339 25.548 84.715 71.535 84.715 91.974v62.449c53.505 0 79.681 39.744 79.681 60.182l-4.459 424.101H33.816Z"
    />
  </Svg>
)
export default SvgComponent
