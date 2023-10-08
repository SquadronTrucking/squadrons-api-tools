const axios = require("axios");

const api_key = "wNKvwwrlvWheyBOd84pP8uIsbqhW1";

async function calculateDistances(point_one, point_two, dest, multiplier) {
  console.log(multiplier);
  const [first_estimate, second_estimate] = await Promise.all([
    axios.get(
      `https://api.distancematrix.ai/maps/api/distancematrix/json?origins=${point_one}&destinations=${point_two}&key=${api_key}`
    ),
    axios.get(
      `https://api.distancematrix.ai/maps/api/distancematrix/json?origins=${point_two}&destinations=${dest}&key=${api_key}`
    ),
  ]);

  const first_data = first_estimate.data;
  const { data } = second_estimate;

  console.log(data.rows[0].elements[0], "from time 2 ");
  console.log(
    manipulateTime(first_data.rows[0].elements[0].duration.text, multiplier),
    first_data.rows[0].elements[0].duration.text
  );
  console.log(
    manipulateTime(data.rows[0].elements[0].duration.text, multiplier),
    data.rows[0].elements[0].duration.text
  );

  //calculate time with multipler for vehicle speed control to detect near to accurate time
  let time = addTimeStrings(
    await manipulateTime(
      first_data.rows[0].elements[0].duration.text,
      multiplier
    ),
    await manipulateTime(data.rows[0].elements[0].duration.text, multiplier)
  );

  return time;
}

async function manipulateTime(inputString, multiplier) {
  // Define regular expressions for different input formats
  const hoursRegex = /(\d+)\s*hour/;
  const minutesRegex = /(\d+)\s*mins/;

  // Initialize variables for hours and minutes
  let hours = 0;
  let minutes = 0;

  // Extract hours if present
  const hoursMatch = inputString.match(hoursRegex);
  if (hoursMatch) {
    hours = parseInt(hoursMatch[1], 10);
  }

  // Extract minutes if present
  const minutesMatch = inputString.match(minutesRegex);
  if (minutesMatch) {
    minutes = parseInt(minutesMatch[1], 10);
  }

  // Convert hours and minutes to seconds
  const totalSeconds = hours * 3600 + minutes * 60;

  // Multiply by the multiplier
  const modifiedSeconds = totalSeconds * multiplier;

  // Convert back to hours and minutes
  const modifiedHours = Math.floor(modifiedSeconds / 3600);
  const remainingSeconds = modifiedSeconds % 3600;
  const modifiedMinutes = Math.floor(remainingSeconds / 60);

  // Create the modified time string
  let modifiedString = "";
  if (modifiedHours > 0) {
    modifiedString += `${modifiedHours} hour `;
  }
  if (modifiedMinutes > 0) {
    modifiedString += `${modifiedMinutes} mins`;
  }

  return modifiedString.trim();
}

async function addTimeStrings(string1, string2) {
  const hasHoursAndMinutes1 = hasHoursAndMinutes(string1);
  const hasHoursAndMinutes2 = hasHoursAndMinutes(string2);

  let hour_1 = hasHoursAndMinutes1 ? extractHours(string1) : 0;
  let mins_1 = hasHoursAndMinutes1
    ? extractMinutes(string1)
    : extractMinutesOnly(string1);

  let hour_2 = hasHoursAndMinutes2 ? extractHours(string2) : 0;
  let mins_2 = hasHoursAndMinutes2
    ? extractMinutes(string2)
    : extractMinutesOnly(string2);

  const formattedTime = addTimes(`${hour_1}:${mins_1}`, `${hour_2}:${mins_2}`);
  return formattedTime;
}

function hasHoursAndMinutes(str) {
  const pattern = /(\d+)\s*hour[s]*|\s*(\d+)\s*minute[s]*/g;
  return pattern.test(str);
}

function extractHours(str) {
  const pattern = /(\d+)\s*hour[s]*/;
  const match = str.match(pattern);

  return match ? parseInt(match[1]) : 0;
}

function extractMinutes(str) {
  const pattern = /(\d+)\s*mins[s]*/;
  const match = str.match(pattern);

  return match ? parseInt(match[1]) : 0;
}

function extractMinutesOnly(str) {
  const pattern = /(\d+)\s*mins/;
  const match = str.match(pattern);

  return match ? parseInt(match[1]) : 0;
}

function addTimes(timeStr1, timeStr2) {
  const [hours1, minutes1] = timeStr1.split(":").map(Number);
  const [hours2, minutes2] = timeStr2.split(":").map(Number);

  let totalHours = hours1 + hours2;
  let totalMinutes = minutes1 + minutes2;

  if (totalMinutes >= 60) {
    totalHours += Math.floor(totalMinutes / 60);
    totalMinutes %= 60;
  }

  return `${totalHours.toString().padStart(2, "0")}:${totalMinutes
    .toString()
    .padStart(2, "0")}`;
}

function subtractTimes(timeStr1, timeStr2) {
  const [hours1, minutes1] = timeStr1.split(":").map(Number);
  const [hours2, minutes2] = timeStr2.split(":").map(Number);

  let totalHours = hours1 - hours2;
  let totalMinutes = minutes1 - minutes2;

  if (totalMinutes < 0) {
    totalHours -= 1;
    totalMinutes += 60;
  }

  if (totalHours < 0) {
    totalHours += 24;
  }

  return `${totalHours.toString().padStart(2, "0")}:${totalMinutes
    .toString()
    .padStart(2, "0")}`;
}

module.exports = { calculateDistances, addTimes, subtractTimes };
