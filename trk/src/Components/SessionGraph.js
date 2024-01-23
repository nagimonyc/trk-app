import React from 'react';
import { View, Dimensions } from 'react-native';
import { Svg, Line, Circle, Text as SVGText } from 'react-native-svg';

const SessionGraph = ({ data }) => {

    console.log('Session Graph called');
    if (!data || (data && data.length == 0)) {
        return '';
    }   
    console.log('Data in the Session is: ', data);
    const screenWidth = Dimensions.get('window').width;
    const margin = 30;
    const svgWidth = screenWidth - margin;
    const lineSpacing = 40;

    const sortedData = data.sort((a, b) => a.tapTimestamp.toDate() - b.tapTimestamp.toDate());
    const minTimestamp = sortedData[0].tapTimestamp.toDate().getTime();
    const maxTimestamp = sortedData[sortedData.length - 1].tapTimestamp.toDate().getTime();

    const normalizeTimestamp = (timestamp) => {
    const timestampValue = timestamp.toDate().getTime();
    return ((timestampValue - minTimestamp) / (maxTimestamp - minTimestamp)) * (svgWidth - 2 * margin) + margin;
    };

    const uniqueGrades = [...new Set(data.map(item => item.grade))].sort().reverse();
    const svgHeight = uniqueGrades.length * lineSpacing + lineSpacing;
    const yScale = svgHeight / (uniqueGrades.length + 1);

    return (
    <View style={{ padding: 0, margin: 0 }}>
    <Svg height={svgHeight} width={svgWidth}>
    {uniqueGrades.map((grade, index) => (
    <Line
    key={`line-${grade}`}
    x1={margin / 2}
    y1={(index + 1) * yScale}
    x2={svgWidth - margin / 2}
    y2={(index + 1) * yScale}
    stroke="#DDD"
    strokeWidth="2"
    />
    ))}
    {sortedData.map((climb, index) => (
    <React.Fragment key={`fragment-${index}`}>
    <Circle
        cx={normalizeTimestamp(climb.tapTimestamp)}
        cy={uniqueGrades.indexOf(climb.grade) * yScale + yScale}
        r="15"
        fill="white"
        stroke="#fe8100"
        strokeWidth="1"
    />
    <SVGText
        x={normalizeTimestamp(climb.tapTimestamp)}
        y={uniqueGrades.indexOf(climb.grade) * yScale + yScale}
        fill="black"
        fontSize="10"
        textAnchor="middle"
        alignmentBaseline="central"
    >
        {climb.grade}
    </SVGText>
    </React.Fragment>
    ))}
    </Svg>
    </View>
    );
};
export default SessionGraph;