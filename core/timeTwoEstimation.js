const axios = require("axios");

const fetch_distance = async (origin, destination) => {
  try {
    let result = await axios.get(
      `https://api.distancematrix.ai/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&mode=driving&key=wNKvwwrlvWheyBOd84pP8uIsbqhW1`
    );
    return result;
  } catch (error) {
    console.error(
      `Error fetching distance from ${origin} to ${destination}:`,
      error.message
    );
    return null; // Return null or some fallback value on error
  }
};

const estimateTimeTwo = async (
  trips_arr,
  base_addr,
  multiplier,
  stop_time = 15
) => {
  let base_address = base_addr;
  let pts = trips_arr.points;
  let estimates = [];

  for (let i = 0; i < pts.length; i++) {
    try {
      let duration_1 = await fetch_distance(
        pts[i].doc.origin_point_adress,
        base_address
      );
      if (!duration_1 || !duration_1.data.rows[0].elements[0].duration) {
        console.error(
          `Invalid duration_1 data for point ${pts[i].doc.origin_point_adress}`
        );
        continue; // Skip this iteration if data is invalid
      }

      if (i < pts.length - 1) {
        let first_step = await fetch_distance(
          pts[i].doc.origin_point_adress,
          pts[i + 1].doc.origin_point_adress
        );
        let second_step = await fetch_distance(
          pts[i + 1].doc.origin_point_adress,
          base_address
        );

        if (
          !first_step ||
          !second_step ||
          !first_step.data.rows[0].elements[0].duration ||
          !second_step.data.rows[0].elements[0].duration
        ) {
          console.error(
            `Invalid first_step or second_step data for points ${
              pts[i].doc.origin_point_adress
            } and ${pts[i + 1].doc.origin_point_adress}`
          );
          continue; // Skip this iteration if data is invalid
        }

        estimates.push({
          current_point: pts[i].name,
          next_point: pts[i + 1].name,
          origin: pts[i].doc.origin_point_adress,
          mid_point: pts[i + 1].doc.origin_point_adress,
          final_stop: base_address,
          first_step: JSON.stringify(first_step.data.rows[0].elements[0]),
          second_step: JSON.stringify(second_step.data.rows[0].elements[0]),
          duration_1: JSON.stringify(duration_1.data.rows[0].elements[0]),
        });
      }
    } catch (error) {
      console.error(`Error processing points at index ${i}:`, error.message);
      continue; // Skip this iteration on error
    }
  }

  const newData = estimates
    .map((obj) => {
      try {
        const firstStep = JSON.parse(obj.first_step);
        const secondStep = JSON.parse(obj.second_step);
        const duration_1 = JSON.parse(obj.duration_1);

        let first_step_with_multiplier =
          Number(firstStep.duration.value) * Number(multiplier);
        let second_step_step_with_multiplier =
          Number(secondStep.duration.value) * Number(multiplier);

        // Calculate total time in seconds
        let totalTime =
          Number(first_step_with_multiplier) +
          Number(second_step_step_with_multiplier);

        // Duration 1 time with drop time added
        let duration_1_drop_time_added =
          Number(duration_1.duration.value) + Number(stop_time);

        // Hardcoded for now needs to change to changeable variable and name will be stop time to drop time
        totalTime = Number(totalTime) + Number(stop_time);

        // Convert total time to hours (round to two decimal places)
        const totalTimeInHours = (totalTime / 3600).toFixed(2);

        // Duration 1 converted to hours
        let duration_1_in_hrs = (duration_1_drop_time_added / 3600).toFixed(2);

        // Create a new object with desired properties
        return {
          current_point: obj.current_point,
          next_point: obj.next_point,
          origin: obj.origin,
          mid_point: obj.mid_point,
          final_stop: obj.final_stop,
          totalTimeInHours: totalTimeInHours,
          duration_1: duration_1_in_hrs,
          duration_1_hrs: duration_1_in_hrs,
        };
      } catch (error) {
        console.error(
          `Error processing estimate for ${obj.current_point} to ${obj.next_point}:`,
          error.message
        );
        return null; // Return null or some fallback value on error
      }
    })
    .filter((item) => item !== null); // Filter out any null values resulting from errors

  console.log(newData);

  return newData;
};

module.exports = { estimateTimeTwo };
