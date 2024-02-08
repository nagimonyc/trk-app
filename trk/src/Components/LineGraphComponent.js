import React from 'react';
import { View, Dimensions } from 'react-native';
import { Svg, Path, Circle, Text as SVGText, Defs, LinearGradient, Stop} from 'react-native-svg';

const LineGraphComponent = ({ data }) => {
    if (!data || data.length === 0) {
        return null;
    }

    const screenWidth = Dimensions.get('window').width;
    const margin = 15;
    const svgWidth = screenWidth - margin;
    const lineSpacing = 40;

    // Sort data by timestamp and then by grade to ensure uniqueness for highest and lowest grade points
    const sortedData = data.sort((a, b) => {
        const timeDiff = a.tapTimestamp.toDate() - b.tapTimestamp.toDate();
        if (timeDiff === 0) {
            return a.grade.localeCompare(b.grade); // Assuming grade is a string, adjust if necessary
        }
        return timeDiff;
    });
    const minTimestamp = sortedData[0].tapTimestamp.toDate().getTime();
    const maxTimestamp = sortedData[sortedData.length - 1].tapTimestamp.toDate().getTime();

    const normalizeTimestamp = (timestamp) => {
        const timestampValue = timestamp.toDate().getTime();
        return ((timestampValue - minTimestamp) / (maxTimestamp - minTimestamp)) * (svgWidth - 2 * margin) + margin;
    };

    const uniqueGrades = [...new Set(data.map(item => item.grade))].sort().reverse();
    const svgHeight = uniqueGrades.length * lineSpacing + lineSpacing;
    const yScale = svgHeight / (uniqueGrades.length + 1);

    let linePathD = "M";
    sortedData.forEach((climb, index) => {
        const x = normalizeTimestamp(climb.tapTimestamp);
        const y = uniqueGrades.indexOf(climb.grade) * yScale + yScale;
        linePathD += `${index === 0 ? '' : 'L'}${x},${y} `;
    });

    let areaPathD = `${linePathD}`;
    const lastDataPoint = sortedData[sortedData.length - 1];
    const lastX = normalizeTimestamp(lastDataPoint.tapTimestamp);
    areaPathD += `L${lastX},${svgHeight} L${margin},${svgHeight} Z`;

    // Flags to check if text for highest and lowest has been rendered
    let highestRendered = false;
    let lowestRendered = false;

    return (
        <View style={{ padding: 0, margin: 0 }}>
            <Svg height={svgHeight} width={svgWidth}>
                <Defs>
                        <LinearGradient id="gradientFill" x1="0" y1="0" x2="0" y2="100%">
                            <Stop offset="0%" stopColor="#fe8100" stopOpacity="0.4"/>
                            <Stop offset="100%" stopColor="#fe8100" stopOpacity="0.3" />
                        </LinearGradient>
                </Defs>
                {/* Shaded Area with Gradient */}
                <Path
                    d={areaPathD}
                    fill="url(#gradientFill)"
                />
                <Path d={linePathD} fill="none" stroke="none"/>
                {sortedData.map((climb, index) => {
                    const gradeIndex = uniqueGrades.indexOf(climb.grade);
                    const y = gradeIndex * yScale + yScale;

                    // Determine if the current item is the first instance of the highest or lowest grade
                    const isHighest = climb.grade === uniqueGrades[0] && !highestRendered;
                    const isLowest = climb.grade === uniqueGrades[uniqueGrades.length - 1] && !lowestRendered;
                    if (isHighest) highestRendered = true;
                    if (isLowest) lowestRendered = true;

                    return (
                        <React.Fragment key={`fragment-${index}`}>
                            <Circle
                                cx={normalizeTimestamp(climb.tapTimestamp)}
                                cy={y}
                                r="5"
                                fill="#fe8100"
                                stroke="white"
                                strokeWidth="0.5"
                            />
                            {(isHighest || isLowest) && (
                                <SVGText
                                    x={normalizeTimestamp(climb.tapTimestamp)}
                                    y={y - 15} // Adjusted for visibility
                                    fill="#fe8100"
                                    fontWeight="500"
                                    fontSize="12"
                                    textAnchor="middle"
                                    alignmentBaseline="middle"
                                >
                                    {climb.grade}
                                </SVGText>
                            )}
                        </React.Fragment>
                    );
                })}
            </Svg>
        </View>
    );
};
export default LineGraphComponent;



