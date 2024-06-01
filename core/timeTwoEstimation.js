const axios = require("axios");
require("dotenv").config();

console.log(process.env.api_key, "******APIKEY************");
console.log("Somewhrer this just logs key");

const fetch_distance = async (
  origin,
  destination,
  retries = 10,
  delay = 1000
) => {
  try {
    let result = await axios.get(
      `https://api.distancematrix.ai/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&mode=driving&key=${process.env.api_key}`
    );

    console.log(result);

    if (result.data.rows[0].elements[0].status === "OK") {
      console.log(result.data.rows[0].elements);
      return result;
    }
    if (result.data.rows[0].elements[0].status == "ZERO_RESULTS") {
      throw new Error("Status is ZERO_RESULTS");
    }
  } catch (error) {
    console.error(`Error fetching distance: ${error}`);

    if (retries > 0) {
      console.log(
        `Retrying... ${retries} attempts left. Waiting for ${delay}ms before retry.`
      );
      await new Promise((resolve) => setTimeout(resolve, delay)); // Wait before retrying
      return await fetch_distance(origin, destination, retries - 1, delay * 2); // Exponential backoff
    } else {
      console.log(`Failed after multiple attempts.`);
      return { status: false };
    }
  }
};

const estimateTimeTwo = async (trips_arr, base_addr, multiplier, stop_time) => {
  console.log(trips_arr);
  //all the values are converted to seconds and from there are converted back to mins or hours format
  //that is why stop time has to be converted to seconds as well to make sure its added correctly
  stop_time = Number(stop_time) * Number(60);
  let base_address = base_addr;
  let pts = trips_arr.points;

  let estimates = [];

  for (let i = 0; i < pts.length; i++) {
    let duration_1 = await fetch_distance(
      pts[i].doc.origin_point_adress,
      base_address
    );

    if (i < pts.length - 1) {
      let first_step = await fetch_distance(
        pts[i].doc.origin_point_adress,
        pts[i + 1].doc.origin_point_adress
      );
      let second_step = await fetch_distance(
        pts[i + 1].doc.origin_point_adress,
        base_address
      );

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
  }

  const newData = estimates.map((obj) => {
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

    console.log(`Total time before adding stop time: ${totalTime}`);

    // Add stop time to the total time
    totalTime = Number(totalTime) + Number(stop_time);

    console.log(`Total time after adding stop time: ${totalTime}`);

    // Duration_1 time with stop time added
    let duration_1_drop_time_added =
      Number(duration_1.duration.value) + Number(stop_time);

    console.log(
      `Duration 1 with stop time added: ${duration_1_drop_time_added}`
    );

    // Convert total time to hours (round to two decimal places)
    let totalTimeInHours = (totalTime / 3600).toFixed(2);

    // Duration_1 converted to hours
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
  });

  console.log(newData);

  return newData;
};

module.exports = { estimateTimeTwo };
