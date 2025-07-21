import React, { useContext } from 'react';
import { View, Text, Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { ThemeContext } from '../context/ThemeContext';

const screenWidth = Dimensions.get('window').width;

const BudgetPieChart = ({ data, onSlicePress }) => {
  const { isDarkMode } = useContext(ThemeContext)

  if (!data || typeof data !== 'object') return null;

  const chartData = Object.entries(data)
    .map(([category, expenses], index) => {
      const total = Object.values(expenses).reduce((sum, val) => sum + val, 0);
      return {
        name: category,
        population: total,
        color: getColor(index),
        legendFontColor: isDarkMode ? '#FFF' : '#000',
        legendFontSize: 14,
      };
    })
    .filter(item => item.population > 0);

  if (chartData.length === 0) {
    return <Text style={styles.empty}>No budget data to show.</Text>;
  }

    // Calculates total population
    const totalPopulation = chartData.reduce((sum, item) => sum + item.population, 0);
    let cumulativeAngle = 0;

  return (
    <View style={styles.container}>
      <PieChart
        data={chartData}
        width={screenWidth - 32}
        height={220}
        chartConfig={{
          color: () => `rgba(0, 0, 0, 0.5)`,
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="16"
        center={[0, 0]}
        absolute
      />
     {chartData.map((slice, index) => {
        const angle = (slice.population / totalPopulation) * 360;
        const touchableStyle = calculateTouchableStyle(cumulativeAngle, angle, index);
        cumulativeAngle += angle;

        return (
          <TouchableOpacity
            key={index}
            style={[styles.touchableOverlay, touchableStyle]}
            onPress={() => onSlicePress(slice.name)}
          />
        );
      })}
    </View>
  );
};

const calculateTouchableStyle = (startAngle, sliceAngle, index) => {
  const radius = 100; // Adjust based on your pie chart's radius
  const centerX = (Dimensions.get('window').width - 32) / 2; // Center of the pie chart
  const centerY = 110; // Adjust based on your pie chart's height

  // Calculate the start and end angles in radians
  const startAngleRad = (startAngle * Math.PI) / 180;
  const endAngleRad = ((startAngle + sliceAngle) * Math.PI) / 180;

  // Calculate the coordinates for the touchable area
  const x1 = centerX + radius * Math.cos(startAngleRad);
  const y1 = centerY + radius * Math.sin(startAngleRad);
  const x2 = centerX + radius * Math.cos(endAngleRad);
  const y2 = centerY + radius * Math.sin(endAngleRad);

  // Calculate the width and height of the touchable area
  const width = Math.abs(x2 - x1);
  const height = Math.abs(y2 - y1);

  return {
    position: 'absolute',
    top: centerY - height / 2,
    left: centerX - width / 2,
    width: width,
    height: height,
    borderRadius: 50, // Optional: to make it more circular
  };
};

const getColor = (index) => {
  const colors = [
    '#71B5F9',
    '#DA59F7',
    '#F66969',
    '#FFD677',
    '#62EB9B',
    '#FEA201',
    '#F055A5',
    '#93D8D5',
    '#D2B3DB',
    '#EFACA5',
  ];
  return colors[index % colors.length];
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 24,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  empty: {
    marginTop: 20,
    color: '#999',
    textAlign: 'center',
  },
  touchableOverlay: {
    position: 'absolute',
},
});

export default BudgetPieChart;
