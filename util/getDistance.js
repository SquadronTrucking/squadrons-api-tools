const axios = require("axios");

const api_key = "wNKvwwrlvWheyBOd84pP8uIsbqhW1";

async function calculateDistances(point_one, point_two, dest) {
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

  let time = addTimeStrings(
    first_data.rows[0].elements[0].duration.text,
    data.rows[0].elements[0].duration.text
  );

  return time;
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
