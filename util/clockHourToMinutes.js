function clockhoursToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);

    // Calculating total minutes
    const totalMinutes = hours * 60 + minutes;

    return totalMinutes;
}

module.exports = { clockhoursToMinutes }