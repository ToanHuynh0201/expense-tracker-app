import Header from "@/components/Header";
import Loading from "@/components/Loading";
import ScreenWrapper from "@/components/ScreenWrapper";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import { scale, verticalScale } from "@/utils/styling";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";

const statistic = () => {
	const { user } = useAuth();
	const [activeIndex, setActiveIndex] = useState(0);
	const [chartData, setChartData] = useState([]);
	const [chartLoading, setChartLoading] = useState(false);

	useEffect(() => {
		if (activeIndex == 0) {
			getWeeklyStats();
		}
		if (activeIndex == 1) {
			getMonthlyStats();
		}
		if (activeIndex == 2) {
			getYearlyStats();
		}
	}, [activeIndex]);

	const getWeeklyStats = async () => {};
	const getMonthlyStats = async () => {};
	const getYearlyStats = async () => {};

	return (
		<ScreenWrapper>
			<View style={styles.container}>
				<View style={styles.header}>
					<Header title="Statistics"></Header>
				</View>

				<ScrollView
					contentContainerStyle={{
						gap: spacingY._20,
						paddingTop: spacingY._5,
						paddingBottom: verticalScale(100),
					}}
					showsVerticalScrollIndicator={false}
				>
					<SegmentedControl
						values={["Weekly", "Monthly", "Yearly"]}
						selectedIndex={activeIndex}
						onChange={(event) => {
							setActiveIndex(
								event.nativeEvent.selectedSegmentIndex
							);
						}}
						tintColor={colors.neutral200}
						backgroundColor={colors.neutral800}
						appearance="dark"
						activeFontStyle={styles.segmentFontStyle}
						style={styles.segmentStyle}
						fontStyle={{
							...styles.segmentFontStyle,
							color: colors.white,
						}}
					/>

					<View style={styles.chartContainer}>
						{chartData.length > 0 ? (
							<BarChart
								data={chartData}
								barWidth={scale(12)}
								spacing={
									[1, 2].includes(activeIndex)
										? scale(25)
										: scale(16)
								}
								roundedTop
								roundedBottom
								hideRules
								yAxisLabelPrefix="$"
								yAxisThickness={0}
								xAxisThickness={0}
								yAxisLabelWidth={
									[1, 2].includes(activeIndex)
										? scale(38)
										: scale(35)
								}
								yAxisTextStyle={{
									color: colors.neutral350,
								}}
								xAxisLabelTextStyle={{
									color: colors.neutral350,
									fontSize: verticalScale(12),
								}}
								noOfSections={3}
								minHeight={5}
								isAnimated={true}
								animationDuration={2000}
							></BarChart>
						) : (
							<View style={styles.noChart} />
						)}

						{chartLoading && (
							<View style={styles.chartLoadingContainer}>
								<Loading color={colors.white}></Loading>
							</View>
						)}
					</View>
				</ScrollView>
			</View>
		</ScreenWrapper>
	);
};

export default statistic;

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: spacingX._20,
		paddingVertical: spacingY._5,
		gap: spacingY._10,
	},
	header: {},
	segmentFontStyle: {
		fontSize: verticalScale(13),
		fontWeight: "bold",
		color: colors.black,
	},
	segmentStyle: {
		height: scale(37),
	},
	chartContainer: {
		position: "relative",
		justifyContent: "center",
		alignItems: "center",
	},
	noChart: {
		backgroundColor: "rgba(0, 0, 0, 0.6",
		height: verticalScale(210),
	},
	chartLoadingContainer: {
		position: "absolute",
		width: "100%",
		height: "100%",
		borderRadius: radius._12,
		backgroundColor: "rgba(0,0,0, 0.6)",
	},
});
